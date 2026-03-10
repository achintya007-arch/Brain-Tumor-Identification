"""
predict.py — Run inference on a single MRI image.

Usage:
    python predict.py path/to/image.jpg
"""

import sys
import numpy as np
import tensorflow as tf

from src.config import BEST_MODEL_PATH, IMG_SIZE, CLASS_NAMES


def predict_single(image_path: str):
    model = tf.keras.models.load_model(BEST_MODEL_PATH)

    img = tf.keras.utils.load_img(image_path, target_size=IMG_SIZE)
    img_array = tf.keras.utils.img_to_array(img)
    img_input = tf.expand_dims(img_array, axis=0)

    probs = model.predict(img_input, verbose=0)[0]
    pred_class = CLASS_NAMES[np.argmax(probs)]
    confidence = np.max(probs) * 100

    print(f"\nPrediction : {pred_class}")
    print(f"Confidence : {confidence:.2f}%")
    print("\nAll class probabilities:")
    for name, prob in zip(CLASS_NAMES, probs):
        print(f"  {name:12s}: {prob * 100:.2f}%")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py <path_to_image>")
        sys.exit(1)
    predict_single(sys.argv[1])