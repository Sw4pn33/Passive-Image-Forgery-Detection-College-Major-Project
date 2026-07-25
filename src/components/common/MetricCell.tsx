import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function MetricCell({
  label,
  value,
  hint,
  danger,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  danger?: boolean;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="rounded-xl border border-border/70 bg-surface/60 p-3 text-left cursor-help">
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground font-medium">
              {label}
            </div>
            <div
              className={cn(
                "mt-1.5 mono text-xl font-semibold tabular-nums",
                danger ? "text-destructive" : "text-foreground",
              )}
            >
              {value}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-xs">
          {hint}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
