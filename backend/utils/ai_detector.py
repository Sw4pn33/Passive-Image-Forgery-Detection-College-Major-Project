"""
AI-Generated Image Detector — multi-signal approach, no model download required.

Signals used:
  1. EXIF metadata — real camera photos carry rich EXIF; AI images typically have none.
  2. Frequency domain — real photos follow 1/f^2 (pink noise); AI images are too smooth.
  3. Noise residual — camera sensor PRNU creates non-Gaussian noise; AI noise is Gaussian-flat.
  4. ELA uniformity — AI images have too-uniform JPEG ELA; spliced real images vary locally.

Each signal returns 0-100 (AI likelihood). Weighted average = final score.
"""
import io
import numpy as np
from PIL import Image, ImageChops, ImageFilter
from scipy.stats import kurtosis as scipy_kurtosis


# ── EXIF analysis ────────────────────────────────────────────────────────────

# EXIF tags that only appear in real camera photos
_CAMERA_TAGS = {
    271,   # Make
    272,   # Model
    305,   # Software (some AI tools write this, but differently)
    306,   # DateTime
    33434, # ExposureTime
    33437, # FNumber
    34855, # ISOSpeedRatings
    36867, # DateTimeOriginal
    36868, # DateTimeDigitized
    37386, # FocalLength
    41989, # FocalLengthIn35mmFilm
    41990, # SceneCaptureType
}

_AI_SOFTWARE_HINTS = [
    "stable diffusion", "midjourney", "dall-e", "dalle", "diffusion",
    "comfyui", "automatic1111", "novelai", "invoke", "dream", "ai",
    "generated", "flux", "sd", "sdxl",
]


def _exif_ai_score(pil_image: Image.Image) -> float:
    """0=definitely real camera, 100=no EXIF at all (AI likely)."""
    fmt = (pil_image.format or "").upper()

    # PNG is never a native camera format — strong AI/synthetic indicator
    if fmt == "PNG":
        return 82.0
    # WebP is rare from cameras without software conversion
    if fmt == "WEBP":
        return 70.0

    try:
        exif = pil_image._getexif()  # returns None for non-JPEG or no EXIF
    except Exception:
        exif = None

    if not exif:
        # JPEG with no EXIF — moderate score
        return 60.0

    # Check for camera-specific tags
    found_camera_tags = sum(1 for t in _CAMERA_TAGS if t in exif)
    if found_camera_tags >= 5:
        return 5.0   # very likely real camera
    if found_camera_tags >= 3:
        return 20.0
    if found_camera_tags >= 1:
        return 40.0

    # No camera tags but EXIF exists — check Software tag for AI hints
    software = str(exif.get(305, "")).lower()
    if any(h in software for h in _AI_SOFTWARE_HINTS):
        return 95.0

    return 55.0  # EXIF exists but no camera info — ambiguous


# ── Frequency domain analysis ─────────────────────────────────────────────────

def _frequency_ai_score(pil_image: Image.Image) -> float:
    """
    0=natural 1/f^2 spectrum (real photo), 100=too smooth (AI).
    AI images lack high-frequency detail that camera sensors and real scenes produce.
    """
    gray = np.array(pil_image.convert("L"), dtype=np.float64)

    # 2D FFT → shift zero-frequency to center → log magnitude
    fft = np.fft.fft2(gray)
    fft_shift = np.fft.fftshift(fft)
    magnitude = np.log1p(np.abs(fft_shift))

    h, w = magnitude.shape
    cy, cx = h // 2, w // 2

    # Split into low and high frequency regions
    inner_r = min(h, w) // 8   # low-freq circle radius
    outer_start = min(h, w) // 4  # high-freq starts here

    y_idx, x_idx = np.ogrid[:h, :w]
    dist = np.sqrt((y_idx - cy) ** 2 + (x_idx - cx) ** 2)

    lf_mask = dist <= inner_r
    hf_mask = dist >= outer_start

    lf_energy = magnitude[lf_mask].sum()
    hf_energy = magnitude[hf_mask].sum()
    total = lf_energy + hf_energy + 1e-10

    hf_ratio = hf_energy / total
    # Real photos: hf_ratio typically 0.55-0.75
    # AI smooth images: hf_ratio 0.30-0.50; AI graphics: hf_ratio can be high
    # Normalize: hf_ratio=0.30 → score=90; hf_ratio=0.65 → score=10
    raw = (0.65 - hf_ratio) / 0.35 * 100
    # Floor at 20 — frequency alone should never fully clear an image
    score = max(20.0, min(100.0, raw))
    return round(float(score), 1)


# ── Noise residual analysis ────────────────────────────────────────────────────

def _noise_ai_score(pil_image: Image.Image) -> float:
    """
    0=non-Gaussian camera PRNU noise (real), 100=Gaussian/flat AI noise.
    Real camera sensors have device-specific non-uniform noise (PRNU).
    AI images generate noise that is more Gaussian and spatially uniform.
    """
    gray = np.array(pil_image.convert("L").resize((256, 256)), dtype=np.float32)

    # Denoise with Gaussian blur; residual = estimated noise
    blurred = np.array(
        Image.fromarray(gray.astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=2)),
        dtype=np.float32,
    )
    residual = gray - blurred

    # Kurtosis of noise distribution
    # Gaussian noise: kurtosis ≈ 3 (excess = 0)
    # Real camera PRNU: excess kurtosis often > 1 (heavier tails)
    # AI images: excess kurtosis close to 0 (very Gaussian)
    flat = residual.flatten()
    if flat.std() < 0.5:
        # Nearly constant image region — not informative
        return 50.0

    excess_kurt = float(scipy_kurtosis(flat, fisher=True))  # fisher=True → excess kurtosis
    # AI: excess_kurt close to 0 (Gaussian)
    # Real: excess_kurt > 1.5 (heavier tails from PRNU)
    # Score: excess_kurt=0 → 80; excess_kurt=3 → 10
    raw = (1.5 - excess_kurt) / 1.5 * 80
    # Floor at 20 — noise alone should never fully clear an image
    score = max(20.0, min(100.0, raw))
    return round(float(score), 1)


# ── ELA uniformity signal ─────────────────────────────────────────────────────

def _ela_uniformity_score(pil_image: Image.Image, quality: int = 90) -> float:
    """AI images produce a very flat ELA map (uniform compression everywhere)."""
    rgb = pil_image.convert("RGB")
    buf = io.BytesIO()
    rgb.save(buf, format="JPEG", quality=quality)
    buf.seek(0)
    recompressed = Image.open(buf).convert("RGB")

    ela = np.array(ImageChops.difference(rgb, recompressed), dtype=np.float32)
    std = ela.std()
    mean = ela.mean() + 1e-6
    cv = std / mean  # coefficient of variation

    # Low CV = uniform ELA = AI indicator
    # AI: cv ~0.4-1.0; tampered real: cv ~1.5-4.0; clean real: cv ~1.0-2.0
    score = max(0.0, min(100.0, (1.3 - cv) / 0.9 * 100))
    return round(float(score), 1)


# ── HuggingFace ML detector ───────────────────────────────────────────────────

_hf_pipe = None
_hf_loaded = False

def _load_hf_pipe():
    global _hf_pipe, _hf_loaded
    if _hf_loaded:
        return _hf_pipe
    try:
        from transformers import pipeline as hf_pipeline
        _hf_pipe = hf_pipeline(
            "image-classification",
            model="umm-maybe/AI-image-detector",
            device=-1,  # CPU
        )
        print("[AI-Detector] HuggingFace umm-maybe/AI-image-detector loaded")
    except Exception as e:
        print(f"[AI-Detector] HuggingFace model unavailable: {e}")
        _hf_pipe = None
    _hf_loaded = True
    return _hf_pipe


def _ml_ai_score(pil_image: Image.Image) -> float | None:
    """0=real, 100=AI. Returns None if model unavailable."""
    pipe = _load_hf_pipe()
    if pipe is None:
        return None
    try:
        rgb = pil_image.convert("RGB")
        results = pipe(rgb)
        # results: [{'label': 'artificial', 'score': 0.98}, {'label': 'human', 'score': 0.02}]
        for r in results:
            if r["label"].lower() in ("artificial", "fake", "ai"):
                return round(float(r["score"]) * 100, 1)
        # If label is 'human'/'real', invert
        for r in results:
            if r["label"].lower() in ("human", "real"):
                return round((1 - float(r["score"])) * 100, 1)
        return None
    except Exception:
        return None


# ── Main detector ─────────────────────────────────────────────────────────────

def detect_ai_image(pil_image: Image.Image) -> dict:
    """
    Returns:
      is_ai_generated: bool
      confidence:      float  (0-100, AI likelihood)
      label:           str    ("AI Generated" | "Camera / Real" | "Uncertain")
      signals: {
        exif:       float,
        frequency:  float,
        noise:      float,
        ela:        float,
      }
    """
    try:
        exif_score  = _exif_ai_score(pil_image)
    except Exception:
        exif_score  = 50.0
    try:
        freq_score  = _frequency_ai_score(pil_image)
    except Exception:
        freq_score  = 50.0
    try:
        noise_score = _noise_ai_score(pil_image)
    except Exception:
        noise_score = 50.0
    try:
        ela_score   = _ela_uniformity_score(pil_image)
    except Exception:
        ela_score   = 50.0

    # Try ML-based detector (HuggingFace ViT)
    ml_score = _ml_ai_score(pil_image)

    if ml_score is not None:
        # ML model is available — weight it heavily, use heuristics as supporting signals
        confidence = round(
            0.55 * ml_score +
            0.15 * exif_score +
            0.15 * freq_score +
            0.10 * noise_score +
            0.05 * ela_score,
            1,
        )
    else:
        # Fallback: heuristics only — PNG/WebP format bonus applied in EXIF score
        fmt = (pil_image.format or "").upper()
        format_bonus = 20.0 if fmt == "PNG" else (10.0 if fmt == "WEBP" else 0.0)
        confidence = round(
            min(100.0,
                0.30 * exif_score +
                0.30 * freq_score +
                0.20 * noise_score +
                0.20 * ela_score +
                format_bonus),
            1,
        )

    if confidence >= 60:
        label = "AI Generated"
        is_ai = True
    elif confidence <= 35:
        label = "Camera / Real"
        is_ai = False
    else:
        label = "Uncertain"
        is_ai = confidence >= 48

    return {
        "is_ai_generated": is_ai,
        "confidence":      confidence,
        "label":           label,
        "signals": {
            "exif":      exif_score,
            "frequency": freq_score,
            "noise":     noise_score,
            "ela":       ela_score,
        },
    }
