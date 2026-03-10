import os
os.environ["TF_GPU_THREAD_MODE"] = "gpu_private"  # Reduces GPU thread contention in WSL

import tensorflow as tf

# ── GPU Setup (must run before any other TF ops) ──────────────────────────────
gpus = tf.config.list_physical_devices('GPU')
print("GPUs detected:", gpus)
if gpus:
    for gpu in gpus:
        tf.config.experimental.set_memory_growth(gpu, True)

from tensorflow.keras import mixed_precision
mixed_precision.set_global_policy('mixed_float16')

from tensorflow.keras.losses import CategoricalCrossentropy
from tensorflow.keras.optimizers import AdamW

from src.config import (
    BEST_MODEL_PATH, EPOCHS_HEAD, EPOCHS_FINE,
    LR_HEAD, LR_FINE, WEIGHT_DECAY, LABEL_SMOOTHING,
    FINE_TUNE_FROM_PERCENT, PLOT_DIR
)
from src.dataset import load_datasets, get_class_weights
from src.model import build_model, unfreeze_top_layers

import matplotlib.pyplot as plt


def get_callbacks():
    return [
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_accuracy", factor=0.5, patience=3, verbose=1
        ),
        tf.keras.callbacks.ModelCheckpoint(
            BEST_MODEL_PATH, monitor="val_accuracy",
            save_best_only=True, verbose=1
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=5,
            restore_best_weights=True, verbose=1
        ),
    ]


def plot_history(histories: list, labels: list):
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    for history, label in zip(histories, labels):
        axes[0].plot(history.history["accuracy"],     label=f"{label} train acc")
        axes[0].plot(history.history["val_accuracy"], label=f"{label} val acc", linestyle="--")
        axes[1].plot(history.history["loss"],         label=f"{label} train loss")
        axes[1].plot(history.history["val_loss"],     label=f"{label} val loss", linestyle="--")
    for ax, title in zip(axes, ["Accuracy", "Loss"]):
        ax.set_title(title)
        ax.legend()
        ax.grid(True)
    plt.tight_layout()
    path = f"{PLOT_DIR}/training_curves.png"
    plt.savefig(path)
    print(f"Training curves saved to {path}")
    plt.show()


def main():
    train_ds, test_ds, class_names = load_datasets()
    class_weights = get_class_weights(train_ds)
    model, base_model = build_model()
    model.summary()

    # ── Phase 1: Train head only (backbone frozen) ────────────────────────────
    print("\n=== PHASE 1: Training head (backbone frozen) ===")
    model.compile(
        optimizer=AdamW(learning_rate=LR_HEAD, weight_decay=WEIGHT_DECAY),
        loss=CategoricalCrossentropy(label_smoothing=LABEL_SMOOTHING),
        metrics=["accuracy"]
    )
    history_head = model.fit(
        train_ds,
        validation_data=test_ds,
        epochs=EPOCHS_HEAD,
        class_weight=class_weights,
        callbacks=get_callbacks()
    )

    # ── Phase 2: Fine-tune top backbone layers ────────────────────────────────
    print("\n=== PHASE 2: Fine-tuning top backbone layers ===")
    unfreeze_top_layers(base_model, from_percent=FINE_TUNE_FROM_PERCENT)
    model.compile(
        optimizer=AdamW(learning_rate=LR_FINE, weight_decay=WEIGHT_DECAY),
        loss=CategoricalCrossentropy(label_smoothing=LABEL_SMOOTHING),
        metrics=["accuracy"]
    )
    history_fine = model.fit(
        train_ds,
        validation_data=test_ds,
        epochs=EPOCHS_FINE,
        class_weight=class_weights,
        callbacks=get_callbacks()
    )

    plot_history([history_head, history_fine], ["Phase 1", "Phase 2"])
    print(f"\nBest model saved to: {BEST_MODEL_PATH}")


if __name__ == "__main__":
    main()