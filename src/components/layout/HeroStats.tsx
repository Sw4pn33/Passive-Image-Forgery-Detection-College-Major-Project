const STATS = [
  {
    label: "Training Images",
    value: "~15,000+",
    sub: "CASIA v1 + CASIA v2 + CG-1050",
    valueClass: "text-primary",
    bar: "bg-primary",
  },
  {
    label: "Best Val Accuracy",
    value: "77.23%",
    sub: "Epoch 26 best · 40 epochs trained",
    valueClass: "text-teal",
    bar: "bg-teal",
  },
  {
    label: "Backbone",
    value: "EfficientNetB0",
    sub: "ImageNet pretrained",
    valueClass: "text-foreground",
    bar: "bg-foreground/30",
  },
  {
    label: "Localisation",
    value: "SLIC + SIFT",
    sub: "Hybrid ML approach",
    valueClass: "text-good",
    bar: "bg-good",
  },
] as const;

export function HeroStats() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-7">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="glass-card p-4 lg:p-5 relative overflow-hidden pl-5"
          >
            <div className={`absolute inset-y-0 left-0 w-[3px] ${s.bar} rounded-l-2xl opacity-70`} />
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
              {s.label}
            </div>
            <div className={`mt-2 text-[22px] lg:text-[24px] font-semibold tracking-tight mono ${s.valueClass}`}>
              {s.value}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>
      <p className="mt-3.5 text-[11.5px] text-muted-foreground/70 leading-relaxed">
        Improvement over single-modal CNN baselines · Localisation via SLIC colour-inconsistency + SIFT keypoint matching · Detects: copy-move, splicing
      </p>
    </section>
  );
}
