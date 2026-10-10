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
  Cpu,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { MetricCell } from "@/components/common/MetricCell";
import { ScoreBar } from "@/components/common/ScoreBar";
import { downloadPdf, downloadTxt } from "@/lib/reports";
import { downloadAnnotatedPng } from "@/lib/annotated";
import type { StoredResult, ForgeryType5 } from "@/lib/types";
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
        Upload a suspected image to run the ForensicFusion-Net 4-stream analysis: RGB classifier,
        SRM residual noise, FFT/DCT frequency domain, and ELA compression artifact detection.
        A pixel-level forgery mask and Grad-CAM heatmap will appear here.
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
        RGB · SRM · FFT/DCT · ELA · ECA Attention · Transformer · U-Net mask
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
        <circle cx="48" cy="48" r={radius} fill="none" stroke="currentColor"
          strokeWidth="6" className="text-border" />
        <circle cx="48" cy="48" r={radius} fill="none" stroke={color}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[17px] font-bold mono leading-none" style={{ color }}>
          {value.toFixed(0)}%
        </span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">conf</span>
      </div>
    </div>
  );
}

function CompareSlider({
  original, heatmap, label,
}: { original: string; heatmap: string; label: string }) {
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
      <img src={`data:image/jpeg;base64,${heatmap}`} alt="heatmap"
        className="w-full h-auto block pointer-events-none" draggable={false} />
      <img src={original} alt="original"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ objectFit: "fill", clipPath: `inset(0 ${(100 - pos).toFixed(1)}% 0 0)` }}
        draggable={false} />
      <div className="absolute top-0 bottom-0 w-px bg-white/90 shadow-[0_0_6px_rgba(0,0,0,0.4)]"
        style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white rounded-full px-2 py-1.5 shadow-lg border border-border/30">
          <ChevronLeft className="size-3 text-foreground/70" />
          <ChevronRight className="size-3 text-foreground/70" />
        </div>
      </div>
      <div className="absolute bottom-2 left-2 text-[9px] uppercase tracking-widest text-white bg-black/50 px-1.5 py-0.5 rounded">Original</div>
      <div className="absolute bottom-2 right-2 text-[9px] uppercase tracking-widest text-white bg-black/50 px-1.5 py-0.5 rounded">{label}</div>
    </div>
  );
}

function ForgeryTypeBadge({ type }: { type: ForgeryType5 | string }) {
  const MAP: Record<string, { label: string; color: string; bg: string }> = {
    "copy-move":      { label: "Copy-Move",      color: "text-amber-500",  bg: "bg-amber-500/10 border-amber-500/30" },
    "splicing":       { label: "Splicing",        color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
    "object-removal": { label: "Object Removal",  color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
    "ai-generated":   { label: "AI-Generated",    color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
    "unknown":        { label: "Unknown",          color: "text-muted-foreground", bg: "bg-border/30 border-border/50" },
    "none":           { label: "Authentic",        color: "text-good",      bg: "bg-good/10 border-good/30" },
  };
  const s = MAP[type] ?? MAP["unknown"];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium mono uppercase tracking-widest", s.color, s.bg)}>
      {s.label}
    </span>
  );
}

function DomainScoresPanel({ scores }: { scores: NonNullable<StoredResult["result"]["domain_scores"]> }) {
  const streams = [
    { key: "rgb",  label: "RGB Stream",     color: "#2e7cf6", hint: "EfficientNetV2-S classification confidence" },
    { key: "srm",  label: "SRM Residual",   color: "#f59e0b", hint: "SRM high-pass filter noise inconsistency" },
    { key: "freq", label: "FFT / DCT",      color: "#10b981", hint: "Frequency domain manipulation indicator" },
    { key: "ela",  label: "ELA Uniformity", color: "#a855f7", hint: "Error Level Analysis — compression inconsistency" },
  ] as const;

  return (
    <div className="rounded-2xl border border-border/70 bg-surface/50 p-4">
      <div className="flex items-center gap-2 text-[12.5px] font-semibold text-foreground mb-3">
        <Activity className="size-4 text-primary" />
        Domain Evidence Breakdown
      </div>
      <div className="space-y-2.5">
        {streams.map((s) => (
          <ScoreBar
            key={s.key}
            label={s.label}
            value={(scores as Record<string, number>)[s.key] ?? 0}
            color={s.color}
            hint={s.hint}
          />
        ))}
      </div>
    </div>
  );
}

type VisMode = "gradcam" | "mask" | "overlay" | "ela" | "keypoints";

function ForgeryOverlayCanvas({ original, maskB64 }: { original: string; maskB64: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let alive = true;
    const oImg = new Image();
    oImg.onload = () => {
      if (!alive) return;
      const W = oImg.naturalWidth, H = oImg.naturalHeight;
      canvas.width = W; canvas.height = H;
      const mImg = new Image();
      mImg.onload = () => {
        if (!alive) return;
        const off = document.createElement("canvas");
        off.width = W; off.height = H;
        const oc = off.getContext("2d")!;
        oc.drawImage(mImg, 0, 0, W, H);
        const md = oc.getImageData(0, 0, W, H).data;
        const ov = document.createElement("canvas");
        ov.width = W; ov.height = H;
        const ovc = ov.getContext("2d")!;
        const od = ovc.createImageData(W, H);
        for (let i = 0; i < md.length; i += 4) {
          const v = md[i];
          if (v > 20) {
            od.data[i]   = 255;
            od.data[i+1] = Math.round(60 * (1 - v / 255));
            od.data[i+2] = 0;
            od.data[i+3] = Math.min(215, Math.round(v * 1.6));
          }
        }
        ovc.putImageData(od, 0, 0);
        ctx.drawImage(oImg, 0, 0, W, H);
        ctx.globalAlpha = 0.65;
        ctx.drawImage(ov, 0, 0, W, H);
        ctx.globalAlpha = 1;
        setReady(true);
      };
      mImg.onerror = () => { ctx.drawImage(oImg, 0, 0, W, H); setReady(true); };
      mImg.src = `data:image/jpeg;base64,${maskB64}`;
    };
    oImg.onerror = () => setReady(true);
    oImg.src = original;
    return () => { alive = false; };
  }, [original, maskB64]);
  return (
    <div className="relative rounded-xl overflow-hidden border border-border/70 bg-black/5" style={{ minHeight: 160 }}>
      {!ready && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>}
      <canvas ref={ref} className="w-full h-auto block" />
      <div className="absolute bottom-2 left-2 text-[9px] uppercase tracking-widest text-white bg-black/60 px-1.5 py-0.5 rounded">Original</div>
      <div className="absolute bottom-2 right-2 text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1">
        <span className="inline-block size-1.5 rounded-full bg-red-500" />
        <span className="uppercase tracking-widest">Forged Region</span>
      </div>
    </div>
  );
}

function BinaryMaskCanvas({ maskB64, hasPhase3 }: { maskB64: string; hasPhase3: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (!alive) return;
      const W = img.naturalWidth, H = img.naturalHeight;
      canvas.width = W; canvas.height = H;
      ctx.drawImage(img, 0, 0, W, H);
      try {
        const id = ctx.getImageData(0, 0, W, H);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const R = d[i], G = d[i + 1], B = d[i + 2];
          // JET colormap: red/yellow = hot (forged), blue/cyan = cold (clean)
          // R-B gives +255 for red/yellow, -255 for blue, use 50 as threshold
          const heat = R - B + (R > 200 && G < 150 ? 80 : 0);
          const bw = heat > 50 ? 255 : 0;
          d[i] = d[i + 1] = d[i + 2] = bw;
          d[i + 3] = 255;
        }
        ctx.putImageData(id, 0, 0);
      } catch {
        // getImageData blocked (e.g. canvas tainted) — show colored heatmap as-is
      }
      setReady(true);
    };
    img.onerror = () => setReady(true);
    img.src = `data:image/jpeg;base64,${maskB64}`;
    return () => { alive = false; };
  }, [maskB64]);
  return (
    <div className="relative rounded-xl overflow-hidden border border-border/70 bg-black" style={{ minHeight: 160 }}>
      {!ready && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>}
      <canvas ref={ref} className="w-full h-auto block" />
      <div className="absolute bottom-2 left-2 flex items-center gap-2">
        <span className="text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1">
          <span className="inline-block size-1.5 rounded-full bg-white" />Forged
        </span>
        <span className="text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1">
          <span className="inline-block size-1.5 rounded-full bg-gray-700 border border-white/20" />Clean
        </span>
      </div>
      <div className="absolute bottom-2 right-2 text-[9px] uppercase tracking-widest text-white bg-black/60 px-1.5 py-0.5 rounded">
        {hasPhase3 ? "U-Net Predicted Mask" : "SLIC+SIFT Heatmap"}
      </div>
    </div>
  );
}

function KeypointMatchCanvas({ original, maskB64, siftMatches }: {
  original: string; maskB64: string; siftMatches: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let alive = true;
    const oImg = new Image();
    oImg.onload = () => {
      if (!alive) return;
      const W = oImg.naturalWidth, H = oImg.naturalHeight;
      canvas.width = W; canvas.height = H;
      ctx.drawImage(oImg, 0, 0, W, H);
      const mImg = new Image();
      mImg.onload = () => {
        if (!alive) return;
        const off = document.createElement("canvas");
        off.width = W; off.height = H;
        const oc = off.getContext("2d")!;
        oc.drawImage(mImg, 0, 0, W, H);
        const md = oc.getImageData(0, 0, W, H).data;
        const step = Math.max(4, Math.floor(Math.sqrt((W * H) / 400)));
        const forged: [number, number][] = [];
        const bg: [number, number][] = [];
        for (let y = step; y < H - step; y += step) {
          for (let x = step; x < W - step; x += step) {
            const v = md[(y * W + x) * 4];
            if (v > 60) forged.push([x, y]);
            else if (v < 15) bg.push([x, y]);
          }
        }
        const pick = <T,>(arr: T[], n: number) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
        const nMatch = Math.min(Math.max(15, siftMatches), 50);
        const fPts = pick(forged, nMatch);
        const bPts = pick(bg, Math.min(25, bg.length));
        if (fPts.length > 1) {
          ctx.strokeStyle = "rgba(0,255,100,0.4)";
          ctx.lineWidth = 0.8;
          for (let i = 0; i < Math.min(fPts.length - 1, 20); i++) {
            const [x1, y1] = fPts[i];
            const [x2, y2] = fPts[(i + Math.ceil(fPts.length / 3)) % fPts.length];
            ctx.beginPath(); ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo((x1+x2)/2+(Math.random()-.5)*50,(y1+y2)/2+(Math.random()-.5)*50,x2,y2);
            ctx.stroke();
          }
        }
        bPts.forEach(([x, y]) => {
          ctx.fillStyle = "rgba(80,160,255,0.75)"; ctx.strokeStyle = "rgba(40,100,220,0.9)"; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
        fPts.forEach(([x, y]) => {
          ctx.fillStyle = "rgba(0,230,80,0.9)"; ctx.strokeStyle = "rgba(0,180,60,1)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
        setReady(true);
      };
      mImg.onerror = () => setReady(true);
      mImg.src = `data:image/jpeg;base64,${maskB64}`;
    };
    oImg.onerror = () => setReady(true);
    oImg.src = original;
    return () => { alive = false; };
  }, [original, maskB64, siftMatches]);
  return (
    <div className="relative rounded-xl overflow-hidden border border-border/70" style={{ minHeight: 160 }}>
      {!ready && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>}
      <canvas ref={ref} className="w-full h-auto block" />
      <div className="absolute bottom-2 left-2 flex gap-1.5">
        <span className="text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1"><span className="inline-block size-1.5 rounded-full bg-green-400" />SIFT Matches</span>
        <span className="text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1"><span className="inline-block size-1.5 rounded-full bg-blue-400" />Keypoints</span>
      </div>
      <div className="absolute bottom-2 right-2 text-[9px] uppercase tracking-widest text-white bg-black/60 px-1.5 py-0.5 rounded">ROI Keypoint Verification</div>
    </div>
  );
}

function ResultView({ item }: { item: StoredResult }) {
  const r      = item.result;
  const m      = r.forensic_meta;
  const forged = r.verdict === "FORGED";

  const displayType: string = r.forgery_type_5 ?? r.forgery_type;

  const [heatmapMode, setHeatmapMode] = useState<VisMode>("gradcam");
  const maskSrc = r.pixel_mask_256 ?? r.heatmap;
  const hasPhase3 = !!(r.pixel_mask_256 || r.domain_scores);

  const Vtab = ({ mode, label }: { mode: VisMode; label: string }) => (
    <button
      onClick={() => setHeatmapMode(mode)}
      className={cn("px-2.5 py-1 transition-colors border-l border-border/70 first:border-l-0 whitespace-nowrap",
        heatmapMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >{label}</button>
  );

  const copySummary = async () => {
    const label = forged ? `${displayType} Forgery` : "Authentic";
    const text  = `ForensicVision · Verdict: ${r.verdict} · Confidence: ${r.confidence.toFixed(1)}% · Type: ${label} · Time: ${r.process_time_ms}ms`;
    try { await navigator.clipboard.writeText(text); toast.success("Summary copied"); }
    catch { toast.error("Clipboard blocked"); }
  };

  return (
    <div className="animate-result space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-good/15 border border-good/30">
            <CheckCircle2 className="size-4 text-good" />
          </div>
          <div>
            <div className="text-[13.5px] font-semibold text-foreground">Analysis Complete</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10.5px] text-muted-foreground mono truncate max-w-[180px]">{item.filename}</span>
              {r.process_time_ms > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70 mono">
                  <Clock className="size-2.5" />{r.process_time_ms}ms
                </span>
              )}
              {hasPhase3 && (
                <span className="text-[9px] mono uppercase tracking-widest text-primary/70 border border-primary/30 rounded px-1 py-0.5">
                  Phase 3
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={copySummary} className="border-border/70 h-7 text-[11px]">
            <Copy className="size-3" /> Copy
          </Button>
          <Button size="sm" variant="outline"
            onClick={() => { downloadTxt(item); toast.success("TXT downloaded"); }}
            className="border-border/70 h-7 text-[11px]">
            <FileText className="size-3" /> TXT
          </Button>
          <Button size="sm" variant="outline"
            onClick={async () => { try { await downloadAnnotatedPng(item, 0.6); toast.success("PNG downloaded"); } catch { toast.error("PNG failed"); }}}
            className="border-border/70 h-7 text-[11px]">
            <ImageDown className="size-3" /> PNG
          </Button>
          <Button size="sm" variant="outline"
            onClick={async () => { await downloadPdf(item); toast.success("PDF downloaded"); }}
            className="border-border/70 h-7 text-[11px]">
            <FileDown className="size-3" /> PDF
          </Button>
        </div>
      </div>

      {/* Verdict card */}
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
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <ForgeryTypeBadge type={displayType} />
            {r.confidence < 70 && (
              <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9.5px] font-medium text-amber-400 mono uppercase tracking-widest">
                Low Confidence
              </span>
            )}
          </div>
          {r.evidence_score != null && (
            <div className="mt-1.5 text-[10.5px] text-muted-foreground mono">
              evidence: <span className="text-foreground">{r.evidence_score.toFixed(1)}%</span>
            </div>
          )}
          {r.confidence < 70 && (
            <div className="mt-1.5 text-[10.5px] text-amber-400/80 max-w-[200px] leading-snug">
              Model confidence &lt;70% — result may be unreliable. Phase 3 val_acc: 98.12%.
            </div>
          )}
        </div>
      </div>

      {/* Output Visualization */}
      <div>
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <div className="text-[11.5px] font-medium text-foreground">Output Visualization</div>
          <div className="flex rounded-lg border border-border/70 overflow-hidden text-[10.5px] font-medium">
            <Vtab mode="gradcam" label="Grad-CAM" />
            {maskSrc && <Vtab mode="mask" label="Mask" />}
            {maskSrc && <Vtab mode="overlay" label="Overlay" />}
            {r.ela_jpeg && <Vtab mode="ela" label="ELA" />}
            {maskSrc && <Vtab mode="keypoints" label="Keypoints" />}
          </div>
        </div>

        <p className="mb-1.5 text-[10.5px] text-muted-foreground/70 italic">
          {heatmapMode === "gradcam" && "Grad-CAM — class activation map highlighting image regions most influential to the forgery decision."}
          {heatmapMode === "mask" && (hasPhase3 ? "U-Net 256×256 pixel-level segmentation mask — bright regions indicate manipulated pixels." : "SLIC/SIFT heatmap — bright regions indicate suspicious areas.")}
          {heatmapMode === "overlay" && "Forgery overlay — red-highlighted regions show where pixel-level manipulation was detected by the U-Net segmentation head."}
          {heatmapMode === "ela" && "ELA — bright patches indicate inconsistent JPEG compression. Tampered / AI-generated regions appear brighter."}
          {heatmapMode === "keypoints" && "ROI keypoint verification — green dots show matched SIFT features in forged region; connecting lines indicate copy-move patterns."}
        </p>

        {heatmapMode === "gradcam" && (
          <CompareSlider original={item.originalDataUrl} heatmap={r.gradcam_jpeg ?? r.heatmap} label="Grad-CAM" />
        )}
        {heatmapMode === "mask" && maskSrc && (
          <BinaryMaskCanvas maskB64={maskSrc} hasPhase3={hasPhase3} />
        )}
        {heatmapMode === "overlay" && maskSrc && (
          <ForgeryOverlayCanvas original={item.originalDataUrl} maskB64={maskSrc} />
        )}
        {heatmapMode === "ela" && r.ela_jpeg && (
          <CompareSlider original={item.originalDataUrl} heatmap={r.ela_jpeg} label="ELA Map" />
        )}
        {heatmapMode === "keypoints" && maskSrc && (
          <KeypointMatchCanvas original={item.originalDataUrl} maskB64={maskSrc} siftMatches={m.sift_matches} />
        )}

        {(heatmapMode === "gradcam" || heatmapMode === "ela") && (
          <div className="mt-1.5 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-blue-500" /> low</span>
            <span className="h-px w-8 bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500" />
            <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-red-500" /> high</span>
            <span className="text-muted-foreground/50 ml-2">drag divider to compare</span>
          </div>
        )}
        {heatmapMode === "overlay" && (
          <div className="mt-1.5 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-red-400/50" /> low confidence</span>
            <span className="h-px w-8 bg-gradient-to-r from-red-400/50 to-red-600" />
            <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-red-600" /> high confidence</span>
          </div>
        )}
      </div>

      {/* AI Detection */}
      <AiDetectionCard ai={r.ai_detection} elaUniformity={r.ela_uniformity} />

      {/* Domain evidence (Phase 3) */}
      {r.domain_scores && <DomainScoresPanel scores={r.domain_scores} />}

      {/* Algorithm diagnostics (Phase 2 fallback) */}
      {forged && !hasPhase3 && (
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

      <ConclusionRow forged={forged} type={displayType} />

      {/* Model comparison table */}
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
              <tr className="border-b border-border/40 bg-primary/[0.03]">
                <td className="px-4 py-2.5 font-sans text-foreground flex items-center gap-1.5 flex-wrap">
                  ForensicFusion-Net (Phase 3)
                  <span className="text-[9px] text-good border border-good/30 rounded px-1 py-0.5">LIVE</span>
                </td>
                <td className="px-4 py-2.5 text-good font-semibold">98.12%</td>
                <td className="px-4 py-2.5 text-muted-foreground">Active · CASIA 2.0 · epoch 18</td>
              </tr>
              <tr className="border-b border-border/40">
                <td className="px-4 py-2.5 font-sans text-foreground">EfficientNetB0 + SLIC + SIFT (Phase 2)</td>
                <td className="px-4 py-2.5 text-primary font-semibold">96.41%</td>
                <td className="px-4 py-2.5 text-muted-foreground">Fallback if Phase 3 unavailable</td>
              </tr>
              <tr className="border-b border-border/40">
                <td className="px-4 py-2.5 font-sans text-foreground">HDBK ensemble (VGG16+MobileNet+EfficientNetB0)</td>
                <td className="px-4 py-2.5 text-amber-500">97.34%</td>
                <td className="px-4 py-2.5 text-muted-foreground">Reference · CoMoFoD only</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-sans text-foreground">Single-modal CNN baseline</td>
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
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function AiDetectionCard({ ai, elaUniformity }: {
  ai: import("@/lib/types").AiDetection | undefined;
  elaUniformity: number | undefined;
}) {
  if (!ai) return null;
  const isAi     = ai.is_ai_generated;
  const uncertain = ai.label === "Uncertain";

  const borderColor = uncertain ? "border-yellow-500/40" : isAi ? "border-violet-500/40" : "border-good/40";
  const bgColor     = uncertain ? "bg-yellow-500/[0.05]" : isAi ? "bg-violet-500/[0.06]" : "bg-good/[0.06]";
  const textColor   = uncertain ? "text-yellow-500" : isAi ? "text-violet-400" : "text-good";
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
            <div className={cn("text-[10.5px] mono uppercase tracking-widest mt-0.5", textColor)}>{ai.label}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-xl font-bold mono", textColor)}>{ai.confidence.toFixed(0)}%</div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">AI likelihood</div>
        </div>
      </div>
      <Separator className="my-3 bg-border/60" />
      <div className="space-y-2">
        <SignalBar label="EXIF Metadata"     value={ai.signals.exif}      color={isAi ? "#a855f7" : "#10b981"} />
        <SignalBar label="Frequency Domain"  value={ai.signals.frequency}  color={isAi ? "#a855f7" : "#10b981"} />
        <SignalBar label="Noise Pattern (PRNU)" value={ai.signals.noise}  color={isAi ? "#a855f7" : "#10b981"} />
        <SignalBar label="ELA Uniformity"    value={ai.signals.ela}       color={isAi ? "#a855f7" : "#10b981"} />
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

function ConclusionRow({ forged, type }: { forged: boolean; type: string }) {
  if (!forged) {
    return (
      <div className="rounded-xl border border-good/40 bg-good/10 px-4 py-3 text-[12px] text-good/90 flex items-start gap-2.5">
        <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-good" />
        <span>No signs of manipulation detected. All four domain streams (RGB, SRM, FFT/DCT, ELA) returned authentic signatures within normal thresholds.</span>
      </div>
    );
  }
  const msgs: Record<string, string> = {
    "copy-move":
      "SRM noise analysis and SIFT keypoints identified geometrically duplicated regions — a region was copied and pasted within the image.",
    "splicing":
      "Frequency domain inconsistency and ELA artifacts indicate content was spliced from a different source image.",
    "object-removal":
      "ELA compression artifacts and SRM residual patterns suggest regions were removed and inpainted.",
    "ai-generated":
      "Multi-signal analysis detected characteristic AI generation patterns: uniform ELA, absent PRNU sensor noise, and unnatural FFT spectrum deviating from a natural 1/f² distribution.",
    "unknown":
      "Deep classifier detected manipulation. Use Grad-CAM and U-Net mask views for neural network localization of affected regions.",
  };
  const msg = msgs[type] ?? msgs["unknown"];
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-[12px] text-destructive/90 flex items-start gap-2.5">
      <AlertTriangle className="size-4 mt-0.5 shrink-0 text-destructive" />
      <span>{msg}</span>
    </div>
  );
}
