import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.preprocessing import label_binarize

from src.config import BEST_MODEL_PATH, PLOT_DIR, NUM_CLASSES
from src.dataset import load_datasets


def evaluate():
    _, test_ds, class_names = load_datasets()
    model = tf.keras.models.load_model(BEST_MODEL_PATH)
    print(f"Loaded model from {BEST_MODEL_PATH}")

    y_true, y_pred, y_prob = [], [], []
    for images, labels in test_ds:
        probs = model.predict(images, verbose=0)
        y_true.extend(np.argmax(labels.numpy(), axis=1))
        y_pred.extend(np.argmax(probs, axis=1))
        y_prob.extend(probs)

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    y_prob = np.array(y_prob)

    # ── Classification Report ─────────────────────────────────────────────────
    print("\n=== Classification Report ===")
    print(classification_report(y_true, y_pred, target_names=class_names))

    # ── ROC-AUC (much more meaningful than accuracy for medical imaging) ───────
    y_true_bin = label_binarize(y_true, classes=range(NUM_CLASSES))
    roc_auc = roc_auc_score(y_true_bin, y_prob, multi_class="ovr", average="macro")
    print(f"Macro ROC-AUC: {roc_auc:.4f}")

    per_class_auc = roc_auc_score(y_true_bin, y_prob, multi_class="ovr", average=None)
    for name, auc in zip(class_names, per_class_auc):
        print(f"  {name}: AUC = {auc:.4f}")

    # ── Confusion Matrix ──────────────────────────────────────────────────────
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(
        cm, annot=True, fmt="d",
        xticklabels=class_names,
        yticklabels=class_names,
        cmap="Blues"
    )
    plt.title("Confusion Matrix")
    plt.ylabel("True Label")
    plt.xlabel("Predicted Label")
    plt.tight_layout()
    path = f"{PLOT_DIR}/confusion_matrix.png"
    plt.savefig(path)
    print(f"\nConfusion matrix saved to {path}")
    plt.show()


if __name__ == "__main__":
    evaluate()