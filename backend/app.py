import io
import csv
import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from model.inference import ForgeryDetector
from utils.heatmap import generate_heatmap
from config import MODEL_PATH

app = FastAPI(title="Image Forgery Detection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = ForgeryDetector()


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

    result = detector.predict(pil_image)
    heatmap_b64 = generate_heatmap(pil_image, result["forged_mask"])

    return {
        "verdict":       result["verdict"],
        "confidence":    result["confidence"],
        "forgery_type":  result["forgery_type"],
        "regions_found": result["regions_found"],
        "heatmap":       heatmap_b64,
        "forensic_meta": result.get("forensic_meta", {}),
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
                "epoch":     int(row["epoch"]),
                "train_acc": round(float(row["train_acc"]) * 100, 2),
                "val_acc":   round(float(row["val_acc"]) * 100, 2),
                "train_loss": round(float(row["train_loss"]), 4),
                "val_loss":   round(float(row["val_loss"]), 4),
            })
    return {"epochs": rows}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
