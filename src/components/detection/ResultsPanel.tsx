import {
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Copy,
  FileText,
  FileDown,
  CheckCircle2,
  XCircle,
  Layers,
  ImageDown,
  Clock,
  ChevronLeft,
  ChevronRight,
  Bot,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { MetricCell } from "@/components/common/MetricCell";
import { ScoreBar } from "@/components/common/ScoreBar";
import { downloadPdf, downloadTxt } from "@/lib/reports";
import { downloadAnnotatedPng } from "@/lib/annotated";
import type { StoredResult } from "@/lib/types";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Props {
  loading: boolean;
  error: string | null;
  result: StoredResult | null;
  onRetry: () => void;
}

export function ResultsPanel({ loading, error, result, onRetry }: Props) {
  return (
    <section className="glass-card p-5 lg:p-6 min-h-[560px] relative overflow-hidden">
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : result ? (
        <ResultView key={result.id} item={result} />
      ) : (
        <EmptyState />
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center px-8">
      <div className="grid size-16 place-items-center rounded-2xl border border-border bg-surface/60">
        <ShieldCheck className="size-7 text-muted-foreground/60" strokeWidth={1.5} />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
        Awaiting Analysis
      </h3>
      <p className="mt-2 max-w-sm text-[13px] text-muted-foreground leading-relaxed">
        Upload a suspected image to run the DCNN classifier, SLIC superpixel segmentation, and
        SIFT keypoint matching. Results and a JET-coloured heatmap will appear here.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center">
      <div className="relative h-40 w-40 rounded-2xl border border-primary/40 bg-surface/50 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(46,124,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(46,124,246,0.08)_1px,transparent_1px)] bg-[size:16px_16px]" />
        <div className="absolute inset-x-0 h-1/3 gradient-brand opacity-70 blur-md animate-scan" />
        <div className="absolute inset-0 grid place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </div>
      <div className="mt-5 text-[14px] font-medium text-foreground">Analyzing image…</div>
      <div className="mt-1 text-[11.5px] text-muted-foreground mono">
        DCNN classification · SLIC segmentation · SIFT matching · Grad-CAM
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center px-6">
      <div className="grid size-16 place-items-center rounded-2xl bg-destructive/10 border border-destructive/30">
        <AlertTriangle className="size-8 text-destructive" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">Analysis failed</h3>
      <p className="mt-2 max-w-sm text-[12.5px] text-muted-foreground break-words">{message}</p>
      <Button onClick={onRetry} className="mt-5 bg-primary text-primary-foreground border-0">
        Retry
      </Button>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Ensure the FastAPI backend is running on{" "}
        <span className="mono">localhost:8000</span>.
      </p>
    </div>
  );
}

function ConfidenceGauge({ value, forged }: { value: number; forged: boolean }) {
  const [displayed, setDisplayed] = useState(0);
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (displayed / 100) * circ;
  const color = forged ? "#ef4444" : "#10b981";

  useEffect(() => {
    const raf = requestAnimationFrame(() => setDisplayed(value));
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className="relative flex items-center justify-center size-24">
      <svg width="96" height="96" viewBox="0 0 96 96" className="rotate-[-90deg]">
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-border"
        />
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[17px] font-bold mono leading-none" style={{ color }}>
          {value.toFixed(0)}%
        </span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">
          conf
        </span>
      </div>
    </div>
  );
}

function CompareSlider({
  original,
  heatmap,
  label,
}: {
  original: string;
  heatmap: string;
  label: string;
}) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.min(98, Math.max(2, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-xl border border-border/70 bg-black/10 cursor-ew-resize"
      onMouseMove={(e) => dragging.current && updatePos(e.clientX)}
      onMouseDown={(e) => { dragging.current = true; updatePos(e.clientX); }}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchStart={(e) => updatePos(e.touches[0].clientX)}
      onTouchMove={(e) => { e.preventDefault(); updatePos(e.touches[0].clientX); }}
    >
      <img
        src={`data:image/jpeg;base64,${heatmap}`}
        alt="heatmap"
        className="w-full h-auto block pointer-events-none"
        draggable={false}
      />

      <img
        src={original}
        alt="original"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          objectFit: "fill",
          clipPath: `inset(0 ${(100 - pos).toFixed(1)}% 0 0)`,
        }}
        draggable={false}
      />

      <div
        className="absolute top-0 bottom-0 w-px bg-white/90 shadow-[0_0_6px_rgba(0,0,0,0.4)]"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white rounded-full px-2 py-1.5 shadow-lg border border-border/30">
          <ChevronLeft className="size-3 text-foreground/70" />
          <ChevronRight className="size-3 text-foreground/70" />
        </div>
      </div>

      <div className="absolute bottom-2 left-2 text-[9px] uppercase tracking-widest text-white bg-black/50 px-1.5 py-0.5 rounded">
        Original
      </div>
      <div className="absolute bottom-2 right-2 text-[9px] uppercase tracking-widest text-white bg-black/50 px-1.5 py-0.5 rounded">
        {label}
      </div>
    </div>
  );
}

function ResultView({ item }: { item: StoredResult }) {
  const r = item.result;
  const m = r.forensic_meta;
  const forged = r.verdict === "FORGED";
  const [heatmapMode, setHeatmapMode] = useState<"slic" | "gradcam" | "ela">("gradcam");

  const slicEmpty = m.sift_matches === 0 && m.outlier_segments === 0;

  const copySummary = async () => {
    const type = r.forgery_type.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const label = forged ? `${type} Forgery` : "Authentic";
    const text = `ForensicVision · Verdict: ${r.verdict} · Confidence: ${r.confidence.toFixed(1)}% · Type: ${label} · Time: ${r.process_time_ms}ms`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Summary copied");
    } catch {
      toast.error("Clipboard blocked");
    }
  };

  const activeHeatmap =
    heatmapMode === "gradcam" ? r.gradcam_jpeg
    : heatmapMode === "ela"   ? (r.ela_jpeg ?? r.gradcam_jpeg)
    : r.heatmap;

  return (
    <div className="animate-result space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-good/15 border border-good/30">
            <CheckCircle2 className="size-4 text-good" />
          </div>
          <div>
            <div className="text-[13.5px] font-semibold text-foreground">Analysis Complete</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10.5px] text-muted-foreground mono truncate max-w-[180px]">
                {item.filename}
              </span>
              {r.process_time_ms > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70 mono">
                  <Clock className="size-2.5" />
                  {r.process_time_ms}ms
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={copySummary} className="border-border/70 h-7 text-[11px]">
            <Copy className="size-3" /> Copy
          </Button>
          <Button size="sm" variant="outline" onClick={() => { downloadTxt(item); toast.success("TXT downloaded"); }} className="border-border/70 h-7 text-[11px]">
            <FileText className="size-3" /> TXT
          </Button>
          <Button size="sm" variant="outline" onClick={async () => { try { await downloadAnnotatedPng(item, 0.6); toast.success("PNG downloaded"); } catch { toast.error("PNG failed"); } }} className="border-border/70 h-7 text-[11px]">
            <ImageDown className="size-3" /> PNG
          </Button>
          <Button size="sm" variant="outline" onClick={async () => { await downloadPdf(item); toast.success("PDF downloaded"); }} className="border-border/70 h-7 text-[11px]">
            <FileDown className="size-3" /> PDF
          </Button>
        </div>
      </div>

      <div className={cn(
        "rounded-2xl border p-4 relative overflow-hidden flex items-center gap-4",
        forged ? "border-destructive/40 bg-destructive/[0.06]" : "border-good/40 bg-good/[0.06]",
      )}>
        <div className="absolute -right-4 -top-4 opacity-[0.06]">
          {forged ? <XCircle className="size-28" /> : <CheckCircle2 className="size-28" />}
        </div>
        <ConfidenceGauge value={r.confidence} forged={forged} />
        <div>
          <div className={cn("text-2xl font-bold tracking-tight", forged ? "text-destructive" : "text-good")}>
            {r.verdict}
          </div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-[0.14em] mono mt-0.5">
            {r.forgery_type === "none" ? "No manipulation" : `${r.forgery_type} forgery`}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {forged ? (
              <AlertTriangle className="size-3.5 text-destructive" />
            ) : (
              <CheckCircle2 className="size-3.5 text-good" />
            )}
            <span className={cn("text-[11.5px]", forged ? "text-destructive/80" : "text-good/80")}>
              {forged ? "Manipulation detected" : "No manipulation found"}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11.5px] font-medium text-foreground">Image Comparison</div>
          <div className="flex rounded-lg border border-border/70 overflow-hidden text-[10.5px] font-medium">
            <button
              onClick={() => setHeatmapMode("slic")}
              className={cn(
                "px-3 py-1 transition-colors",
                heatmapMode === "slic"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              SLIC + SIFT
            </button>
            <button
              onClick={() => setHeatmapMode("gradcam")}
              className={cn(
                "px-3 py-1 transition-colors border-l border-border/70",
                heatmapMode === "gradcam"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Grad-CAM
            </button>
            {r.ela_jpeg && (
              <button
                onClick={() => setHeatmapMode("ela")}
                className={cn(
                  "px-3 py-1 transition-colors border-l border-border/70",
                  heatmapMode === "ela"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                ELA
              </button>
            )}
          </div>
        </div>
        {heatmapMode === "slic" && slicEmpty && (
          <p className="mb-1.5 text-[10.5px] text-muted-foreground/70 italic">
            SLIC/SIFT found no suspicious regions — backend returned Grad-CAM as fallback.
          </p>
        )}
        {heatmapMode === "ela" && (
          <p className="mb-1.5 text-[10.5px] text-muted-foreground/70 italic">
            ELA — bright patches indicate inconsistent JPEG compression. Tampered / AI-generated regions appear brighter.
          </p>
        )}
        <CompareSlider
          original={item.originalDataUrl}
          heatmap={activeHeatmap}
          label={heatmapMode === "gradcam" ? "Grad-CAM" : heatmapMode === "ela" ? "ELA Map" : "SLIC+SIFT"}
        />
        <div className="mt-1.5 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-sm bg-blue-500" /> low
          </span>
          <span className="h-px w-8 bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500" />
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-sm bg-red-500" /> high
          </span>
          <span className="text-muted-foreground/50 ml-2">drag divider to compare</span>
        </div>
      </div>

      <AiDetectionCard ai={r.ai_detection} elaUniformity={r.ela_uniformity} />

      {forged && (
        <div className="rounded-2xl border border-border/70 bg-surface/50 p-4">
          <div className="flex items-center gap-2 text-[12.5px] font-semibold text-foreground">
            <Layers className="size-4 text-primary" />
            Algorithm Diagnostics
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <MetricCell label="SIFT Keypoints" value={m.sift_keypoints} hint="Total scale-invariant keypoints detected (max 500)." />
            <MetricCell label="SIFT Matches" value={m.sift_matches} danger={m.sift_matches > 0} hint="Pairs with near-identical descriptors — evidence of copy-move." />
            <MetricCell label="SLIC Segments" value={m.slic_segments} hint="Number of perceptually uniform superpixels." />
            <MetricCell label="Outlier Regions" value={m.outlier_segments} danger={m.outlier_segments > 0} hint="Superpixels with Lab* colour z-score > 2.5 — evidence of splicing." />
          </div>
          <Separator className="my-3 bg-border/60" />
          <div className="space-y-2.5">
            <ScoreBar label="Copy-Move Score" value={m.copy_move_score} color="#f59e0b" hint="Density of matched SIFT keypoints." />
            <ScoreBar label="Splicing Score" value={m.splicing_score} color="#a855f7" hint="Illumination inconsistency across superpixels." />
          </div>
        </div>
      )}

      <ConclusionRow forged={forged} type={r.forgery_type} />

      <div className="rounded-2xl border border-border/70 bg-surface/50 overflow-hidden">
        <div className="px-4 pt-3 pb-2 text-[12px] font-semibold text-foreground">Model Comparison</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border/60">
                <th className="px-4 py-2 font-medium">Model</th>
                <th className="px-4 py-2 font-medium">Val Accuracy</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="mono">
              <tr className="border-b border-border/40">
                <td className="px-4 py-2.5 font-sans text-foreground">EfficientNetB0 + SLIC + SIFT</td>
                <td className="px-4 py-2.5 text-good font-semibold">92.64%</td>
                <td className="px-4 py-2.5 text-muted-foreground">Best · epoch 32</td>
              </tr>
              <tr className="border-b border-border/40">
                <td className="px-4 py-2.5 font-sans text-foreground">AlexNet baseline (Li et al.)</td>
                <td className="px-4 py-2.5 text-destructive">~78%</td>
                <td className="px-4 py-2.5 text-muted-foreground">Baseline</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-sans text-foreground">Single-modal CNN</td>
                <td className="px-4 py-2.5 text-destructive">~83%</td>
                <td className="px-4 py-2.5 text-muted-foreground">No localization</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SignalBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className="mono">{value.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function AiDetectionCard({ ai, elaUniformity }: { ai: import("@/lib/types").AiDetection | undefined; elaUniformity: number | undefined }) {
  if (!ai) return null;
  const isAi = ai.is_ai_generated;
  const uncertain = ai.label === "Uncertain";

  const borderColor = uncertain
    ? "border-yellow-500/40"
    : isAi
    ? "border-violet-500/40"
    : "border-good/40";
  const bgColor = uncertain
    ? "bg-yellow-500/[0.05]"
    : isAi
    ? "bg-violet-500/[0.06]"
    : "bg-good/[0.06]";
  const textColor = uncertain
    ? "text-yellow-500"
    : isAi
    ? "text-violet-400"
    : "text-good";

  const Icon = uncertain ? ShieldCheck : isAi ? Bot : Camera;

  return (
    <div className={cn("rounded-2xl border p-4", borderColor, bgColor)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={cn("grid size-8 place-items-center rounded-lg border", borderColor, bgColor)}>
            <Icon className={cn("size-4", textColor)} />
          </div>
          <div>
            <div className="text-[12.5px] font-semibold text-foreground">AI Generation Analysis</div>
            <div className={cn("text-[10.5px] mono uppercase tracking-widest mt-0.5", textColor)}>
              {ai.label}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-xl font-bold mono", textColor)}>{ai.confidence.toFixed(0)}%</div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">AI likelihood</div>
        </div>
      </div>

      <Separator className="my-3 bg-border/60" />

      <div className="space-y-2">
        <SignalBar label="EXIF Metadata" value={ai.signals.exif} color={isAi ? "#a855f7" : "#10b981"} />
        <SignalBar label="Frequency Domain" value={ai.signals.frequency} color={isAi ? "#a855f7" : "#10b981"} />
        <SignalBar label="Noise Pattern (PRNU)" value={ai.signals.noise} color={isAi ? "#a855f7" : "#10b981"} />
        <SignalBar label="ELA Uniformity" value={ai.signals.ela} color={isAi ? "#a855f7" : "#10b981"} />
      </div>

      <p className="mt-3 text-[10.5px] text-muted-foreground leading-snug">
        {isAi
          ? "Multi-signal analysis indicates this image was likely generated by an AI model (Stable Diffusion, DALL·E, Midjourney, or similar). Authentic camera photos exhibit distinct EXIF metadata, natural 1/f² frequency spectrum, and non-Gaussian sensor noise."
          : uncertain
          ? "Signals are inconclusive. The image may be a screenshot, a heavily compressed photo, or lightly AI-enhanced. Manual review recommended."
          : "Multi-signal analysis indicates a real camera photograph. Natural 1/f² frequency spectrum, PRNU sensor noise, and camera EXIF metadata are consistent with authentic capture."}
      </p>
    </div>
  );
}

function ConclusionRow({ forged, type }: { forged: boolean; type: "copy-move" | "splicing" | "unknown" | "none" }) {
  if (!forged) {
    return (
      <div className="rounded-xl border border-good/40 bg-good/10 px-4 py-3 text-[12px] text-good/90 flex items-start gap-2.5">
        <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-good" />
        <span>No signs of manipulation. Neither SLIC illumination outliers nor SIFT duplication clusters exceeded detection thresholds.</span>
      </div>
    );
  }
  const msg =
    type === "copy-move"
      ? "SIFT identified geometrically duplicated keypoint clusters — a region was copied and pasted within the image."
      : type === "splicing"
        ? "SLIC superpixels revealed inconsistent illumination and colour statistics — content was spliced from a different source image."
        : "Deep classifier detected manipulation. SLIC/SIFT signals were below threshold — use Grad-CAM view for neural network localization.";
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-[12px] text-destructive/90 flex items-start gap-2.5">
      <AlertTriangle className="size-4 mt-0.5 shrink-0 text-destructive" />
      <span>{msg}</span>
    </div>
  );
}
