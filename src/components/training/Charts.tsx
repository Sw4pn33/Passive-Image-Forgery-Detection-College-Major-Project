import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  ComposedChart,
  ReferenceDot,
  Legend,
} from "recharts";
import type { TrainingEpoch } from "@/lib/types";

interface Props {
  data: TrainingEpoch[];
  bestEpoch: number;
}

export function AccuracyChart({ data, bestEpoch }: Props) {
  const bestRow = data.find((d) => d.epoch === bestEpoch);
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-primary font-semibold">
            Accuracy
          </div>
          <h3 className="mt-1 text-lg font-semibold text-foreground">Accuracy Curve</h3>
        </div>
        <div className="text-[11px] text-muted-foreground mono">
          Best val_acc {bestRow?.val_acc.toFixed(2)}% @ epoch {bestEpoch}
        </div>
      </div>
      <div className="mt-4 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: 4, right: 16, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="trainAccFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2e7cf6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2e7cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="valAccFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#00d4aa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e2d47" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="epoch"
              stroke="#5a6b8a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#1e2d47" }}
            />
            <YAxis
              stroke="#5a6b8a"
              fontSize={11}
              domain={[60, 100]}
              tickLine={false}
              axisLine={{ stroke: "#1e2d47" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<AccTooltip />} />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 11, color: "#a0a9bd" }}
            />
            <Area
              type="monotone"
              dataKey="train_acc"
              name="Train Accuracy"
              stroke="#2e7cf6"
              strokeWidth={2}
              fill="url(#trainAccFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="val_acc"
              name="Val Accuracy"
              stroke="#00d4aa"
              strokeWidth={2.25}
              fill="url(#valAccFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            {bestRow && (
              <ReferenceDot
                x={bestRow.epoch}
                y={bestRow.val_acc}
                r={5}
                fill="#00d4aa"
                stroke="#0d1526"
                strokeWidth={2}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function LossChart({ data, bestEpoch }: Props) {
  const bestRow = data.find((d) => d.epoch === bestEpoch);
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-primary font-semibold">
            Loss
          </div>
          <h3 className="mt-1 text-lg font-semibold text-foreground">Loss Curve</h3>
        </div>
        <div className="text-[11px] text-muted-foreground mono">
          Best val_loss {bestRow?.val_loss.toFixed(4)} @ epoch {bestEpoch}
        </div>
      </div>
      <div className="mt-4 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: 4, right: 16, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="trainLossFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="valLossFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e2d47" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="epoch"
              stroke="#5a6b8a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#1e2d47" }}
            />
            <YAxis
              stroke="#5a6b8a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#1e2d47" }}
            />
            <Tooltip content={<LossTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "#a0a9bd" }} />
            <Area
              type="monotone"
              dataKey="train_loss"
              name="Train Loss"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#trainLossFill)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="val_loss"
              name="Val Loss"
              stroke="#ef4444"
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {bestRow && (
              <ReferenceDot
                x={bestRow.epoch}
                y={bestRow.val_loss}
                r={5}
                fill="#ef4444"
                stroke="#0d1526"
                strokeWidth={2}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface TT {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}

function AccTooltip({ active, payload, label }: TT) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/80 bg-[#0d1526]/95 backdrop-blur px-3 py-2 shadow-xl">
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
        Epoch <span className="mono text-foreground">{label}</span>
      </div>
      {payload.map((p) => (
        <div key={p.name} className="mt-1 flex items-center gap-2 text-[12px]">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="mono font-semibold text-foreground ml-auto">
            {p.value.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function LossTooltip({ active, payload, label }: TT) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/80 bg-[#0d1526]/95 backdrop-blur px-3 py-2 shadow-xl">
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
        Epoch <span className="mono text-foreground">{label}</span>
      </div>
      {payload.map((p) => (
        <div key={p.name} className="mt-1 flex items-center gap-2 text-[12px]">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="mono font-semibold text-foreground ml-auto">
            {p.value.toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  );
}
