<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=24&height=220&section=header&text=Passive%20Image%20Forgery%20Detection&fontSize=34&fontAlignY=40&desc=Hybrid%20Deep%20Learning%20%2B%20Classical%20CV%20Pipeline&descAlignY=58&animation=fadeIn&fontColor=ffffff" width="100%"/>

<br/>

<a href="https://forensic-vision.vercel.app">
  <img src="https://img.shields.io/badge/🔬%20Live%20Demo-forensic--vision.vercel.app-7c3aed?style=for-the-badge&logoColor=white" height="36"/>
</a>

<br/><br/>

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://forensic-vision.vercel.app)

<br/>

[![Dataset](https://img.shields.io/badge/Dataset-CASIA%20v1%20%2B%20v2%20%2B%20CG--1050-ff6b6b?style=for-the-badge)](http://forensics.idealtest.org/)
[![Model](https://img.shields.io/badge/Backbone-EfficientNetB0-4ecdc4?style=for-the-badge)]()
[![Training](https://img.shields.io/badge/GPU-Kaggle%20T4-20BEFF?style=for-the-badge&logo=kaggle&logoColor=white)](https://kaggle.com)

<br/><br/>

[![Val Accuracy](https://img.shields.io/badge/Val%20Accuracy-96.41%25-7c3aed?style=flat-square)]()
&nbsp;·&nbsp;
[![Images](https://img.shields.io/badge/Training%20Images-15%2C000%2B-009688?style=flat-square)]()
&nbsp;·&nbsp;
[![Classes](https://img.shields.io/badge/Classes-Authentic%20%7C%20Forged-EE4C2C?style=flat-square)]()
&nbsp;·&nbsp;
[![Resolution](https://img.shields.io/badge/Input%20Size-256×256-3776AB?style=flat-square)]()

</div>

<br/>

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Microscope.png" width="30" alt="paper"/> What this paper is about</h2>

Image forgery — splicing objects from different sources, duplicating regions within the same photo — is increasingly hard to spot with the naked eye. The goal of **passive forgery detection** is to catch these manipulations using only pixel data, with no prior embedding of watermarks or signatures (hence "passive").

Most academic work falls into one of two camps: either a neural network that gives you a binary label (real/fake) without telling you *where* the forgery is, or classical signal-processing methods (noise analysis, JPEG artifact grids, DCT coefficient statistics) that struggle once the image has been recompressed, resized, or color-corrected.

Neither approach alone is satisfying. A classification score without spatial evidence isn't forensically useful. And classical localization methods often produce too many false positives on high-quality forgeries that match the surrounding noise profile.

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Magnifying%20Glass%20Tilted%20Left.png" width="30" alt="gap"/> The gap we're addressing</h2>

Here's what the existing literature leaves on the table:

| Problem | What most papers do | What we do |
|---|---|---|
| **Spatial localization** | Binary label only | SLIC superpixel segmentation + SIFT keypoint matching to highlight suspect regions |
| **Copy-move vs splicing** | One or the other | Unified pipeline handles both attack types |
| **Explainability** | Black box | Grad-CAM activation maps overlaid on input |
| **Compressed images** | Fail on JPEG artifacts | EfficientNetB0 features are compression-robust |
| **AI-generated content** | Not addressed | Multi-signal AI image detector (EXIF + frequency + PRNU + ViT model) |
| **End-to-end deployment** | Lab code, no interface | Full REST API + interactive web frontend |

Classical SIFT-based copy-move detectors work well when forged regions aren't heavily transformed, but break on post-processing. Pure CNNs generalize better but can't localize. This pipeline runs both and combines their outputs.

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Puzzle%20Piece.png" width="30" alt="architecture"/> Architecture</h2>

```
Input Image
    │
    ├──► EfficientNetB0 ──► Global classification  (AUTHENTIC / FORGED)
    │         │
    │         └──► Grad-CAM ──► Activation heatmap  (where the model looks)
    │
    ├──► SLIC superpixels ──► SIFT keypoint extraction
    │             │
    │             └──► Brute-force L2 matcher ──► Copy-move region mask
    │                           │
    │                           └──► JET colormap heatmap  (suspect regions)
    │
    ├──► ELA (Error Level Analysis) ──► JPEG re-compression diff map
    │
    └──► AI Generation Detector
              ├── ViT model (umm-maybe/AI-image-detector, 55% weight)
              ├── EXIF metadata analysis  (15%)
              ├── Frequency domain — 1/f² spectrum check  (15%)
              ├── PRNU noise residual — kurtosis  (10%)
              └── ELA uniformity score  (5%)

FastAPI /api/detect  →  JSON: verdict + confidence + heatmap + gradcam + ai_detection + ela_uniformity
React frontend  →  drag-drop upload, comparison slider, Grad-CAM / SLIC / ELA tabs, AI likelihood card
```

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Card%20File%20Box.png" width="30" alt="dataset"/> Dataset</h2>

Training uses a **combined dataset of three sources** totalling 15,000+ images:

| Dataset | Content | Size |
|---|---|---|
| **CASIA v1.0** | Copy-move + splicing, JPEG | 921 authentic + 921 forged |
| **CASIA v2.0** | High-quality splicing, multiple formats | ~5,100 authentic + tampered pairs |
| **CG-1050** | Computer-generated forgeries | ~7,000 training + 630 validation |

All three datasets are combined using PyTorch `ConcatDataset` during training. Validation is run on the CG-1050 validation split.

```
Training (ConcatDataset):
  CASIA v1   ──┐
  CASIA v2   ──┼──► ~15,000+ images total
  CG-1050    ──┘

Validation:
  CG-1050 validation split (authentic + tampered)
```

Quick-start samples in [`samples/`](./samples/) — 5 authentic + 5 forged from the CASIA test set, ready to drop into the live demo.

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Hammer%20and%20Wrench.png" width="30" alt="built"/> What we built</h2>

- **Combined dataset training** — EfficientNetB0 fine-tuned on CASIA v1 + CASIA v2 + CG-1050 using `ConcatDataset`, trained on Kaggle GPU T4 for 40 epochs with AdamW + CosineAnnealingLR
- **Three-tier model loading** — inference.py tries XONetPretrained → XONet → PlainEfficientNetB0 as fallbacks, making the backend compatible with models trained in different environments
- **AI Generation Detector** — multi-signal pipeline: a fine-tuned ViT (`umm-maybe/AI-image-detector`, HuggingFace) as primary signal (55% weight) combined with EXIF metadata analysis, frequency domain 1/f² check, PRNU noise kurtosis, and ELA uniformity — correctly flags ChatGPT, DALL-E, Stable Diffusion, Midjourney outputs
- **Error Level Analysis (ELA)** — JPEG re-compression difference map reveals tampered blocks by exposing inconsistent compression artifacts
- **Grad-CAM fallback** — when SLIC/SIFT finds no keypoints (splicing attacks), Grad-CAM activations are shown so there's always a spatial explanation
- **Interactive web tool** — drag-and-drop upload, confidence gauge, before/after comparison slider, Grad-CAM / SLIC / ELA tab switching, AI likelihood breakdown card
- **REST API** — `/api/detect` returns verdict + confidence + base64 heatmap + Grad-CAM + ELA map + AI detection signals; `/api/training-history` serves live training curves

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Bar%20Chart.png" width="30" alt="results"/> Results</h2>

<div align="center">

[![Val Accuracy](https://img.shields.io/badge/Best%20Val%20Accuracy-96.41%25-7c3aed?style=for-the-badge)]()
&nbsp;
[![Optimizer](https://img.shields.io/badge/Optimizer-AdamW%20%2B%20CosineAnnealingLR-009688?style=for-the-badge)]()
&nbsp;
[![Epochs](https://img.shields.io/badge/Epochs-40-EE4C2C?style=for-the-badge)]()

</div>

<br/>

| Metric | Value |
|---|---|
| Best validation accuracy | 96.41% (epoch 38) |
| Training images | ~15,000+ (CASIA v1 + v2 + CG-1050) |
| Input resolution | 256 × 256 |
| Batch size | 32 |
| Learning rate | 1e-4 (AdamW) |
| LR schedule | CosineAnnealingLR |
| Backbone | EfficientNetB0 (ImageNet pretrained) |
| Loss | CrossEntropyLoss |
| Training hardware | Kaggle GPU T4 × 2 |

**Model comparison:**

| Model | Val Accuracy | Notes |
|---|---|---|
| EfficientNetB0 + SLIC + SIFT (ours) | **96.41%** | Combined dataset, 40 epochs |
| AlexNet baseline (Li et al.) | ~78% | CASIA only |
| Single-modal CNN | ~83% | No localization |

The model checkpoint (`dcnn_forgery.pt`) isn't in this repo due to file size — download it from the Kaggle notebook's Output tab and place at `backend/model/weights/dcnn_forgery.pt`.

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Gear.png" width="30" alt="stack"/> Tech stack</h2>

<div align="center">
  <img src="https://skillicons.dev/icons?i=python,pytorch,fastapi,opencv,react,ts,tailwind,vite,vercel" />
</div>

<br/>

| Layer | Technology |
|---|---|
| Backbone | EfficientNetB0 (torchvision pretrained) |
| Localization | SIFT + Brute-force L2 matcher (OpenCV), SLIC (scikit-image) |
| Explainability | Grad-CAM (hook on EfficientNetB0 features[-1]) |
| AI Detection | HuggingFace `umm-maybe/AI-image-detector` (ViT) + EXIF + FFT + PRNU |
| ELA | JPEG re-compression diff (Pillow + NumPy) |
| API | FastAPI 0.111, uvicorn, python-multipart |
| Frontend | React 19, TanStack Start, TypeScript, Tailwind CSS v4 |
| Charts | Recharts (training history page) |
| Deployment | Vercel (frontend static), VPS via PM2 (backend) |

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Laptop.png" width="30" alt="install"/> Installation</h2>

### Backend

```bash
cd backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install fastapi==0.111.0 uvicorn[standard]==0.30.1 python-multipart==0.0.9 \
            pillow==10.3.0 numpy==1.26.4 opencv-python==4.10.0.82 \
            scikit-image==0.23.2 scikit-learn==1.5.0 scipy==1.13.1 \
            transformers

uvicorn app:app --host 0.0.0.0 --port 8000
```

The first request will download the HuggingFace AI detection model (~330 MB, cached after that).

```bash
curl http://localhost:8000/health
# {"status":"ok","model_loaded":true}
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000  →  proxied to backend automatically
```

### Train from scratch (Kaggle)

```python
# Dataset paths on Kaggle:
CASIA1_AUTH  = "/kaggle/input/datasets/sophatvathana/casia-dataset/CASIA1/Au"
CASIA1_FORGED = "/kaggle/input/datasets/sophatvathana/casia-dataset/CASIA1/Sp"
CASIA2_AUTH  = "/kaggle/input/datasets/sophatvathana/casia-dataset/CASIA2/Au"
CASIA2_FORGED = "/kaggle/input/datasets/sophatvathana/casia-dataset/CASIA2/Tp"
CG_TRAIN_AUTH   = "/kaggle/input/datasets/saurabhshahane/cg1050/TRAINING_CG-1050/TRAINING/ORIGINAL"
CG_TRAIN_FORGED = "/kaggle/input/datasets/saurabhshahane/cg1050/TRAINING_CG-1050/TRAINING/TAMPERED"

# ConcatDataset combines all three
train_ds = ConcatDataset([FlatDS(CG_TRAIN_AUTH, CG_TRAIN_FORGED, tf_tr),
                          FlatDS(CASIA1_AUTH,   CASIA1_FORGED,   tf_tr),
                          FlatDS(CASIA2_AUTH,   CASIA2_FORGED,   tf_tr)])
```

Download `dcnn_forgery.pt` from the notebook Output tab → place at `backend/model/weights/dcnn_forgery.pt`.

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Globe%20with%20Meridians.png" width="30" alt="demo"/> Live demo</h2>

<div align="center">

**[https://forensic-vision.vercel.app](https://forensic-vision.vercel.app)**

The backend processes each image in 2–4 seconds. Grab an image from [`samples/forged/`](./samples/forged/) and drop it in — those are real CASIA forgeries from the test split.

</div>

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Open%20File%20Folder.png" width="30" alt="layout"/> Project layout</h2>

```
.
├── backend/
│   ├── app.py                 FastAPI app — /api/detect endpoint, wires all signals
│   ├── config.py              Hyperparameters, paths
│   ├── model/
│   │   ├── inference.py       ForgeryDetector — tries XONetPretrained → XONet → PlainEfficientNetB0
│   │   ├── train.py           Training loop (ConcatDataset, AdamW, CosineAnnealingLR)
│   │   ├── dataset.py         FlatDS dataloader — reads ORIGINAL/TAMPERED folder pairs
│   │   └── weights/           Place dcnn_forgery.pt here
│   └── utils/
│       ├── ai_detector.py     Multi-signal AI image detector (HuggingFace ViT + EXIF + FFT + PRNU)
│       ├── ela.py             Error Level Analysis — JPEG re-compression diff
│       ├── heatmap.py         SLIC superpixels + SIFT → JET colormap heatmap
│       ├── gradcam.py         Grad-CAM hook on EfficientNetB0 features[-1]
│       └── localize.py        Copy-move region localization helper
├── frontend/
│   ├── src/
│   │   ├── routes/            File-based routes (TanStack)
│   │   ├── components/        React components (detection, training, layout)
│   │   └── lib/               API client, types
│   └── static/                Pre-built output served by Vercel
├── samples/
│   ├── authentic/             5 CASIA authentic test images
│   └── forged/                5 CASIA forged test images
├── paper/
│   └── Passive image.pdf      Research paper
└── kaggle_train.py            Standalone Kaggle training script
```

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Warning.png" width="30" alt="limits"/> Limitations</h2>

- The SIFT copy-move detector breaks when forged regions are scaled beyond ~30% or rotated past ~45°
- Grad-CAM is a saliency map, not a pixel-precise forgery mask — it shows where the model looks, not exactly what is forged
- The AI generation detector's heuristic signals (frequency, PRNU) are tuned for photographic content — very complex synthetic graphics may require the ViT model to override them
- Heavy JPEG compression below quality ~50 degrades both ELA and SIFT matching

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Handshake.png" width="30" alt="team"/> Collaborators</h2>

<div align="center">

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Sw4pn33">
        <img src="https://github.com/Sw4pn33.png" width="80" style="border-radius:50%"/><br/>
        <b>Swopna Sarit Barik</b><br/>
        <sub>@Sw4pn33</sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/r4hul-s3thi">
        <img src="https://github.com/r4hul-s3thi.png" width="80" style="border-radius:50%"/><br/>
        <b>Rahul Sethi</b><br/>
        <sub>@r4hul-s3thi</sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/akifalik">
        <img src="https://github.com/akifalik.png" width="80" style="border-radius:50%"/><br/>
        <b>Akif Ali Khan</b><br/>
        <sub>@akifalik</sub>
      </a>
    </td>
  </tr>
</table>

</div>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=24&height=120&section=footer&animation=fadeIn" width="100%"/>

*Major Project — Image Forensics*

</div>
