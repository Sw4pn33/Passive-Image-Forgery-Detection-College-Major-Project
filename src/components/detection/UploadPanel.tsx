import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, X, Sparkles, ImageIcon, Layers, Fingerprint, Flame, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { detectImage } from "@/lib/api";
import { pushHistory } from "@/lib/history";
import type { StoredResult } from "@/lib/types";
import { useAppState } from "@/lib/app-state";

const ACCEPT = "image/jpeg,image/png,image/tiff,image/bmp,image/webp";

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

  const mutation = useMutation({
    mutationFn: async (f: File) => {
      const [result, originalDataUrl] = await Promise.all([detectImage(f), readAsDataUrl(f)]);
      return { result, originalDataUrl };
    },
    onMutate: () => {
      onLoadingChange(true);
      onError(null);
    },
    onSuccess: ({ result, originalDataUrl }, f) => {
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
      setFile(f);
      onError(null);
      try {
        setPreview(await readAsDataUrl(f));
      } catch {
        setPreview(null);
      }
    },
    [onError],
  );

  const clear = useCallback(() => {
    setFile(null);
    setPreview(null);
    onError(null);
    setCurrentResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onError, setCurrentResult]);

  const analyze = useCallback(() => {
    if (!file || mutation.isPending) return;
    mutation.mutate(file);
  }, [file, mutation]);

  // shortcut hooks
  useEffect(() => {
    if (requestFilePicker > 0) inputRef.current?.click();
  }, [requestFilePicker]);
  useEffect(() => {
    if (requestAnalyze > 0) analyze();
  }, [requestAnalyze, analyze]);
  useEffect(() => {
    if (requestClear > 0) clear();
  }, [requestClear, clear]);

  return (
    <section className="glass-card p-5 lg:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Upload Image</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">JPG · PNG · TIFF · BMP · WebP</p>
        </div>
        <div className="grid size-9 place-items-center rounded-xl bg-surface-2/60 border border-border/70">
          <ImageIcon className="size-4 text-muted-foreground" />
        </div>
      </div>

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
          dragging
            ? "border-primary bg-primary/5 shadow-[0_0_0_4px_rgba(46,124,246,0.1)]"
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
        {preview ? (
          <div className="w-full flex flex-col items-center gap-3">
            <img
              src={preview}
              alt="preview"
              className="max-h-40 rounded-lg border border-border/70 shadow-md object-contain"
            />
            <div className="text-[12px] text-foreground font-medium truncate max-w-full">
              {file?.name}
            </div>
            <div className="text-[10.5px] text-muted-foreground mono">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : ""}
            </div>
          </div>
        ) : (
          <>
            <div className="grid size-12 place-items-center rounded-2xl gradient-brand shadow-lg shadow-primary/25">
              <UploadCloud className="size-6 text-white" />
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

      {file && (
        <div className="mt-4 flex items-center gap-2">
          <Button
            onClick={analyze}
            disabled={mutation.isPending}
            className="flex-1 gradient-brand text-white border-0 shadow-md shadow-primary/25 hover:opacity-95"
          >
            <Sparkles className="size-4" />
            {mutation.isPending ? "Analyzing…" : "Analyze Image"}
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
            icon={Brain}
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
            icon={Flame}
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
        <div className="grid size-8 place-items-center rounded-lg gradient-brand text-white shadow shadow-primary/20">
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
