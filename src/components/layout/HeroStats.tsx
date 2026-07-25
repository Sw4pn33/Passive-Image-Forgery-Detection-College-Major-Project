import { Database, Trophy, Cpu, Layers } from "lucide-react";

const STATS = [
  {
    label: "Training Images",
    value: "~1,700",
    sub: "CASIA v1.0 dataset",
    icon: Database,
    accent: "text-primary",
  },
  {
    label: "Best Val Accuracy",
    value: "92.64%",
    sub: "Epoch 32 of 40 trained",
    icon: Trophy,
    accent: "text-teal",
  },
  {
    label: "Backbone Architecture",
    value: "EfficientNetB0",
    sub: "ImageNet pretrained",
    icon: Cpu,
    accent: "text-foreground",
  },
  {
    label: "Localisation Pipeline",
    value: "SLIC + SIFT",
    sub: "Hybrid ML approach",
    icon: Layers,
    accent: "text-good",
  },
] as const;

export function HeroStats() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="glass-card p-4 lg:p-5 relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
                  {s.label}
                </div>
                <Icon className="size-4 text-muted-foreground/70" />
              </div>
              <div
                className={`mt-2 text-2xl lg:text-[26px] font-semibold tracking-tight mono ${s.accent}`}
              >
                {s.value}
              </div>
              <div className="mt-1 text-[11.5px] text-muted-foreground">{s.sub}</div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[12px] text-muted-foreground leading-relaxed">
        Improvement over single-modal CNN baselines · Localisation via SLIC
        colour-inconsistency + SIFT keypoint matching · Detects: copy-move, splicing
      </p>
    </section>
  );
}
