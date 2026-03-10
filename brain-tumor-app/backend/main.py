"""
Brain Tumor Classifier — FastAPI backend
Run: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import io
import os
import base64
import contextlib
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

# ── TensorFlow setup ──────────────────────────────────────────────────────────
# MUST happen before any other tf imports or model operations.
# The model was trained with mixed_float16 — loading without this policy causes
# float16 ops to fall back to a CPU path that requires AVX-512 (→ 500 error).
import tensorflow as tf

tf.keras.mixed_precision.set_global_policy("float32")

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# ── Config ────────────────────────────────────────────────────────────────────
# Priority 1: MODEL_PATH env var (set by Docker / CI)
# Priority 2: inferred relative to this file  (local dev)
#   main.py → backend/ → brain-tumor-app/ → brain-tumor-identification/ → outputs/
_env = os.getenv("MODEL_PATH")
MODEL_PATH = Path(_env) if _env else (
    Path(__file__).resolve().parent.parent.parent
    / "outputs" / "models" / "best_model.keras"
)

IMG_SIZE    = (224, 224)
CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]

CLASS_INFO = {
    "glioma": {
        "description": "Gliomas originate from glial cells in the brain or spinal cord. They are the most common and aggressive type of primary brain tumour.",
        "severity": "high",
        "color": "#ef4444",
    },
    "meningioma": {
        "description": "Meningiomas arise from the meninges surrounding the brain and spinal cord. Most are benign, but location can cause significant neurological symptoms.",
        "severity": "medium",
        "color": "#f97316",
    },
    "notumor": {
        "description": "No tumour detected. The MRI scan appears normal with no signs of malignancy or neoplastic tissue.",
        "severity": "none",
        "color": "#22c55e",
    },
    "pituitary": {
        "description": "Pituitary tumours form in the pituitary gland and disrupt hormone regulation. Most are benign adenomas.",
        "severity": "medium",
        "color": "#f97316",
    },
}

# ── Model singleton ───────────────────────────────────────────────────────────
_model: tf.keras.Model | None = None


@contextlib.asynccontextmanager
async def lifespan(_app: FastAPI):
    """Load model once at startup so /health immediately reflects real state."""
    global _model
    if not MODEL_PATH.exists():
        print(f"[WARNING] Model file not found: {MODEL_PATH}")
        print("          Run training first:  python -m src.train")
    else:
        print(f"[startup] Loading model: {MODEL_PATH}")
        _model = tf.keras.models.load_model(str(MODEL_PATH))
        print("[startup] ✓ Model ready")
    yield
    _model = None


app = FastAPI(
    title="Brain Tumor Classifier",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_model() -> tf.keras.Model:
    if _model is None:
        raise HTTPException(
            status_code=503,
            detail=f"Model not loaded. Check that {MODEL_PATH} exists and restart.",
        )
    return _model


# ── Image helpers ─────────────────────────────────────────────────────────────

def preprocess(image: Image.Image) -> tuple[np.ndarray, tf.Tensor]:
    """
    Returns:
        img_arr  — float32 numpy array (H, W, 3)  — used for Grad-CAM overlay
        img_input — float32 tensor  (1, H, W, 3)  — fed to model.predict
    """
    arr = np.array(image.convert("RGB").resize(IMG_SIZE), dtype=np.float32)
    return arr, tf.expand_dims(arr, axis=0)


def to_base64(arr: np.ndarray) -> str:
    buf = io.BytesIO()
    Image.fromarray(arr.astype(np.uint8)).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


# ── Grad-CAM ──────────────────────────────────────────────────────────────────

def gradcam_heatmap(img_input: tf.Tensor, model: tf.keras.Model) -> np.ndarray:
    """Compute Grad-CAM heatmap for the top predicted class."""
    backbone   = model.get_layer("efficientnetv2-l")
    grad_model = tf.keras.Model(
        inputs=model.inputs,
        outputs=[backbone.get_layer("top_conv").output, model.output],
    )

    with tf.GradientTape() as tape:
        conv_out, preds = grad_model(img_input, training=False)
        top_class       = preds[:, tf.argmax(preds[0])]

    grads = tape.gradient(top_class, conv_out)

    # Cast to float32 — conv_out and grads are float16 under mixed precision.
    # float16 overflows in the pooling/matmul and produces NaN heatmaps.
    grads    = tf.cast(grads,    tf.float32)
    conv_out = tf.cast(conv_out, tf.float32)

    pooled  = tf.reduce_mean(grads, axis=(0, 1, 2))
    heatmap = tf.squeeze(conv_out[0] @ pooled[..., tf.newaxis])
    heatmap = tf.maximum(heatmap, 0)
    heatmap = heatmap / (tf.reduce_max(heatmap) + 1e-8)
    return heatmap.numpy()


def gradcam_overlay(img_arr: np.ndarray, heatmap: np.ndarray) -> np.ndarray:
    h, w    = img_arr.shape[:2]
    colored = cv2.applyColorMap(
        np.uint8(255 * cv2.resize(heatmap, (w, h))), cv2.COLORMAP_JET
    )
    colored = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
    return cv2.addWeighted(img_arr.astype(np.uint8), 0.6, colored, 0.4, 0)


# ── Pydantic models ───────────────────────────────────────────────────────────

class ClassProb(BaseModel):
    name: str
    probability: float
    percentage: float


class PredictResponse(BaseModel):
    prediction: str
    confidence: float
    severity: str
    description: str
    color: str
    probabilities: List[ClassProb]
    original_image: str
    heatmap_image: str
    overlay_image: str


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": _model is not None}


@app.post("/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(...)):
    # Validate
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(400, "File must be an image.")
    raw = await file.read()
    if len(raw) > 20 * 1024 * 1024:
        raise HTTPException(413, "File exceeds 20 MB limit.")

    model = require_model()

    try:
        image              = Image.open(io.BytesIO(raw))
        img_arr, img_input = preprocess(image)
        probs              = model.predict(img_input, verbose=0)[0]
        pred_idx           = int(np.argmax(probs))
        pred_class         = CLASS_NAMES[pred_idx]
        confidence         = float(probs[pred_idx]) * 100

        heatmap  = gradcam_heatmap(img_input, model)
        overlay  = gradcam_overlay(img_arr, heatmap)
        heatmap_rgb = cv2.cvtColor(
            cv2.applyColorMap(
                np.uint8(255 * cv2.resize(heatmap, IMG_SIZE)),
                cv2.COLORMAP_JET,
            ),
            cv2.COLOR_BGR2RGB,
        )

        info = CLASS_INFO[pred_class]
        return PredictResponse(
            prediction=pred_class,
            confidence=round(confidence, 2),
            severity=info["severity"],
            description=info["description"],
            color=info["color"],
            probabilities=[
                ClassProb(
                    name=n,
                    probability=round(float(p), 4),
                    percentage=round(float(p) * 100, 2),
                )
                for n, p in zip(CLASS_NAMES, probs)
            ],
            original_image=to_base64(img_arr),
            heatmap_image=to_base64(heatmap_rgb),
            overlay_image=to_base64(overlay),
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, f"Prediction failed: {exc}") from exc