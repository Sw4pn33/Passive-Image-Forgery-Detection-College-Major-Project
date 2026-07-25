import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainingEpoch } from "@/lib/types";

export function EpochTable({
  data,
  bestValAccEpoch,
}: {
  data: TrainingEpoch[];
  bestValAccEpoch: number;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-border/60 flex items-center justify-between">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-primary font-semibold">
            Epoch Log
          </div>
          <h3 className="mt-1 text-lg font-semibold text-foreground">Full training history</h3>
        </div>
        <div className="text-[11px] text-muted-foreground mono">{data.length} epochs</div>
      </div>
      <div className="max-h-[520px] overflow-y-auto">
        <table className="w-full text-[12.5px]">
          <thead className="sticky top-0 bg-[#0d1526]/95 backdrop-blur">
            <tr className="text-left text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border/60">
              <th className="px-5 py-2.5 font-medium">Epoch</th>
              <th className="px-5 py-2.5 font-medium">Train Loss</th>
              <th className="px-5 py-2.5 font-medium">Train Acc</th>
              <th className="px-5 py-2.5 font-medium">Val Loss</th>
              <th className="px-5 py-2.5 font-medium">Val Acc</th>
            </tr>
          </thead>
          <tbody className="mono">
            {data.map((e) => {
              const best = e.epoch === bestValAccEpoch;
              return (
                <tr
                  key={e.epoch}
                  className={cn(
                    "border-b border-border/40 transition-colors hover:bg-primary/5",
                    best && "bg-good/[0.08]",
                  )}
                >
                  <td className="px-5 py-2 text-foreground font-semibold flex items-center gap-1.5">
                    {best && <Star className="size-3 fill-good text-good" />}
                    {e.epoch}
                  </td>
                  <td className="px-5 py-2 text-muted-foreground">{e.train_loss.toFixed(4)}</td>
                  <td className="px-5 py-2 text-foreground">{e.train_acc.toFixed(2)}%</td>
                  <td className="px-5 py-2 text-muted-foreground">{e.val_loss.toFixed(4)}</td>
                  <td className={cn("px-5 py-2 font-semibold", best ? "text-good" : "text-foreground")}>
                    {e.val_acc.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
