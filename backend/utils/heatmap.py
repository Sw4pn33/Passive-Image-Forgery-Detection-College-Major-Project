import io
import base64
import cv2
import numpy as np
from PIL import Image


def generate_heatmap(pil_image: Image.Image, forgery_mask: np.ndarray | None) -> str:
    img_np = np.array(pil_image.convert("RGB"))

    if forgery_mask is None or forgery_mask.max() == 0:
        return _to_base64(img_np)

    mask_resized = cv2.resize(
        forgery_mask, (img_np.shape[1], img_np.shape[0]), interpolation=cv2.INTER_LINEAR
    )
    mask_norm = (np.clip(mask_resized, 0, 1) * 255).astype(np.uint8)

    heatmap_bgr = cv2.applyColorMap(mask_norm, cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)

    overlay = cv2.addWeighted(img_np, 0.55, heatmap_rgb, 0.45, 0)
    return _to_base64(overlay)


def _to_base64(np_array: np.ndarray) -> str:
    pil_img = Image.fromarray(np_array.astype(np.uint8))
    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=88)
    return base64.b64encode(buf.getvalue()).decode("utf-8")
