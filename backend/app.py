import io
import csv
import os
import time
import base64
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from model.inference import ForgeryDetector
from utils.heatmap import generate_heatmap
from utils.gradcam import generate_gradcam
from utils.ela import compute_ela, ela_uniformity_score
from utils.ai_detector import detect_ai_image
from config import MODEL_PATH, INPUT_SIZE
import torchvision.transforms as T

app = FastAPI(title="Image Forgery Detection API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = ForgeryDetector()

TRANSFORM = T.Compose([
    T.Resize(INPUT_SIZE),
    T.ToTensor(),
    T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": detector.model_loaded}


@app.post("/api/detect")
async def detect_forgery(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPG, PNG, TIFF, BMP).")

    try:
        contents = await file.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=422, detail="Could not read the uploaded image.")

    t0 = time.time()
    result = detector.predict(pil_image)
    process_ms = round((time.time() - t0) * 1000)

    # Grad-CAM
    try:
        class_idx = 1 if result["verdict"] == "FORGED" else 0
        gradcam_b64 = generate_gradcam(
            pil_image, detector.model, detector.device, TRANSFORM, class_idx
        )
    except Exception:
        gradcam_b64 = None

    # SLIC+SIFT heatmap
    has_regions = (
        result.get("forged_mask") is not None
        and result["forged_mask"].max() > 0
    )
    if has_regions:
        heatmap_b64 = generate_heatmap(pil_image, result["forged_mask"])
    else:
        heatmap_b64 = gradcam_b64 or generate_heatmap(pil_image, None)
    if gradcam_b64 is None:
        gradcam_b64 = heatmap_b64

    # ELA — open from original bytes to preserve format metadata
    try:
        original_pil = Image.open(io.BytesIO(contents))
        ela_b64  = compute_ela(original_pil)
        ela_unif = ela_uniformity_score(original_pil)
    except Exception:
        ela_b64  = None
        ela_unif = 50.0

    # AI image detection — use original PIL (with EXIF intact)
    try:
        original_pil_rgb = Image.open(io.BytesIO(contents))
        ai_result = detect_ai_image(original_pil_rgb)
    except Exception:
        ai_result = {
            "is_ai_generated": False,
            "confidence": 50.0,
            "label": "Uncertain",
            "signals": {"exif": 50.0, "frequency": 50.0, "noise": 50.0, "ela": 50.0},
        }

    # Original image for display
    orig_buf = io.BytesIO()
    pil_image.save(orig_buf, format="JPEG", quality=92)
    original_b64 = base64.b64encode(orig_buf.getvalue()).decode("utf-8")

    return {
        "verdict":          result["verdict"],
        "confidence":       result["confidence"],
        "forgery_type":     result["forgery_type"],
        "regions_found":    result["regions_found"],
        "heatmap":          heatmap_b64,
        "gradcam_jpeg":     gradcam_b64,
        "ela_jpeg":         ela_b64,
        "ela_uniformity":   ela_unif,
        "original_jpeg":    original_b64,
        "process_time_ms":  process_ms,
        "forensic_meta":    result.get("forensic_meta", {}),
        "ai_detection":     ai_result,
    }


@app.get("/api/training-history")
def training_history():
    log_path = os.path.join(os.path.dirname(MODEL_PATH), "training_log.csv")
    if not os.path.exists(log_path):
        return {"epochs": []}
    rows = []
    with open(log_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({
                "epoch":      int(row["epoch"]),
                "train_acc":  round(float(row["train_acc"]) * 100, 2),
                "val_acc":    round(float(row["val_acc"]) * 100, 2),
                "train_loss": round(float(row["train_loss"]), 4),
                "val_loss":   round(float(row["val_loss"]), 4),
            })
    return {"epochs": rows}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
