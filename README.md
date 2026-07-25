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

[![Dataset](https://img.shields.io/badge/Dataset-CASIA%20v1.0-ff6b6b?style=for-the-badge)](http://forensics.idealtest.org/)
[![Model](https://img.shields.io/badge/Backbone-EfficientNetB0-4ecdc4?style=for-the-badge)]()
[![Training](https://img.shields.io/badge/GPU-Kaggle%20T4-20BEFF?style=for-the-badge&logo=kaggle&logoColor=white)](https://kaggle.com)

<br/><br/>

[![Val Accuracy](https://img.shields.io/badge/Val%20Accuracy-~80%25-7c3aed?style=flat-square)]()
&nbsp;·&nbsp;
[![Images](https://img.shields.io/badge/Training%20Images-1842-009688?style=flat-square)]()
&nbsp;·&nbsp;
[![Classes](https://img.shields.io/badge/Classes-Authentic%20%7C%20Forged-EE4C2C?style=flat-square)]()
&nbsp;·&nbsp;
[![Resolution](https://img.shields.io/badge/Input%20Size-256×256-3776AB?style=flat-square)]()

</div>

<br/>

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Microscope.gif" width="30" alt="paper"/> What this paper is about</h2>

Image forgery — splicing objects from different sources, duplicating regions within the same photo — is increasingly hard to spot with the naked eye. The goal of **passive forgery detection** is to catch these manipulations using only pixel data, with no prior embedding of watermarks or signatures (hence "passive").

Most academic work falls into one of two camps: either a neural network that gives you a binary label (real/fake) without telling you *where* the forgery is, or classical signal-processing methods (noise analysis, JPEG artifact grids, DCT coefficient statistics) that struggle once the image has been recompressed, resized, or color-corrected.

Neither approach alone is satisfying. A classification score without spatial evidence isn't forensically useful. And classical localization methods often produce too many false positives on high-quality forgeries that match the surrounding noise profile.

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Magnifying%20Glass%20Tilted%20Left.gif" width="30" alt="gap"/> The gap we're addressing</h2>

Here's what the existing literature leaves on the table:

| Problem | What most papers do | What we do |
|---|---|---|
| **Spatial localization** | Binary label only | SLIC superpixel segmentation + SIFT keypoint matching to highlight suspect regions |
| **Copy-move vs splicing** | One or the other | Unified pipeline handles both attack types |
| **Explainability** | Black box | Grad-CAM activation maps overlaid on input |
| **Compressed images** | Fail on JPEG artifacts | EfficientNetB0 features are compression-robust |
| **End-to-end deployment** | Lab code, no interface | Full REST API + interactive web frontend |

Classical SIFT-based copy-move detectors work well when forged regions aren't heavily transformed, but break on post-processing. Pure CNNs generalize better but can't localize. This pipeline runs both and combines their outputs.

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Puzzle%20Piece.gif" width="30" alt="architecture"/> Architecture</h2>

```
Input Image
    │
    ├──► EfficientNetB0 ──► Global classification  (AUTHENTIC / FORGED)
    │         │
    │         └──► Grad-CAM ──► Activation heatmap  (where the model looks)
    │
    └──► SLIC superpixels ──► SIFT keypoint extraction
              │
              └──► FLANN matcher + RANSAC ──► Copy-move region mask
                        │
                        └──► JET colormap heatmap  (suspect regions)

FastAPI /api/detect  →  JSON: verdict + confidence + heatmap + gradcam
React frontend  →  drag-drop upload, comparison slider, heatmap toggle
```

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Card%20File%20Box.gif" width="30" alt="dataset"/> Dataset</h2>

**CASIA v1.0** — 921 authentic + 921 forged images (copy-move and splicing), JPEG, ~384×256 average resolution.

```
dataset/
├── train/    authentic/ (720)    forged/ (720)
├── val/      authentic/ (100)    forged/ (100)
└── test/     authentic/ (100)    forged/ (100)
```

Quick-start samples in [`samples/`](./samples/) — 5 authentic + 5 forged from the CASIA test set, ready to drop into the live demo.

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Hammer%20and%20Wrench.gif" width="30" alt="built"/> What we built</h2>

- **Hybrid detector** — EfficientNetB0 fine-tuned on CASIA, plus SLIC+SIFT for spatial localization of copy-move regions
- **Grad-CAM fallback** — when SLIC/SIFT finds no keypoints (splicing attacks), Grad-CAM activations are shown so there's always a spatial explanation
- **Interactive web tool** — drag-and-drop upload, confidence bar, forgery type label, before/after comparison slider, heatmap tab switching
- **REST API** — `/api/detect` returns verdict + confidence + base64 heatmap + original; `/api/training-history` serves live training curves

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Bar%20Chart.gif" width="30" alt="results"/> Results</h2>

<div align="center">

[![Val Accuracy](https://img.shields.io/badge/Epoch%201%20Val%20Accuracy-~80%25-7c3aed?style=for-the-badge)]()
&nbsp;
[![Optimizer](https://img.shields.io/badge/Optimizer-Adam%20lr%3D1e--4-009688?style=for-the-badge)]()
&nbsp;
[![Epochs](https://img.shields.io/badge/Epochs%20Configured-50-EE4C2C?style=for-the-badge)]()

</div>

<br/>

| Metric | Value |
|---|---|
| Validation accuracy (Epoch 1) | ~80% |
| Input resolution | 256 × 256 |
| Batch size | 32 |
| Backbone | EfficientNetB0 (ImageNet pretrained) |
| Loss | CrossEntropyLoss |

Training ran on Kaggle GPU T4. The model checkpoint (`dcnn_forgery.pt`) isn't in this repo due to file size — download it from the Kaggle notebook's Output tab and place at `backend/model/weights/dcnn_forgery.pt`.

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Gear.gif" width="30" alt="stack"/> Tech stack</h2>

<div align="center">
  <img src="https://skillicons.dev/icons?i=python,pytorch,fastapi,opencv,react,ts,tailwind,vite,vercel" />
</div>

<br/>

| Layer | Technology |
|---|---|
| Backbone | EfficientNetB0 (torchvision pretrained) |
| Localization | SIFT + FLANN + RANSAC (OpenCV), SLIC (scikit-image) |
| Explainability | Grad-CAM (manual hook on final conv layer) |
| API | FastAPI 0.111, uvicorn, python-multipart |
| Frontend | React 19, TanStack Start, TypeScript, Tailwind CSS v4 |
| Charts | Recharts (training history page) |
| Deployment | Vercel (frontend), VPS (backend via PM2) |

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Laptop.gif" width="30" alt="install"/> Installation</h2>

### Backend

```bash
cd backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install fastapi==0.111.0 uvicorn[standard]==0.30.1 python-multipart==0.0.9 \
            pillow==10.3.0 numpy==1.26.4 opencv-python==4.10.0.82 \
            scikit-image==0.23.2 scikit-learn==1.5.0 scipy==1.13.1

uvicorn app:app --host 0.0.0.0 --port 8000
```

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

### Train from scratch

```bash
cd backend
python model/train.py
# checkpoint → backend/model/weights/dcnn_forgery.pt
# log        → backend/model/weights/training_log.csv
```

Use Kaggle or any CUDA environment — CPU training will take hours per epoch.

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20Places/Globe%20with%20Meridians.gif" width="30" alt="demo"/> Live demo</h2>

<div align="center">

**[https://forensic-vision.vercel.app](https://forensic-vision.vercel.app)**

The backend processes each image in 2–4 seconds. Grab an image from [`samples/forged/`](./samples/forged/) and drop it in — those are real CASIA forgeries from the test split.

</div>

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Open%20File%20Folder.gif" width="30" alt="layout"/> Project layout</h2>

```
.
├── backend/
│   ├── app.py                 # FastAPI app + /api/detect endpoint
│   ├── config.py              # Hyperparameters, paths
│   ├── model/
│   │   ├── inference.py       # ForgeryDetector class
│   │   ├── train.py           # Training loop
│   │   ├── dataset.py         # CASIA dataloader
│   │   └── weights/           # Place dcnn_forgery.pt here
│   └── utils/
│       ├── heatmap.py         # SLIC+SIFT → JET heatmap
│       └── gradcam.py         # Grad-CAM hook
├── frontend/
│   ├── src/
│   │   ├── routes/            # File-based routes (TanStack)
│   │   ├── components/        # React components
│   │   └── lib/               # API client, types
│   └── static/                # Pre-built output served by Vercel
├── samples/
│   ├── authentic/             # 5 CASIA authentic test images
│   └── forged/                # 5 CASIA forged test images
└── paper/
    └── Passive image.pdf
```

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20Places/Warning.gif" width="30" alt="limits"/> Limitations</h2>

CASIA v1.0 is small and dated by modern standards. The model will struggle with:
- AI-generated images (Stable Diffusion, Midjourney, DALL-E)
- Content-aware fill or inpainting from Photoshop
- Heavy JPEG compression below quality ~50

The SIFT copy-move detector also breaks when regions are scaled beyond ~30% or rotated past ~45°. Grad-CAM provides a fallback explanation but it's a saliency map, not a pixel-precise forgery mask.

---

<h2><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Handshake.gif" width="30" alt="team"/> Collaborators</h2>

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

*College Major Project — Image Forensics*

</div>
