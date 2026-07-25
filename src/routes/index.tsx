import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UploadPanel } from "@/components/detection/UploadPanel";
import { ResultsPanel } from "@/components/detection/ResultsPanel";
import { useAppState } from "@/lib/app-state";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Detection · ForensicVision" },
      {
        name: "description",
        content:
          "Upload an image to detect copy-move and splicing forgeries with EfficientNetB0 + SLIC + SIFT.",
      },
      { property: "og:title", content: "Detection · ForensicVision" },
      {
        property: "og:description",
        content: "Passive image forgery detection with visual heatmap localization.",
      },
    ],
  }),
  component: DetectionPage,
});

function DetectionPage() {
  const { currentResult, setHistoryOpen, triggerFilePicker, triggerAnalyze, triggerClear } =
    useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function isTypingTarget(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    }
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        triggerFilePicker();
      } else if (e.key === "Enter") {
        e.preventDefault();
        triggerAnalyze();
      } else if (e.key === "Escape") {
        e.preventDefault();
        triggerClear();
        setError(null);
        setHistoryOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [triggerFilePicker, triggerAnalyze, triggerClear, setHistoryOpen]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <UploadPanel onLoadingChange={setLoading} onError={setError} />
      <ResultsPanel
        loading={loading}
        error={error}
        result={currentResult}
        onRetry={() => triggerAnalyze()}
      />
    </div>
  );
}
