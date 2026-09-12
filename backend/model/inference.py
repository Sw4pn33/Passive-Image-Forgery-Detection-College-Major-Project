import os
import sys
import numpy as np
import torch
import torch.nn.functional as F
import torchvision.transforms as T
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import INPUT_SIZE, MODEL_PATH, CLASSES
from model.architecture import XONetPretrained, XONet
from utils.localize import localize_forgery

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

TRANSFORM = T.Compose([
    T.Resize(INPUT_SIZE),
    T.ToTensor(),
    T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


class ForgeryDetector:
    def __init__(self):
        self.model = None
        self.model_loaded = False
        self.device = DEVICE
        self._load()

    def _load(self):
        if not os.path.exists(MODEL_PATH):
            print(f"[ForgeryDetector] No weights at {MODEL_PATH}. Run train.py first.")
            self.model = XONetPretrained().to(DEVICE).eval()
            return

        for ModelClass in (XONetPretrained, XONet):
            try:
                m = ModelClass()
                state = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True)
                m.load_state_dict(state)
                m.to(DEVICE).eval()
                self.model = m
                self.model_loaded = True
                print(f"[ForgeryDetector] Loaded {ModelClass.__name__} from {MODEL_PATH}")
                return
            except Exception:
                continue

        # Fallback: plain EfficientNetB0 (Kaggle-trained format)
        try:
            from torchvision.models import efficientnet_b0
            import torch.nn as nn
            m = efficientnet_b0(weights=None)
            m.classifier[1] = nn.Linear(m.classifier[1].in_features, 2)
            state = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True)
            m.load_state_dict(state)
            m.to(DEVICE).eval()
            self.model = m
            self.model_loaded = True
            print("[ForgeryDetector] Loaded PlainEfficientNetB0 from", MODEL_PATH)
            return
        except Exception as e:
            print("[ForgeryDetector] PlainEfficientNetB0 failed:", e)

        print("[ForgeryDetector] Weight load failed. Using untrained model.")
        self.model = XONetPretrained().to(DEVICE).eval()

    def predict(self, pil_image: Image.Image) -> dict:
        img_tensor = TRANSFORM(pil_image.convert("RGB")).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            logits = self.model(img_tensor)
            probs = F.softmax(logits, dim=1)[0].cpu().numpy()

        class_idx  = int(np.argmax(probs))
        confidence = float(np.max(probs))
        verdict    = CLASSES[class_idx].upper()
        is_forged  = class_idx == 1

        forged_mask  = None
        forgery_type = "none"
        regions_found = 0

        forensic_meta = {}
        if is_forged:
            img_np = np.array(pil_image.convert("RGB"))
            forged_mask, forgery_type, forensic_meta = localize_forgery(img_np)
            regions_found = 1 if (forged_mask is not None and forged_mask.max() > 0) else 0

        return {
            "verdict":        verdict,
            "confidence":     round(confidence * 100, 2),
            "forgery_type":   forgery_type,
            "forged_mask":    forged_mask,
            "regions_found":  regions_found,
            "forensic_meta":  forensic_meta,
        }
