import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getTrainingHistory } from "@/lib/api";
import { AccuracyChart, LossChart } from "@/components/training/Charts";
import { EpochTable } from "@/components/training/EpochTable";
import { Loader2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/training")({
  head: () => ({
    meta: [
      { title: "Training Metrics · ForensicVision" },
      {
        name: "description",
        content:
          "Accuracy and loss curves across 40 training epochs on CASIA v1.0. Best val_acc 92.64% at epoch 32.",
      },
      { property: "og:title", content: "Training Metrics · ForensicVision" },
      {
        property: "og:description",
        content: "40-epoch training curves and per-epoch log for the ForensicVision model.",
      },
    ],
  }),
  component: TrainingPage,
});

function TrainingPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["training-history"],
    queryFn: getTrainingHistory,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="glass-card p-16 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <div className="text-sm">Loading training history…</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="glass-card p-10 flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="size-8 text-destructive" />
        <div className="text-sm text-foreground">Could not load training history</div>
        <div className="text-xs text-muted-foreground max-w-md">
          {error instanceof Error ? error.message : "Backend unreachable"}
        </div>
        <button
          onClick={() => refetch()}
          className="mt-2 rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  const epochs = data.epochs;
  const totalEpochs = epochs.length;
  const bestValAcc = epochs.reduce((a, b) => (b.val_acc > a.val_acc ? b : a));
  const bestValLoss = epochs.reduce((a, b) => (b.val_loss < a.val_loss ? b : a));
  const finalTrainAcc = epochs[epochs.length - 1]?.train_acc ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Epochs" value={String(totalEpochs)} sub="Full training run" />
        <StatCard
          label="Best Val Accuracy"
          value={`${bestValAcc.val_acc.toFixed(2)}%`}
          sub={`Epoch ${bestValAcc.epoch}`}
          accent="text-teal"
          highlight
        />
        <StatCard
          label="Best Val Loss"
          value={bestValLoss.val_loss.toFixed(4)}
          sub={`Epoch ${bestValLoss.epoch}`}
        />
        <StatCard
          label="Final Train Accuracy"
          value={`${finalTrainAcc.toFixed(2)}%`}
          sub={`Epoch ${totalEpochs}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AccuracyChart data={epochs} bestEpoch={bestValAcc.epoch} />
        <LossChart data={epochs} bestEpoch={bestValLoss.epoch} />
      </div>

      <EpochTable data={epochs} bestValAccEpoch={bestValAcc.epoch} />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "glass-card p-4 lg:p-5 border-teal/40 shadow-[0_0_0_1px_rgba(0,212,170,0.15)]"
          : "glass-card p-4 lg:p-5"
      }
    >
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
        {label}
      </div>
      <div
        className={`mt-2 text-2xl lg:text-[26px] font-semibold tracking-tight mono ${accent ?? "text-foreground"}`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11.5px] text-muted-foreground">{sub}</div>
    </div>
  );
}
