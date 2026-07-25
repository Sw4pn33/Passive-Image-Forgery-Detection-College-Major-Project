import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/lib/app-state";
import { useHistory } from "@/hooks/useHistory";
import { clearHistory } from "@/lib/history";
import { Clock, Trash2, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function HistorySheet() {
  const { historyOpen, setHistoryOpen, setCurrentResult } = useAppState();
  const items = useHistory();

  return (
    <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
      <SheetContent className="bg-[#0d1526] border-l border-border/70 flex flex-col gap-0">
        <SheetHeader className="border-b border-border/60 pb-4">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Clock className="size-4 text-primary" />
            Prediction History
          </SheetTitle>
          <SheetDescription className="text-[12px]">
            Last {items.length} of 5 analyses (stored locally).
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-3 px-4 space-y-2.5">
          {items.length === 0 ? (
            <div className="text-center text-[12.5px] text-muted-foreground py-10">
              No analyses yet.
            </div>
          ) : (
            items.map((it) => {
              const forged = it.result.verdict === "FORGED";
              return (
                <button
                  key={it.id}
                  onClick={() => {
                    setCurrentResult(it);
                    setHistoryOpen(false);
                  }}
                  className="w-full text-left rounded-xl border border-border/70 bg-surface/60 p-3 hover:border-primary/50 hover:bg-primary/[0.03] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {forged ? (
                        <ShieldAlert className="size-4 text-destructive shrink-0" />
                      ) : (
                        <ShieldCheck className="size-4 text-good shrink-0" />
                      )}
                      <span className="text-[12.5px] font-medium text-foreground truncate">
                        {it.filename}
                      </span>
                    </div>
                    <Badge
                      className={cn(
                        "text-[10px] px-2 py-0 h-5 rounded-full font-semibold mono",
                        forged
                          ? "bg-destructive/15 text-destructive border border-destructive/30"
                          : "bg-good/15 text-good border border-good/30",
                      )}
                    >
                      {it.result.verdict}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground mono">
                    <span>
                      {it.result.confidence.toFixed(1)}% ·{" "}
                      {it.result.forgery_type === "none" ? "clean" : it.result.forgery_type}
                    </span>
                    <span>{new Date(it.timestamp).toLocaleTimeString()}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border/60 p-4">
            <Button
              variant="outline"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => clearHistory()}
            >
              <Trash2 className="size-4" />
              Clear history
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
