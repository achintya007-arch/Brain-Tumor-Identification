import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import EfficientNetV2L
from src.config import IMG_SIZE, NUM_CLASSES, DENSE_UNITS, DROPOUT_RATE


def build_model() -> models.Model:
    base_model = EfficientNetV2L(
        include_top=False,
        weights="imagenet",
        input_shape=(*IMG_SIZE, 3)
    )
    base_model.trainable = False

    inputs = layers.Input(shape=(*IMG_SIZE, 3))
    x = tf.keras.applications.efficientnet_v2.preprocess_input(inputs)
    x = base_model(x, training=False)

    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dense(DENSE_UNITS, activation="relu")(x)
    x = layers.Dropout(DROPOUT_RATE)(x)

    # IMPORTANT: final Dense must stay float32 when using mixed precision.
    # Softmax in float16 can silently produce NaNs on small logit differences.
    outputs = layers.Dense(NUM_CLASSES, dtype="float32")(x)
    outputs = layers.Activation("softmax", dtype="float32")(outputs)

    return models.Model(inputs, outputs), base_model


def unfreeze_top_layers(base_model: models.Model, from_percent: float = 0.70):
    """Unfreeze the top (1 - from_percent) fraction of backbone layers for fine-tuning."""
    base_model.trainable = True
    freeze_until = int(len(base_model.layers) * from_percent)
    for layer in base_model.layers[:freeze_until]:
        layer.trainable = False
    trainable_count = sum(1 for l in base_model.layers if l.trainable)
    print(f"Unfroze {trainable_count} / {len(base_model.layers)} backbone layers")