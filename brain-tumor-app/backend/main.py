"""
Brain Tumor Classifier — FastAPI backend
Run: uvicorn main:app --host 0.0.0.0 --port 8000
"""

import io, os, base64, contextlib, traceback, asyncio
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"]  = "2"

import tensorflow as tf
tf.keras.mixed_precision.set_global_policy("float32")

import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# ── Config ────────────────────────────────────────────────────────────────────
_env       = os.getenv("MODEL_PATH")
MODEL_PATH = Path(_env) if _env else (
    Path(__file__).resolve().parent.parent.parent
    / "outputs" / "models" / "best_model_fp32.keras"
)

IMG_SIZE    = (224, 224)
CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]
CLASS_INFO  = {
    "glioma":     {"description": "Gliomas originate from glial cells. They are the most common and aggressive primary brain tumour.", "severity": "high",   "color": "#ef4444"},
    "meningioma": {"description": "Meningiomas arise from the meninges. Most are benign but location can cause neurological symptoms.", "severity": "medium", "color": "#f97316"},
    "notumor":    {"description": "No tumour detected. The MRI scan appears normal with no signs of malignancy.",                       "severity": "none",   "color": "#22c55e"},
    "pituitary":  {"description": "Pituitary tumours form in the pituitary gland and disrupt hormone regulation. Most are benign.",     "severity": "medium", "color": "#f97316"},
}

_model:        tf.keras.Model | None = None
_backbone_cam: tf.keras.Model | None = None
_head_layers:  dict                  = {}
_executor:     ThreadPoolExecutor    = ThreadPoolExecutor(max_workers=1)


@contextlib.asynccontextmanager
async def lifespan(_app: FastAPI):
    global _model, _backbone_cam, _head_layers
    if not MODEL_PATH.exists():
        print(f"[WARNING] Model not found: {MODEL_PATH}")
    else:
        print(f"[startup] Loading model: {MODEL_PATH}")
        _model   = tf.keras.models.load_model(str(MODEL_PATH))
        backbone = _model.get_layer("efficientnetv2-l")
        top_conv = backbone.get_layer("top_conv")

        # Sub-model: backbone input → (top_conv output, backbone output)
        _backbone_cam = tf.keras.Model(
            inputs  = backbone.inputs,
            outputs = [top_conv.output, backbone.output]
        )

        # Cache head layers for grad-cam forward pass
        _head_layers = {
            "gap":    _model.get_layer("global_average_pooling2d"),
            "bn":     _model.get_layer("batch_normalization"),
            "dense1": _model.get_layer("dense"),
            "drop":   _model.get_layer("dropout"),
            "dense2": _model.get_layer("dense_1"),
            "act":    _model.get_layer("activation"),
        }

        # Warm-up
        dummy = tf.zeros((1, *IMG_SIZE, 3), dtype=tf.float32)
        _model(dummy, training=False)
        print(f"[startup] Ready ✓  input dtype: {_model.input.dtype}")
    yield
    _model = _backbone_cam = None
    _executor.shutdown(wait=False)


app = FastAPI(title="Brain Tumor Classifier", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_model() -> tf.keras.Model:
    if _model is None:
        raise HTTPException(503, "Model not loaded.")
    return _model


def preprocess(image: Image.Image):
    arr = np.array(image.convert("RGB").resize(IMG_SIZE), dtype=np.float32)
    inp = tf.cast(tf.expand_dims(arr, axis=0), tf.float32)
    return arr, inp


def to_base64(arr: np.ndarray) -> str:
    buf = io.BytesIO()
    Image.fromarray(arr.astype(np.uint8)).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def gradcam_heatmap(inp: tf.Tensor) -> np.ndarray:
    h = _head_layers
    with tf.GradientTape() as tape:
        conv_out, bb_out = _backbone_cam(inp, training=False)
        tape.watch(conv_out)
        x = h["act"](h["dense2"](h["drop"](
            h["dense1"](h["bn"](h["gap"](bb_out), training=False)),
            training=False
        )))
        top_class = x[:, tf.argmax(x[0])]

    grads   = tf.cast(tape.gradient(top_class, conv_out), tf.float32)
    co      = tf.cast(conv_out, tf.float32)
    pooled  = tf.reduce_mean(grads, axis=(0, 1, 2))
    heatmap = tf.squeeze(co[0] @ pooled[..., tf.newaxis])
    heatmap = tf.maximum(heatmap, 0)
    heatmap = heatmap / (tf.reduce_max(heatmap) + 1e-8)
    return heatmap.numpy()


def gradcam_overlay(img_arr: np.ndarray, heatmap: np.ndarray) -> np.ndarray:
    h, w    = img_arr.shape[:2]
    colored = cv2.applyColorMap(np.uint8(255 * cv2.resize(heatmap, (w, h))), cv2.COLORMAP_JET)
    colored = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
    return cv2.addWeighted(img_arr.astype(np.uint8), 0.6, colored, 0.4, 0)


def _inference(arr: np.ndarray, inp: tf.Tensor, model: tf.keras.Model) -> dict:
    probs      = model(inp, training=False).numpy()[0]
    pred_idx   = int(np.argmax(probs))
    pred_class = CLASS_NAMES[pred_idx]
    confidence = float(probs[pred_idx]) * 100
    original_b64 = to_base64(arr)

    try:
        heatmap     = gradcam_heatmap(inp)
        overlay     = gradcam_overlay(arr, heatmap)
        heatmap_rgb = cv2.cvtColor(
            cv2.applyColorMap(
                np.uint8(255 * cv2.resize(heatmap, IMG_SIZE)),
                cv2.COLORMAP_JET
            ),
            cv2.COLOR_BGR2RGB,
        )
        heatmap_b64 = to_base64(heatmap_rgb)
        overlay_b64 = to_base64(overlay)
    except Exception:
        traceback.print_exc()
        heatmap_b64 = original_b64
        overlay_b64 = original_b64

    info = CLASS_INFO[pred_class]
    return dict(
        prediction    = pred_class,
        confidence    = round(confidence, 2),
        severity      = info["severity"],
        description   = info["description"],
        color         = info["color"],
        probabilities = [
            {"name": n, "probability": round(float(p), 4), "percentage": round(float(p) * 100, 2)}
            for n, p in zip(CLASS_NAMES, probs)
        ],
        original_image = original_b64,
        heatmap_image  = heatmap_b64,
        overlay_image  = overlay_b64,
    )


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


@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": _model is not None}


@app.post("/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(...)):
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(400, "File must be an image.")
    raw = await file.read()
    if len(raw) > 20 * 1024 * 1024:
        raise HTTPException(413, "File exceeds 20 MB.")
    model = require_model()
    try:
        image    = Image.open(io.BytesIO(raw))
        arr, inp = preprocess(image)
        loop     = asyncio.get_event_loop()
        result   = await loop.run_in_executor(_executor, _inference, arr, inp, model)
        return result
    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(500, f"Prediction failed: {exc}") from exc
