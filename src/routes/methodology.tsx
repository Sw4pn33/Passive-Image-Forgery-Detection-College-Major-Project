import { createFileRoute } from "@tanstack/react-router";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import {
  Ban,
  Compass,
  Layers,
  EyeOff,
  Cpu,
  Fingerprint,
  Network,
  UploadCloud,
  BarChart3,
  Scan,
  Bot,
  GitMerge,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology · ForensicVision" },
      {
        name: "description",
        content:
          "ForensicFusion-Net Phase 3: 4-stream EfficientNetV2-S backbone with ECA attention, transformer fusion, and U-Net pixel segmentation for passive image forgery detection.",
      },
      { property: "og:title", content: "Methodology · ForensicVision" },
      {
        property: "og:description",
        content: "ForensicFusion-Net Phase 3 — 4-stream fusion, ECA attention, U-Net mask, Grad-CAM.",
      },
    ],
  }),
  component: MethodologyPage,
});

const GAPS = [
  {
    icon: Ban,
    title: "Single-modality limitation",
    body: "Prior work processed only the RGB channel. Forgery traces in noise residuals (SRM), compression artifacts (ELA), and frequency anomalies (FFT/DCT) were completely ignored.",
  },
  {
    icon: Compass,
    title: "No pixel-level localization",
    body: "CNNs output binary labels without a spatial mask. Investigators need exact pixel-level evidence for legal and forensic reporting — a bounding box is insufficient.",
  },
  {
    icon: Layers,
    title: "Single forgery type",
    body: "Most methods addressed copy-move OR splicing independently. Real-world forgeries combine manipulation types. A unified 5-class multi-task head is required.",
  },
  {
    icon: EyeOff,
    title: "Uninterpretable predictions",
    body: "Black-box network decisions carry no visual justification. Grad-CAM explanation maps and SIFT keypoint overlays are needed for expert and non-expert examiners.",
  },
] satisfies Array<{ icon: LucideIcon; title: string; body: string }>;

const STEPS = [
  {
    n: "01",
    icon: Layers,
    title: "4-Stream Input Representation",
    body: "Each image is pre-processed into four parallel streams: (1) RGB — original pixel data, (2) SRM — high-pass residual noise revealing retouching, (3) ELA — JPEG re-compression error map highlighting tampered blocks, (4) FFT/DCT — spectral domain exposing periodicity and quantization anomalies.",
  },
  {
    n: "02",
    icon: Cpu,
    title: "EfficientNetV2-S Feature Extraction",
    body: "A shared EfficientNetV2-S backbone (pretrained on ImageNet) encodes each stream independently through 4 feature scales (64→128→256→512 channels). The same weights initialize all four encoders; stream-specific gradients diverge during fine-tuning on CASIA 2.0.",
  },
  {
    n: "03",
    icon: Network,
    title: "ECA Attention + Lightweight Transformer",
    body: "Efficient Channel Attention (ECA) re-weights each stream's feature maps channel-wise with no dimensionality reduction. A shallow 2-layer transformer cross-attends between all 4 streams, building a global context representation that is stream-agnostic.",
  },
  {
    n: "04",
    icon: Scan,
    title: "Multi-Task Heads",
    body: "Three simultaneous prediction heads: (a) binary classification head — authentic / forged with sigmoid confidence, (b) 5-class forgery-type head — copy-move, splicing, object-removal, AI-generated, unknown via softmax, (c) U-Net decoder — 256×256 pixel segmentation mask with white = forged, black = clean.",
  },
  {
    n: "05",
    icon: Fingerprint,
    title: "Grad-CAM + SIFT/RANSAC Verification",
    body: "Gradient-weighted Class Activation Mapping (Grad-CAM) backpropagates classification gradients through the final conv layer, producing a spatial attention heatmap. SIFT extracts 500 keypoints; RANSAC-filtered matches between duplicate regions confirm copy-move forgery with geometric consistency.",
  },
  {
    n: "06",
    icon: Bot,
    title: "AI-Generation Detection",
    body: "A parallel ViT-based classifier analyses frequency-domain signals (FFT/DCT spectral uniformity), PRNU sensor noise absence, EXIF metadata inconsistencies, and ELA uniformity patterns — features absent in camera-captured images — fused by an MLP/XGBoost ensemble.",
  },
] satisfies Array<{ n: string; icon: LucideIcon; title: string; body: string }>;

const PERF = [
  { value: "98.12%", label: "Best Score", sub: "F1×0.6 + val_acc×0.4 · Epoch 18", accent: "text-teal" },
  { value: "0.55", label: "Best Val Loss", sub: "Epoch 18 of 25", accent: "text-foreground" },
  { value: "EfficientNetV2-S", label: "Backbone", sub: "ImageNet pretrained · 4-stream", accent: "text-foreground" },
  { value: "CASIA 2.0", label: "Training Dataset", sub: "~12,600 images · epoch 18 best", accent: "text-primary" },
];

const HOW = [
  {
    icon: UploadCloud,
    title: "Upload Image",
    body: "Drag a suspected forgery image. JPG, PNG, TIFF, BMP, WebP supported up to 15 MB.",
  },
  {
    icon: GitMerge,
    title: "4-Stream Fusion",
    body: "ForensicFusion-Net simultaneously analyzes RGB, SRM residual noise, ELA compression artifacts, and FFT/DCT frequency domain. ECA attention and a transformer fuse all streams.",
  },
  {
    icon: BarChart3,
    title: "Multi-output Results",
    body: "Verdict + confidence, 5-class forgery type, Grad-CAM heatmap, U-Net pixel mask (Mask tab), red overlay (Overlay tab), SIFT keypoint matches, and AI-generation signal breakdown.",
  },
] satisfies Array<{ icon: LucideIcon; title: string; body: string }>;

function MethodologyPage() {
  return (
    <div className="space-y-8">
      <section className="glass-card p-6 lg:p-8">
        <SectionEyebrow
          eyebrow="Research Gap"
          title="What prior methods got wrong"
          description="Existing image forgery detection literature suffers from four recurring shortcomings that motivated this project."
        />
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {GAPS.map((g) => {
            const Icon = g.icon;
            return (
              <div
                key={g.title}
                className="rounded-2xl border border-border/70 bg-surface/50 p-5 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-destructive/10 border border-destructive/30 text-destructive shrink-0">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-foreground">{g.title}</h3>
                    <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-relaxed">
                      {g.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass-card p-6 lg:p-8">
        <SectionEyebrow
          eyebrow="Contribution — Phase 3"
          title="ForensicFusion-Net architecture"
          description="A six-stage multi-task pipeline: 4-stream EfficientNetV2-S encoders fused by ECA attention and a lightweight transformer, producing classification, forgery-type, and a U-Net pixel mask simultaneously."
        />
        <ol className="mt-6 space-y-4">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <li
                key={s.n}
                className="relative rounded-2xl border border-border/70 bg-surface/50 p-5 flex gap-5"
              >
                <div className="flex flex-col items-center shrink-0">
                  <div className="grid size-12 place-items-center rounded-xl border border-primary/40 bg-primary/8 font-semibold mono text-primary text-[13px]">
                    {s.n}
                  </div>
                  <div className="mt-2 grid size-8 place-items-center rounded-lg bg-surface-2/70 border border-border/70">
                    <Icon className="size-4 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed max-w-2xl">
                    {s.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="glass-card p-6 lg:p-8">
        <SectionEyebrow eyebrow="Performance" title="Measured results" />
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PERF.map((p) => (
            <div
              key={p.label}
              className="rounded-2xl border border-border/70 bg-surface/50 p-5"
            >
              <div className={`text-2xl font-semibold tracking-tight mono ${p.accent}`}>
                {p.value}
              </div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
                {p.label}
              </div>
              <div className="mt-1 text-[11.5px] text-muted-foreground">{p.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-6 lg:p-8">
        <SectionEyebrow eyebrow="Workflow" title="How It Works" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {HOW.map((h) => {
            const Icon = h.icon;
            return (
              <div
                key={h.title}
                className="rounded-2xl border border-border/70 bg-surface/50 p-5"
              >
                <div className="grid size-11 place-items-center rounded-xl border border-primary/35 bg-primary/8 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-[14.5px] font-semibold text-foreground">{h.title}</h3>
                <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-relaxed">
                  {h.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
