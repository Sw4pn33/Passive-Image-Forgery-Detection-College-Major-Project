import { Server, ServerOff, Loader } from "lucide-react";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { cn } from "@/lib/utils";

export function BackendStatusPill() {
  const { data, isError, isLoading } = useBackendHealth();
  const online = !!data?.model_loaded && !isError;
  const checking = isLoading && !data;
  const label = checking ? "Checking" : online ? "Model Ready" : "Offline";

  const Icon = checking ? Loader : online ? Server : ServerOff;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] font-medium tracking-wide mono",
        online
          ? "border-good/30 bg-good/8 text-good"
          : "border-border bg-surface text-muted-foreground",
      )}
    >
      <Icon className={cn("size-3", checking && "animate-spin")} />
      {label}
    </div>
  );
}
