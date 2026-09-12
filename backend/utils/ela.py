"""
Error Level Analysis (ELA) — detects JPEG compression inconsistencies.
Tampered / AI-generated regions show different ELA intensity vs authentic areas.
"""
import io
import base64
import numpy as np
from PIL import Image, ImageChops, ImageEnhance, ImageFilter


def compute_ela(pil_image: Image.Image, quality: int = 90, amplify: int = 12) -> str:
    """Returns base64-encoded JPEG of ELA heatmap."""
    rgb = pil_image.convert("RGB")

    # Re-compress at given quality
    buf = io.BytesIO()
    rgb.save(buf, format="JPEG", quality=quality)
    buf.seek(0)
    recompressed = Image.open(buf).convert("RGB")

    # Pixel-level difference
    ela = ImageChops.difference(rgb, recompressed)

    # Amplify so the diff is visible
    extrema = ela.getextrema()
    max_diff = max(e[1] for e in extrema) or 1
    scale = (255.0 / max_diff) * (amplify / 10.0)
    ela = ImageEnhance.Brightness(ela).enhance(scale)
    ela = ela.filter(ImageFilter.GaussianBlur(radius=0.8))

    out = io.BytesIO()
    ela.save(out, format="JPEG", quality=90)
    return base64.b64encode(out.getvalue()).decode("utf-8")


def ela_uniformity_score(pil_image: Image.Image, quality: int = 90) -> float:
    """
    Returns 0-100: higher = more uniform ELA = more likely AI-generated.
    AI images: ELA is very flat (uniform compression everywhere).
    Tampered/real photos: ELA has high variance in manipulated regions.
    """
    rgb = pil_image.convert("RGB")
    buf = io.BytesIO()
    rgb.save(buf, format="JPEG", quality=quality)
    buf.seek(0)
    recompressed = Image.open(buf).convert("RGB")

    ela_arr = np.array(ImageChops.difference(rgb, recompressed), dtype=np.float32)
    std = ela_arr.std()
    mean = ela_arr.mean() + 1e-6

    # Low std relative to mean = uniform ELA = AI indicator
    cv = std / mean  # coefficient of variation
    # AI: cv ~0.3-0.8; real tampered: cv ~1.5-4.0
    uniformity = max(0.0, min(100.0, (1.5 - cv) / 1.2 * 100))
    return round(float(uniformity), 1)
