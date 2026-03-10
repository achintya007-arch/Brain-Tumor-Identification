import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
import cv2
import os

from src.config import BEST_MODEL_PATH, GRADCAM_DIR, IMG_SIZE, CLASS_NAMES


def make_gradcam_heatmap(img_array: np.ndarray, model: tf.keras.Model) -> np.ndarray:
    """
    Generate a Grad-CAM heatmap.

    We use the backbone's final output (7x7x1280) as the conv layer.
    Trying to split at top_conv inside the nested EfficientNetV2L graph breaks
    gradient flow in Keras Functional models — using backbone.output avoids this
    entirely while still producing accurate spatial heatmaps.
    """
    backbone = model.get_layer("efficientnetv2-l")

    # Find where backbone sits in the main model's layer list
    backbone_idx = next(
        i for i, l in enumerate(model.layers) if l.name == "efficientnetv2-l"
    )

    with tf.GradientTape() as tape:
        img_float = tf.cast(img_array, tf.float32)

        # Preprocess and run backbone — watch the spatial feature map
        preprocessed = tf.keras.applications.efficientnet_v2.preprocess_input(img_float)
        conv_outputs = backbone(preprocessed, training=False)
        tape.watch(conv_outputs)

        # Run the head (GAP → BN → Dense → Dropout → Dense → Softmax)
        # Predictions flow THROUGH conv_outputs so gradients are non-zero
        x = conv_outputs
        for layer in model.layers[backbone_idx + 1:]:
            try:
                x = layer(x, training=False)
            except TypeError:
                x = layer(x)
        predictions = x

        pred_index = tf.argmax(predictions[0])
        class_channel = predictions[:, pred_index]

    grads = tape.gradient(class_channel, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    heatmap = conv_outputs[0] @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)
    return heatmap.numpy()


def overlay_gradcam(img, heatmap, alpha=0.4):
    import cv2
    import numpy as np

    img = np.array(img)

    if len(heatmap.shape) == 3:
        heatmap = heatmap.squeeze()

    heatmap = np.maximum(heatmap, 0)
    heatmap /= (np.max(heatmap) + 1e-8)

    heatmap = np.uint8(255 * heatmap)

    h, w = img.shape[:2]
    heatmap = cv2.resize(heatmap, (w, h))

    heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

    overlay = cv2.addWeighted(img.astype(np.uint8), 1 - alpha, heatmap, alpha, 0)

    return overlay


def run_gradcam_on_batch(test_ds, num_images: int = 8):
    """Run Grad-CAM on the first num_images from the test set and save a grid."""
    model = tf.keras.models.load_model(BEST_MODEL_PATH)
    print("Model loaded successfully.")

    images_shown = 0
    fig, axes = plt.subplots(num_images, 3, figsize=(12, num_images * 4))
    fig.suptitle("Grad-CAM Visualisation\n(Original | Heatmap | Overlay)", fontsize=14)

    for images, labels in test_ds:
        for i in range(len(images)):
            if images_shown >= num_images:
                break

            img = images[i].numpy().astype(np.uint8)
            img_input = tf.expand_dims(images[i], axis=0)
            true_label = CLASS_NAMES[np.argmax(labels[i].numpy())]

            heatmap = make_gradcam_heatmap(img_input, model)
            overlay = overlay_gradcam(img, heatmap)

            pred = model.predict(img_input, verbose=0)
            pred_label = CLASS_NAMES[np.argmax(pred)]
            confidence = np.max(pred) * 100

            row = images_shown
            axes[row, 0].imshow(img)
            axes[row, 0].set_title(f"True: {true_label}")
            axes[row, 0].axis("off")

            axes[row, 1].imshow(heatmap, cmap="jet")
            axes[row, 1].set_title("Heatmap")
            axes[row, 1].axis("off")

            axes[row, 2].imshow(overlay)
            axes[row, 2].set_title(f"Pred: {pred_label} ({confidence:.1f}%)")
            axes[row, 2].axis("off")

            images_shown += 1
            print(f"Processed {images_shown}/{num_images} images")

        if images_shown >= num_images:
            break

    plt.tight_layout()
    path = os.path.join(GRADCAM_DIR, "gradcam_results.png")
    plt.savefig(path, dpi=150)
    print(f"\nGrad-CAM saved to {path}")


if __name__ == "__main__":
    from src.dataset import load_datasets
    _, test_ds, _ = load_datasets()
    run_gradcam_on_batch(test_ds, num_images=8)