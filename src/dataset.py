import tensorflow as tf
import numpy as np
from sklearn.utils.class_weight import compute_class_weight
from src.config import TRAIN_DIR, TEST_DIR, IMG_SIZE, BATCH_SIZE

AUTOTUNE = tf.data.AUTOTUNE

# ── Augmentation (training only) ──────────────────────────────────────────────
# Kept conservative — aggressive transforms can distort clinically relevant features in MRIs
augment = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal"),
    tf.keras.layers.RandomRotation(0.08),
    tf.keras.layers.RandomZoom(0.08),
    tf.keras.layers.RandomContrast(0.1),
], name="augmentation")


def build_dataset(directory: str, shuffle: bool, use_augmentation: bool = False):
    ds = tf.keras.utils.image_dataset_from_directory(
        directory,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        shuffle=shuffle,
        label_mode="categorical"
    )
    if use_augmentation:
        ds = ds.map(
            lambda x, y: (augment(x, training=True), y),
            num_parallel_calls=AUTOTUNE
        )
    # cache() keeps decoded images in RAM — GPU never waits on disk after epoch 1
    return ds.cache().prefetch(buffer_size=AUTOTUNE)


def get_class_weights(dataset) -> dict:
    """
    Computes balanced class weights to handle the meningioma underrepresentation
    common in the Kaggle brain tumor dataset.
    """
    all_labels = np.concatenate([
        y.numpy().argmax(axis=1) for _, y in dataset
    ])
    weights = compute_class_weight(
        class_weight="balanced",
        classes=np.unique(all_labels),
        y=all_labels
    )
    weight_dict = dict(enumerate(weights))
    print("Class weights:", weight_dict)
    return weight_dict


def load_datasets():
    train_ds = build_dataset(TRAIN_DIR, shuffle=True,  use_augmentation=True)
    test_ds  = build_dataset(TEST_DIR,  shuffle=False, use_augmentation=False)
    class_names = tf.keras.utils.image_dataset_from_directory(
        TRAIN_DIR, label_mode="categorical"
    ).class_names
    print("Classes:", class_names)
    return train_ds, test_ds, class_names