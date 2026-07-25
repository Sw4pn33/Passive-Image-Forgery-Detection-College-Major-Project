import { useEffect, useState } from "react";

export function ScoreBar({
  label,
  value,
  color,
  hint,
}: {
  label: string;
  value: number;
  color: string;
  hint?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setW(pct));
    return () => cancelAnimationFrame(t);
  }, [pct]);

  return (
    <div>
      <div className="flex items-center justify-between text-[11.5px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="mono font-semibold" style={{ color }}>
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-2/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
          style={{ width: `${w}%`, backgroundColor: color }}
        />
      </div>
      {hint && <div className="mt-1 text-[10.5px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
