<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=24&height=200&section=header&text=Passive%20Image%20Forgery%20Detection&fontSize=36&fontAlignY=38&desc=Hybrid%20Deep%20Learning%20%2B%20Classical%20CV%20Pipeline&descAlignY=58&animation=fadeIn&fontColor=ffffff" width="100%"/>

<br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-forensic--vision.vercel.app-7c3aed?style=for-the-badge&logo=vercel&logoColor=white)](https://forensic-vision.vercel.app)
&nbsp;
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
&nbsp;
[![PyTorch](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
&nbsp;
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
&nbsp;
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)

<br/>

[![Dataset](https://img.shields.io/badge/Dataset-CASIA%20v1.0-ff6b6b?style=for-the-badge&logo=databricks&logoColor=white)](http://forensics.idealtest.org/)
&nbsp;
[![Model](https://img.shields.io/badge/Backbone-EfficientNetB0-4ecdc4?style=for-the-badge&logo=tensorflow&logoColor=white)]()
&nbsp;
[![Training](https://img.shields.io/badge/Trained%20on-Kaggle%20GPU%20T4-20BEFF?style=for-the-badge&logo=kaggle&logoColor=white)](https://kaggle.com)

</div>

---

## What this paper is about

Image forgery — splicing objects from different sources, duplicating regions within the same photo — is increasingly hard to spot with the naked eye. The goal of **passive forgery detection** is to catch these manipulations using only the pixel data, with no prior embedding of watermarks or signatures (hence "passive").

Most academic work falls into one of two camps: either a neural network that gives you a binary label (real/fake) without telling you *where* the forgery is, or classical signal-processing methods (noise analysis, JPEG artifact grids, DCT coefficient statistics) that struggle once the image has been recompressed, resized, or color-corrected.

Neither approach alone is satisfying. A classification score without spatial evidence isn't forensically useful. And classical localization methods often produce too many false positives on high-quality forgeries that match the surrounding noise profile.

---

## The gap we're addressing

Here's what the existing literature leaves on the table:

| Problem | What most papers do | What we do |
|---|---|---|
| **Spatial localization** | Binary label only | SLIC superpixel segmentation + SIFT keypoint matching to highlight suspect regions |
| **Copy-move vs splicing** | One or the other | Unified pipeline handles both attack types |
| **Explainability** | Black box | Grad-CAM activation maps overlaid on input |
| **Compressed images** | Fail on JPEG artifacts | EfficientNetB0 features are compression-robust |
| **End-to-end deployment** | Lab code, no interface | Full REST API + interactive web frontend |

Classical SIFT-based copy-move detectors work well when forged regions aren't rotated or scaled much, but break on post-processing. Pure CNNs generalize better to post-processed images but can't localize. The hybrid pipeline here runs both and combines their outputs.

---

## Architecture

```
Input Image
    │
    ├──► EfficientNetB0 ──► Global classification (AUTHENTIC / FORGED)
    │         │
    │         └──► Grad-CAM ──► Activation heatmap (where the model looks)
    │
    └──► SLIC superpixels ──► SIFT keypoint extraction
              │
              └──► FLANN matcher + RANSAC ──► Copy-move region mask
                        │
                        └──► JET colormap heatmap (suspect regions)

FastAPI REST endpoint combines both outputs → JSON response
React frontend renders comparison slider + side-by-side forensic view
```

---

## Dataset

**CASIA v1.0** — 921 authentic images, 921 forged images (copy-move and splicing), JPEG format, ~384×256 resolution average.

```
dataset/
├── train/
│   ├── authentic/     # ~720 images
│   └── forged/        # ~720 images
├── val/
│   ├── authentic/     # ~100 images
│   └── forged/        # ~100 images
└── test/
    ├── authentic/     # ~100 images
    └── forged/        # ~100 images
```

Sample images from the dataset are in [`samples/`](./samples/) — 5 authentic and 5 forged, ready to test against the live demo without needing the full dataset.

---

## What we built

- **Hybrid detector**: EfficientNetB0 backbone fine-tuned on CASIA, plus a SLIC+SIFT pipeline for spatial localization
- **Grad-CAM fallback**: when SLIC/SIFT finds no suspicious keypoints (e.g., splicing rather than copy-move), Grad-CAM activations are shown instead — so you always get a spatial explanation
- **Interactive web tool**: drag-and-drop upload, confidence score, forgery type label, before/after comparison slider, heatmap toggle between Grad-CAM and SLIC views
- **REST API**: single `/api/detect` endpoint, returns verdict + confidence + base64-encoded heatmap + original image

---

## Results

| Metric | Value |
|---|---|
| Validation accuracy (Epoch 1) | ~80% |
| Training epochs configured | 50 |
| Input resolution | 256 × 256 |
| Batch size | 32 |
| Optimizer | Adam, lr=1e-4 |

Training ran on Kaggle GPU T4. The model checkpoint (`dcnn_forgery.pt`) is not in this repo due to size — see the Kaggle notebook Output tab to download it.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backbone | EfficientNetB0 (torchvision pretrained) |
| Localization | SIFT + FLANN + RANSAC (OpenCV), SLIC (scikit-image) |
| Explainability | Grad-CAM (manual hook on final conv layer) |
| API | FastAPI 0.111, uvicorn, python-multipart |
| Frontend | React 19, TanStack Start, TypeScript, Tailwind CSS v4 |
| Charts | Recharts (training history page) |
| Deployment | Vercel (frontend), VPS (backend, FastAPI + PM2) |

---

## Installation

### Prerequisites

- Python 3.12+
- Node.js 18+
- The trained model file `dcnn_forgery.pt` in `backend/model/weights/`

### Backend

```bash
cd backend

# create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# install dependencies
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install fastapi==0.111.0 uvicorn[standard]==0.30.1 python-multipart==0.0.9 \
            pillow==10.3.0 numpy==1.26.4 opencv-python==4.10.0.82 \
            scikit-image==0.23.2 scikit-learn==1.5.0 scipy==1.13.1

# place your model weights at backend/model/weights/dcnn_forgery.pt
# then start the server
uvicorn app:app --host 0.0.0.0 --port 8000
```

Health check:
```bash
curl http://localhost:8000/health
# {"status":"ok","model_loaded":true}
```

### Frontend (development)

```bash
cd frontend
npm install
npm run dev
# open http://localhost:3000
```

The dev server proxies `/api/*` to `localhost:8000` automatically.

### Training from scratch

```bash
cd backend
python model/train.py
# logs to model/weights/training_log.csv
# saves checkpoint to model/weights/dcnn_forgery.pt
```

Running training locally on CPU will be very slow — use Kaggle or any GPU environment. Upload the checkpoint back to `backend/model/weights/dcnn_forgery.pt`.

---

## Live demo

**[https://forensic-vision.vercel.app](https://forensic-vision.vercel.app)**

The backend API is running on a VPS and should respond within 2–4 seconds per image depending on size. Drop any JPEG, PNG, or TIFF image into the upload panel. Forged images from [`samples/forged/`](./samples/forged/) are a good starting point.

---

## Project layout

```
.
├── backend/
│   ├── app.py                  # FastAPI application
│   ├── config.py               # Training hyperparameters
│   ├── requirements.txt
│   ├── model/
│   │   ├── inference.py        # ForgeryDetector class
│   │   ├── train.py            # Training script
│   │   ├── dataset.py          # CASIA dataset loader
│   │   └── weights/            # dcnn_forgery.pt goes here
│   └── utils/
│       ├── heatmap.py          # SLIC+SIFT → JET colormap
│       └── gradcam.py          # Grad-CAM implementation
├── frontend/
│   ├── src/
│   │   ├── routes/             # TanStack file-based routes
│   │   ├── components/         # React UI components
│   │   └── lib/                # API client, types
│   ├── static/                 # Pre-built deployment output (served by Vercel)
│   └── vercel.json
├── samples/
│   ├── authentic/              # 5 CASIA authentic samples
│   └── forged/                 # 5 CASIA forged samples
├── dataset/                    # gitignored — run dataset_setup.py
└── paper/
    └── Passive image.pdf
```

---

## Limitations

This model was trained only on CASIA v1.0, which is relatively small and older. It will likely underperform on:
- AI-generated images (DALL-E, Stable Diffusion outputs)
- Professionally retouched photos with content-aware fill
- Images with heavy JPEG compression below quality 50

The SIFT-based copy-move detector also struggles when forged regions are scaled by more than ~30% or rotated by more than ~45°. Grad-CAM helps here as a fallback, but it's a saliency map, not a precise mask.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=24&height=100&section=footer&animation=fadeIn" width="100%"/>

*College Major Project — Paper 2 | Image Forensics*

</div>
