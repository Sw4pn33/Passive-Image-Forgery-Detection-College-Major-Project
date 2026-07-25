import { createFileRoute } from "@tanstack/react-router";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import {
  Ban,
  Compass,
  Layers,
  EyeOff,
  Cpu,
  Fingerprint,
  Map,
  UploadCloud,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology · ForensicVision" },
      {
        name: "description",
        content:
          "Research gap, our hybrid DL + ML contribution, and performance results for passive image forgery detection.",
      },
      { property: "og:title", content: "Methodology · ForensicVision" },
      {
        property: "og:description",
        content: "Hybrid EfficientNetB0 + SLIC + SIFT pipeline explained.",
      },
    ],
  }),
  component: MethodologyPage,
});

const GAPS = [
  {
    icon: Ban,
    title: "Single-modality limitation",
    body: "Prior work used either deep learning OR handcrafted features (SIFT/SURF). Deep networks lacked localization; traditional methods broke under JPEG compression.",
  },
  {
    icon: Compass,
    title: "No spatial localization",
    body: "CNNs output binary labels without revealing which region was tampered. Investigators need pixel-level spatial evidence for legal reporting.",
  },
  {
    icon: Layers,
    title: "Single forgery type",
    body: "Most methods addressed copy-move OR splicing independently. Real-world forgeries combine types. A unified pipeline is needed.",
  },
  {
    icon: EyeOff,
    title: "Uninterpretable predictions",
    body: "Black-box neural network decisions have no visual evidence usable in court or by non-expert examiners.",
  },
] satisfies Array<{ icon: LucideIcon; title: string; body: string }>;

const STEPS = [
  {
    n: "01",
    icon: Cpu,
    title: "DCNN Classification",
    body: "EfficientNetB0 backbone pretrained on ImageNet, fine-tuned on CASIA v1.0. Binary classification (authentic vs forged) with confidence score.",
  },
  {
    n: "02",
    icon: Layers,
    title: "SLIC Superpixel Segmentation",
    body: "Simple Linear Iterative Clustering partitions image into ~100 perceptually uniform superpixels. Per-superpixel Lab* colour statistics computed.",
  },
  {
    n: "03",
    icon: Fingerprint,
    title: "SIFT Keypoint Matching",
    body: "Scale-Invariant Feature Transform extracts 500 keypoints. Brute-force L2 nearest-neighbour matching identifies geometrically duplicated regions.",
  },
  {
    n: "04",
    icon: Map,
    title: "Forgery Localization + Heatmap",
    body: "SLIC outlier superpixels (z-score > 2.5) flag illumination inconsistency (splicing). SIFT match clusters mark copy-move regions. JET-coloured heatmap output.",
  },
] satisfies Array<{ n: string; icon: LucideIcon; title: string; body: string }>;

const PERF = [
  { value: "92.64%", label: "Best Val Accuracy", sub: "Epoch 32 of 40", accent: "text-teal" },
  { value: "0.2055", label: "Best Val Loss", sub: "Epoch 36", accent: "text-foreground" },
  { value: "EfficientNetB0", label: "Backbone", sub: "ImageNet pretrained", accent: "text-foreground" },
  { value: "CASIA v1.0", label: "Training Dataset", sub: "~1,700 images", accent: "text-primary" },
];

const HOW = [
  {
    icon: UploadCloud,
    title: "Upload Image",
    body: "Drag a suspected forgery image. JPG, PNG, TIFF, BMP, WebP supported.",
  },
  {
    icon: Cpu,
    title: "AI Analysis",
    body: "EfficientNetB0 classifies globally. SLIC segments into superpixels. SIFT finds duplicated keypoints.",
  },
  {
    icon: BarChart3,
    title: "Results + Heatmap",
    body: "Verdict with confidence score, forgery type, and JET heatmap overlay highlighting manipulated regions.",
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
          eyebrow="Contribution"
          title="Hybrid DL + ML pipeline"
          description="A four-stage pipeline that combines a modern CNN classifier with two classical computer-vision techniques to reveal, not just detect, forgery."
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
