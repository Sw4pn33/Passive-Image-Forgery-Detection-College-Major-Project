import { useCallback, useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  X,
  ScanLine,
  ImageIcon,
  Layers,
  Fingerprint,
  Map,
  Cpu,
  WifiOff,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { detectImage } from "@/lib/api";
import { pushHistory } from "@/lib/history";
import type { StoredResult } from "@/lib/types";
import { useAppState } from "@/lib/app-state";
import { useBackendHealth } from "@/hooks/useBackendHealth";

const ALLOWED_EXT = ["jpg", "jpeg", "png", "tif", "tiff", "bmp", "webp"] as const;
const ACCEPT = "image/jpeg,image/png,image/tiff,image/bmp,image/webp";
const MAX_SIZE_MB = 15;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function validateFile(f: File): string | null {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(ext as (typeof ALLOWED_EXT)[number])) {
    return `Unsupported file type ".${ext || "?"}". Allowed: ${ALLOWED_EXT.join(", ")}.`;
  }
  if (f.size > MAX_SIZE_BYTES) {
    return `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max is ${MAX_SIZE_MB} MB.`;
  }
  if (f.size === 0) return "File is empty.";
  return null;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

interface Props {
  onLoadingChange: (loading: boolean) => void;
  onError: (message: string | null) => void;
}

export function UploadPanel({ onLoadingChange, onError }: Props) {
  const {
    requestFilePicker,
    requestAnalyze,
    requestClear,
    setCurrentResult,
  } = useAppState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const health = useBackendHealth();
  const backendOnline = !!health.data?.model_loaded && !health.isError;

  const mutation = useMutation({
    mutationFn: async (f: File) => {
      const result = await detectImage(f);
      return { result };
    },
    onMutate: () => {
      onLoadingChange(true);
      onError(null);
    },
    onSuccess: ({ result }, f) => {
      const originalDataUrl = `data:image/jpeg;base64,${result.original_jpeg}`;
      const stored: StoredResult = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        filename: f.name,
        originalDataUrl,
        result,
      };
      pushHistory(stored);
      setCurrentResult(stored);
      onLoadingChange(false);
      toast.success(
        result.verdict === "FORGED"
          ? `Forgery detected · ${result.confidence.toFixed(1)}%`
          : `Image authentic · ${result.confidence.toFixed(1)}%`,
      );
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Detection failed";
      onLoadingChange(false);
      onError(msg);
      toast.error(msg);
    },
  });

  const handleFile = useCallback(
    async (f: File | null | undefined) => {
      if (!f) return;
      const v = validateFile(f);
      if (v) {
        setValidationError(v);
        setFile(null);
        setPreview(null);
        onError(null);
        if (inputRef.current) inputRef.current.value = "";
        toast.error(v);
        return;
      }
      setValidationError(null);
      setFile(f);
      onError(null);
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      const browserRenderable = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
      if (browserRenderable.includes(ext)) {
        try {
          setPreview(await readAsDataUrl(f));
        } catch {
          setPreview(null);
        }
      } else {
        setPreview(null);
      }
    },
    [onError],
  );

  const clear = useCallback(() => {
    setFile(null);
    setPreview(null);
    setValidationError(null);
    onError(null);
    setCurrentResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onError, setCurrentResult]);

  const analyze = useCallback(() => {
    if (!file || mutation.isPending || !backendOnline) return;
    mutation.mutate(file);
  }, [file, mutation, backendOnline]);

  useEffect(() => {
    if (requestFilePicker > 0) inputRef.current?.click();
  }, [requestFilePicker]);
  useEffect(() => {
    if (requestAnalyze > 0) analyze();
  }, [requestAnalyze, analyze]);
  useEffect(() => {
    if (requestClear > 0) clear();
  }, [requestClear, clear]);

  const prevOnlineRef = useRef(backendOnline);
  useEffect(() => {
    if (!prevOnlineRef.current && backendOnline) {
      toast.success("Backend is back online");
    }
    prevOnlineRef.current = backendOnline;
  }, [backendOnline]);

  return (
    <section className="glass-card p-5 lg:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Upload Image</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            JPG · PNG · TIFF · BMP · WebP · max {MAX_SIZE_MB} MB
          </p>
        </div>
        <div className="grid size-9 place-items-center rounded-xl bg-surface-2/60 border border-border/70">
          <ImageIcon className="size-4 text-muted-foreground" />
        </div>
      </div>

      {!backendOnline && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/[0.07] px-3.5 py-3">
          <WifiOff className="size-4 mt-0.5 shrink-0 text-destructive" />
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-destructive">
              Backend unavailable
            </div>
            <div className="text-[11.5px] text-destructive/80 leading-snug mt-0.5">
              Analysis is disabled. Ensure the FastAPI service is running on{" "}
              <span className="mono">localhost:8000</span>.
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void health.refetch();
              toast.message("Checking backend…");
            }}
            disabled={health.isFetching}
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <RefreshCw className={cn("size-3.5", health.isFetching && "animate-spin")} />
            Retry
          </Button>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "mt-5 relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all",
          validationError
            ? "border-destructive/60 bg-destructive/[0.04]"
            : dragging
              ? "border-primary bg-primary/5 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]"
              : "border-border/70 bg-surface-2/30 hover:border-primary/60 hover:bg-primary/[0.03]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        {file && preview ? (
          <div className="w-full flex flex-col items-center gap-3">
            <img
              src={preview}
              alt="preview"
              className="max-h-40 rounded-lg border border-border/70 shadow-md object-contain"
            />
            <div className="text-[12px] text-foreground font-medium truncate max-w-full">
              {file.name}
            </div>
            <div className="text-[10.5px] text-muted-foreground mono">
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
        ) : file && !preview ? (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="grid size-14 place-items-center rounded-xl border border-border bg-surface/60">
              <ImageIcon className="size-6 text-muted-foreground/60" strokeWidth={1.5} />
            </div>
            <div className="text-[12px] text-foreground font-medium truncate max-w-[260px]">
              {file.name}
            </div>
            <div className="text-[10.5px] text-muted-foreground mono">
              {(file.size / 1024).toFixed(1)} KB · preview not available for this format
            </div>
          </div>
        ) : (
          <>
            <div className="grid size-12 place-items-center rounded-xl border border-primary/25 bg-primary/8">
              <UploadCloud className="size-5 text-primary" />
            </div>
            <div className="mt-3 text-[14px] font-medium text-foreground">
              Drag &amp; drop image here
            </div>
            <div className="mt-1 text-[11.5px] text-muted-foreground">
              or click to browse ·{" "}
              <kbd className="mono rounded border border-border/80 bg-surface-2/60 px-1.5 py-0.5 text-[10px]">
                U
              </kbd>
            </div>
          </>
        )}
      </div>

      {validationError && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/[0.07] px-3.5 py-2.5 text-[12px] text-destructive"
        >
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span className="leading-snug">{validationError}</span>
        </div>
      )}

      {file && (
        <div className="mt-4 flex items-center gap-2">
          <Button
            onClick={analyze}
            disabled={mutation.isPending || !backendOnline}
            title={!backendOnline ? "Backend offline" : undefined}
            className="flex-1 bg-primary text-primary-foreground border-0 hover:bg-primary/90 disabled:opacity-40"
          >
            <ScanLine className="size-4" />
            {mutation.isPending
              ? "Analyzing…"
              : !backendOnline
                ? "Backend Offline"
                : "Analyze Image"}
          </Button>
          <Button variant="ghost" onClick={clear} className="text-muted-foreground">
            <X className="size-4" />
            Clear
          </Button>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border/70 bg-surface/50 p-4">
        <div className="flex items-center gap-2 text-[12.5px] font-semibold text-foreground">
          <Layers className="size-4 text-primary" />
          Detection Pipeline
        </div>
        <ol className="mt-3 space-y-2.5">
          <PipelineStep
            n={1}
            icon={Cpu}
            title="DCNN Classification"
            desc="EfficientNetB0 classifies authentic vs forged"
          />
          <PipelineStep
            n={2}
            icon={Layers}
            title="SLIC Segmentation"
            desc="~100 superpixels, colour-illumination stats"
          />
          <PipelineStep
            n={3}
            icon={Fingerprint}
            title="SIFT Keypoint Matching"
            desc="500 keypoints, brute-force L2 duplicate search"
          />
          <PipelineStep
            n={4}
            icon={Map}
            title="Heatmap Output"
            desc="JET-coloured overlay on detected regions"
          />
        </ol>
      </div>
    </section>
  );
}

function PipelineStep({
  n,
  icon: Icon,
  title,
  desc,
}: {
  n: number;
  icon: typeof Layers;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="relative shrink-0">
        <div className="grid size-8 place-items-center rounded-lg border border-primary/25 bg-primary/8 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-background border border-border mono text-[9px] font-semibold text-foreground">
          {n}
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium text-foreground">{title}</div>
        <div className="text-[11px] text-muted-foreground leading-snug">{desc}</div>
      </div>
    </li>
  );
}
