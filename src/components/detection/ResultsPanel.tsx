import { ShieldCheck, AlertTriangle, Loader2, Copy, FileText, FileDown, CheckCircle2, XCircle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { MetricCell } from "@/components/common/MetricCell";
import { ScoreBar } from "@/components/common/ScoreBar";
import { downloadPdf, downloadTxt } from "@/lib/reports";
import type { StoredResult } from "@/lib/types";
import { useEffect, useState } from "react";
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
      <div className="grid size-20 place-items-center rounded-3xl gradient-brand shadow-xl shadow-primary/25">
        <ShieldCheck className="size-10 text-white" />
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
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
        DCNN classification · SLIC segmentation · SIFT matching
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
      <Button onClick={onRetry} className="mt-5 gradient-brand text-white border-0">
        Retry
      </Button>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Ensure the FastAPI backend is running on{" "}
        <span className="mono">localhost:8000</span>.
      </p>
    </div>
  );
}

function ResultView({ item }: { item: StoredResult }) {
  const r = item.result;
  const m = r.forensic_meta;
  const forged = r.verdict === "FORGED";

  const [barW, setBarW] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setBarW(r.confidence));
    return () => cancelAnimationFrame(t);
  }, [r.confidence]);

  const copySummary = async () => {
    const type = r.forgery_type
      .replace("-", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const label = forged ? `${type} Forgery` : "Authentic";
    const text = `ForensicVision · Verdict: ${r.verdict} · Confidence: ${r.confidence.toFixed(1)}% · Type: ${label}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Summary copied to clipboard");
    } catch {
      toast.error("Clipboard blocked");
    }
  };

  return (
    <div className="animate-result space-y-5">
      {/* header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-good/15 border border-good/30">
            <CheckCircle2 className="size-4 text-good" />
          </div>
          <div>
            <div className="text-[14.5px] font-semibold text-foreground">Analysis Complete</div>
            <div className="text-[11px] text-muted-foreground mono truncate max-w-[240px]">
              {item.filename}
            </div>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={copySummary} className="border-border/70">
            <Copy className="size-3.5" />
            Copy
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              downloadTxt(item);
              toast.success("Report downloaded (TXT)");
            }}
            className="border-border/70"
          >
            <FileText className="size-3.5" />
            TXT
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await downloadPdf(item);
              toast.success("Report downloaded (PDF)");
            }}
            className="border-border/70"
          >
            <FileDown className="size-3.5" />
            PDF
          </Button>
        </div>
      </div>

      {/* verdict */}
      <div
        className={cn(
          "rounded-2xl border p-5 relative overflow-hidden",
          forged
            ? "border-destructive/40 bg-destructive/[0.07]"
            : "border-good/40 bg-good/[0.07]",
        )}
      >
        <div className="absolute -right-6 -top-6 opacity-[0.07]">
          {forged ? (
            <XCircle className="size-32" />
          ) : (
            <CheckCircle2 className="size-32" />
          )}
        </div>
        <div className="flex items-center gap-3">
          {forged ? (
            <AlertTriangle className="size-6 text-destructive" />
          ) : (
            <CheckCircle2 className="size-6 text-good" />
          )}
          <div>
            <div
              className={cn(
                "text-2xl font-bold tracking-tight",
                forged ? "text-destructive" : "text-good",
              )}
            >
              {r.verdict}
            </div>
            <div className="text-[12px] text-muted-foreground uppercase tracking-[0.14em] mono">
              {r.forgery_type === "none" ? "No manipulation" : `${r.forgery_type} forgery`}
            </div>
          </div>
        </div>
      </div>

      {/* confidence */}
      <div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted-foreground">Confidence</span>
          <span className="mono font-semibold text-foreground text-sm">
            {r.confidence.toFixed(2)}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-surface-2/80 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-[1100ms] ease-out",
              forged ? "bg-destructive" : "gradient-brand",
            )}
            style={{ width: `${barW}%` }}
          />
        </div>
      </div>

      {/* image comparison */}
      <div className="grid grid-cols-2 gap-3">
        <figure className="rounded-xl border border-border/70 bg-surface/40 overflow-hidden">
          <div className="aspect-video bg-black/40 grid place-items-center">
            <img
              src={item.originalDataUrl}
              alt="original"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <figcaption className="px-3 py-2 text-[11px] text-muted-foreground uppercase tracking-wider">
            Original
          </figcaption>
        </figure>
        <figure className="rounded-xl border border-border/70 bg-surface/40 overflow-hidden">
          <div className="aspect-video bg-black/40 grid place-items-center">
            <img
              src={`data:image/jpeg;base64,${r.heatmap}`}
              alt="heatmap"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <figcaption className="px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Forgery Heatmap
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="size-2 rounded-sm bg-blue-500" /> low
              <span className="mx-0.5 h-1 w-6 rounded-full bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500" />
              <span className="size-2 rounded-sm bg-red-500" /> high
            </span>
          </figcaption>
        </figure>
      </div>

      {/* diagnostics */}
      {forged && (
        <div className="rounded-2xl border border-border/70 bg-surface/50 p-4">
          <div className="flex items-center gap-2 text-[12.5px] font-semibold text-foreground">
            <Layers className="size-4 text-primary" />
            Algorithm Diagnostics
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <MetricCell
              label="SIFT Keypoints"
              value={m.sift_keypoints}
              hint="Total scale-invariant keypoints detected across the image (max 500)."
            />
            <MetricCell
              label="SIFT Matches"
              value={m.sift_matches}
              danger={m.sift_matches > 0}
              hint="Pairs of keypoints with near-identical descriptors — evidence of duplicated regions (copy-move)."
            />
            <MetricCell
              label="SLIC Segments"
              value={m.slic_segments}
              hint="Number of perceptually uniform superpixels produced by SLIC."
            />
            <MetricCell
              label="Outlier Regions"
              value={m.outlier_segments}
              danger={m.outlier_segments > 0}
              hint="Superpixels whose Lab* colour statistics deviate above z-score 2.5 — evidence of illumination inconsistency (splicing)."
            />
          </div>
          <Separator className="my-4 bg-border/60" />
          <div className="space-y-3">
            <ScoreBar
              label="Copy-Move Score"
              value={m.copy_move_score}
              color="#f59e0b"
              hint="Density of matched SIFT keypoints suggesting region duplication."
            />
            <ScoreBar
              label="Splicing Score"
              value={m.splicing_score}
              color="#a855f7"
              hint="Illumination inconsistency across superpixels."
            />
          </div>
        </div>
      )}

      {/* conclusion */}
      <ConclusionRow forged={forged} type={r.forgery_type} />

      {/* comparison table */}
      <div className="rounded-2xl border border-border/70 bg-surface/50 overflow-hidden">
        <div className="px-4 pt-3 pb-2 text-[12.5px] font-semibold text-foreground">
          Model Comparison
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border/60">
              <th className="px-4 py-2 font-medium">Model</th>
              <th className="px-4 py-2 font-medium">Val Accuracy</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="mono">
            <tr className="border-b border-border/40">
              <td className="px-4 py-2.5 font-sans text-foreground">
                Our EfficientNetB0 + SLIC + SIFT
              </td>
              <td className="px-4 py-2.5 text-good font-semibold">92.64%</td>
              <td className="px-4 py-2.5 text-muted-foreground">Best (epoch 32)</td>
            </tr>
            <tr className="border-b border-border/40">
              <td className="px-4 py-2.5 font-sans text-foreground">AlexNet baseline (Li et al.)</td>
              <td className="px-4 py-2.5 text-destructive">~78%</td>
              <td className="px-4 py-2.5 text-muted-foreground">Baseline</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-sans text-foreground">
                Single-modal CNN (no localization)
              </td>
              <td className="px-4 py-2.5 text-destructive">~83%</td>
              <td className="px-4 py-2.5 text-muted-foreground">No localization</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConclusionRow({
  forged,
  type,
}: {
  forged: boolean;
  type: "copy-move" | "splicing" | "unknown" | "none";
}) {
  if (!forged) {
    return (
      <div className="rounded-xl border border-good/40 bg-good/10 px-4 py-3 text-[12.5px] text-good/90 flex items-start gap-2.5">
        <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-good" />
        <span>
          No signs of manipulation. Neither SLIC illumination outliers nor SIFT duplication
          clusters exceeded detection thresholds.
        </span>
      </div>
    );
  }
  const msg =
    type === "copy-move"
      ? "SIFT identified geometrically duplicated keypoint clusters, indicating a region was copied and pasted within the image."
      : type === "splicing"
        ? "SLIC superpixels revealed inconsistent illumination and colour statistics, indicating content spliced from a different source."
        : "Deep classifier detected manipulation, but SLIC/SIFT signals were mixed. Manual review is recommended.";
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-[12.5px] text-destructive/90 flex items-start gap-2.5">
      <AlertTriangle className="size-4 mt-0.5 shrink-0 text-destructive" />
      <span>{msg}</span>
    </div>
  );
}
