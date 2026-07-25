import io
import base64
import cv2
import numpy as np
from PIL import Image


def generate_heatmap(pil_image: Image.Image, forgery_mask: np.ndarray | None) -> str:
    img_np = np.array(pil_image.convert("RGB"))
    h, w = img_np.shape[:2]

    if forgery_mask is None or forgery_mask.max() == 0:
        blank = np.zeros((h, w), dtype=np.uint8)
        heatmap_bgr = cv2.applyColorMap(blank, cv2.COLORMAP_JET)
    else:
        mask_resized = cv2.resize(forgery_mask, (w, h), interpolation=cv2.INTER_LINEAR)
        mask_norm = (np.clip(mask_resized, 0, 1) * 255).astype(np.uint8)
        heatmap_bgr = cv2.applyColorMap(mask_norm, cv2.COLORMAP_JET)

    heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)
    buf = io.BytesIO()
    Image.fromarray(heatmap_rgb).save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.getvalue()).decode("utf-8")
