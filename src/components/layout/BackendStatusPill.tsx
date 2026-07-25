import { useBackendHealth } from "@/hooks/useBackendHealth";
import { cn } from "@/lib/utils";

export function BackendStatusPill() {
  const { data, isError, isLoading } = useBackendHealth();
  const online = !!data?.model_loaded && !isError;
  const label = isLoading && !data ? "Checking…" : online ? "Model Ready" : "Backend Offline";
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium mono",
        online
          ? "border-good/40 bg-good/10 text-good"
          : "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      <span className="relative flex size-2">
        {online && (
          <span className="absolute inset-0 rounded-full bg-good/70 animate-pulse-dot" />
        )}
        <span
          className={cn(
            "relative size-2 rounded-full",
            online ? "bg-good" : "bg-destructive",
          )}
        />
      </span>
      {label}
    </div>
  );
}
