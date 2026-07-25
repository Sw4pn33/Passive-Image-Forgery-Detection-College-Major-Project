import { Cpu, Layers, Eye, Zap } from "lucide-react";

const GAP = [
  {
    title: "Single-modality limitation",
    body:  "Prior work used either deep learning (classification only) or handcrafted features (SIFT/SURF). Deep networks lacked localization; traditional methods broke under JPEG compression and resizing.",
  },
  {
    title: "No spatial localization",
    body:  "CNN classifiers output a binary label (real/fake) without revealing which region was tampered. Investigators need pixel-level spatial evidence for legal and forensic reporting.",
  },
  {
    title: "Single forgery type",
    body:  "Most methods addressed copy-move or splicing independently, not both. Real-world forgeries often combine or obscure the type. A unified pipeline is needed.",
  },
  {
    title: "Uninterpretable predictions",
    body:  "Neural network decisions were black-box — no visual evidence usable in court or by non-expert examiners. Interpretability is a core requirement for forensic tools.",
  },
];

const STEPS = [
  {
    n: "01", icon: Cpu, label: "DCNN Classification",
    desc: "EfficientNetB0 backbone pretrained on ImageNet, fine-tuned on CASIA v1.0. Classifies the image globally as authentic or forged with a probability score.",
  },
  {
    n: "02", icon: Layers, label: "SLIC Superpixel Segmentation",
    desc: "Simple Linear Iterative Clustering partitions the image into ~100 perceptually uniform superpixels. Per-superpixel L*a*b* colour statistics are computed.",
  },
  {
    n: "03", icon: Eye, label: "SIFT Keypoint Matching",
    desc: "Scale-Invariant Feature Transform extracts 500 keypoints. Brute-force L2 nearest-neighbour matching identifies geometrically duplicated regions — copy-move evidence.",
  },
  {
    n: "04", icon: Zap, label: "Forgery Localization + Heatmap",
    desc: "SLIC outlier superpixels (z-score > 2.5) flag illumination inconsistency for splicing. SIFT match clusters mark copy-move sites. Both are blended into a JET-coloured overlay.",
  },
];

const PERF = [
  { val: "92.64%",        lbl: "Best Val Accuracy", note: "Epoch 32 of 40" },
  { val: "0.2055",        lbl: "Best Val Loss",      note: "Epoch 36" },
  { val: "EfficientNetB0",lbl: "Backbone",           note: "ImageNet pretrained" },
  { val: "CASIA v1.0",   lbl: "Training Dataset",   note: "~1,700 images" },
];

export default function MethodologyPanel() {
  return (
    <div className="meth-page">
      {/* Research Gap */}
      <div className="meth-block">
        <div className="meth-eyebrow">Research Gap</div>
        <div className="meth-h2">What prior methods got wrong</div>
        <div className="gap-grid">
          {GAP.map((g, i) => (
            <div className="gap-card" key={g.title}>
              <div className="gap-n">0{i + 1}</div>
              <div className="gap-h">{g.title}</div>
              <div className="gap-p">{g.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How this system fills it */}
      <div className="meth-block">
        <div className="meth-eyebrow">Our Contribution</div>
        <div className="meth-h2">Hybrid DL + ML pipeline</div>
        <div className="steps-col">
          {STEPS.map(s => (
            <div className="step-row" key={s.n}>
              <div className="step-num">{s.n}</div>
              <div>
                <div className="step-lbl">{s.label}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance */}
      <div className="meth-block">
        <div className="meth-eyebrow">Performance</div>
        <div className="meth-h2">Model metrics on CASIA v1.0</div>
        <div className="perf-grid">
          {PERF.map(p => (
            <div className="perf-card" key={p.lbl}>
              <div className="perf-val">{p.val}</div>
              <div className="perf-lbl">{p.lbl}</div>
              <div className="perf-note">{p.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
