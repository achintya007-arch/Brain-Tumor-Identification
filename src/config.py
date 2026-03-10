import os

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRAIN_DIR       = os.path.join(BASE_DIR, "dataset", "train")
TEST_DIR        = os.path.join(BASE_DIR, "dataset", "test")
OUTPUT_DIR      = os.path.join(BASE_DIR, "outputs")
MODEL_DIR       = os.path.join(OUTPUT_DIR, "models")
PLOT_DIR        = os.path.join(OUTPUT_DIR, "plots")
GRADCAM_DIR     = os.path.join(OUTPUT_DIR, "gradcam")

for d in [MODEL_DIR, PLOT_DIR, GRADCAM_DIR]:
    os.makedirs(d, exist_ok=True)

BEST_MODEL_PATH = os.path.join(MODEL_DIR, "best_model.keras")

# ── Model / Training ──────────────────────────────────────────────────────────
IMG_SIZE        = (224, 224)
BATCH_SIZE      = 16
NUM_CLASSES     = 4
CLASS_NAMES     = ["glioma", "meningioma", "notumor", "pituitary"]

EPOCHS_HEAD     = 10           # Phase 1: backbone frozen
EPOCHS_FINE     = 15           # Phase 2: top 30% of backbone unfrozen

LR_HEAD         = 1e-3         # Higher LR is fine when backbone is frozen
LR_FINE         = 1e-5         # Must be low to avoid destroying pretrained weights
WEIGHT_DECAY    = 1e-4
LABEL_SMOOTHING = 0.1
DROPOUT_RATE    = 0.5
DENSE_UNITS     = 512

FINE_TUNE_FROM_PERCENT = 0.70  # Unfreeze layers after this fraction of the backbone