import { TrendingUp, Award, Activity, Database } from "lucide-react";

export default function TrainingPanel({ data }) {
  if (!data) return (
    <div className="glass" style={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t2)" }}>
      Loading training data…
    </div>
  );
  if (!data.length) return (
    <div className="glass" style={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t2)" }}>
      No training_log.csv found in model/weights/
    </div>
  );

  const best = data.reduce((b, r) => r.val_acc > b.val_acc ? r : b, data[0]);
  const last = data[data.length - 1];
  const bestLoss = data.reduce((b, r) => r.val_loss < b.val_loss ? r : b, data[0]);

  return (
    <div className="train-page">
      {/* Stat cards */}
      <div className="stat-row-4">
        <StatCard icon={Database}   label="Total Epochs"      value={data.length}          sub="Trained on CASIA v1.0" />
        <StatCard icon={Award}      label="Best Val Accuracy" value={`${best.val_acc}%`}   sub={`Epoch ${best.epoch}`}    best />
        <StatCard icon={TrendingUp} label="Best Val Loss"     value={bestLoss.val_loss}    sub={`Epoch ${bestLoss.epoch}`} />
        <StatCard icon={Activity}   label="Final Train Acc"   value={`${last.train_acc}%`} sub={`Epoch ${last.epoch}`} />
      </div>

      {/* Accuracy chart */}
      <div className="chart-card">
        <div className="chart-title">Accuracy Curve</div>
        <div className="chart-sub">Training vs Validation accuracy over epochs · Best val: {best.val_acc}% at epoch {best.epoch}</div>
        <LineChart
          data={data}
          series={[
            { key: "train_acc", color: "#2e7cf6", label: "Train Accuracy" },
            { key: "val_acc",   color: "#00d4aa", label: "Val Accuracy" },
          ]}
          yMin={60} yMax={100} isPercent
        />
      </div>

      {/* Loss chart */}
      <div className="chart-card">
        <div className="chart-title">Loss Curve</div>
        <div className="chart-sub">Training vs Validation loss convergence over 40 epochs</div>
        <LineChart
          data={data}
          series={[
            { key: "train_loss", color: "#f59e0b", label: "Train Loss" },
            { key: "val_loss",   color: "#ef4444", label: "Val Loss" },
          ]}
          yMin={null} yMax={null} isPercent={false}
        />
      </div>

      {/* Epoch table */}
      <div className="chart-card">
        <div className="chart-title">Epoch Log</div>
        <div className="chart-sub">Full training history · ★ marks best validation accuracy</div>
        <div className="epoch-wrap">
          <table className="epoch-table">
            <thead>
              <tr>
                <th>Epoch</th>
                <th>Train Loss</th>
                <th>Train Acc</th>
                <th>Val Loss</th>
                <th>Val Acc</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.epoch} className={r.epoch === best.epoch ? "best-epoch" : ""}>
                  <td>{r.epoch}{r.epoch === best.epoch ? " ★" : ""}</td>
                  <td>{r.train_loss}</td>
                  <td>{r.train_acc}%</td>
                  <td>{r.val_loss}</td>
                  <td>{r.val_acc}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, best: isBest }) {
  return (
    <div className={`train-stat ${isBest ? "best" : ""}`}>
      <Icon size={16} color={isBest ? "var(--teal)" : "var(--t2)"} style={{ marginBottom: 10 }} />
      <div className="train-stat-val">{value}</div>
      <div className="train-stat-lbl">{label}</div>
      <div className="train-stat-sub">{sub}</div>
    </div>
  );
}

function LineChart({ data, series, yMin, yMax, isPercent }) {
  const W = 900, H = 280;
  const PAD = { top: 20, right: 140, bottom: 44, left: 60 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const allVals = series.flatMap(s => data.map(d => d[s.key]));
  const dMin = Math.min(...allVals);
  const dMax = Math.max(...allVals);
  const yLo = yMin !== null ? Math.min(yMin, dMin) : dMin * 0.97;
  const yHi = yMax !== null ? Math.max(yMax, dMax) : dMax * 1.02;
  const xRange = (data.length - 1) || 1;

  const xp = i => PAD.left + (i / xRange) * cW;
  const yp = v => PAD.top + cH - ((v - yLo) / (yHi - yLo)) * cH;
  const path = key => data.map((d, i) => `${i === 0 ? "M" : "L"}${xp(i).toFixed(1)},${yp(d[key]).toFixed(1)}`).join(" ");
  const areaPath = (key) => {
    const pts = data.map((d, i) => `${xp(i).toFixed(1)},${yp(d[key]).toFixed(1)}`).join(" L");
    return `M${pts} L${xp(data.length - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} L${xp(0).toFixed(1)},${(PAD.top + cH).toFixed(1)} Z`;
  };

  const yTicks = 5;
  const xTickEvery = Math.ceil(data.length / 8);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block", fontFamily: "'IBM Plex Mono', monospace" }}>
        <defs>
          {series.map(s => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid lines */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = yLo + (i / yTicks) * (yHi - yLo);
          const y = yp(v);
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y} stroke="#1e2d47" strokeWidth="1" />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="#3d5070" fontSize="10">
                {isPercent ? `${v.toFixed(0)}%` : v.toFixed(3)}
              </text>
            </g>
          );
        })}

        {/* X axis ticks */}
        {data.filter((_, i) => i % xTickEvery === 0 || i === data.length - 1).map(d => {
          const idx = data.indexOf(d);
          return (
            <text key={d.epoch} x={xp(idx)} y={PAD.top + cH + 16} textAnchor="middle" fill="#3d5070" fontSize="10">
              {d.epoch}
            </text>
          );
        })}

        {/* Axis label */}
        <text x={PAD.left + cW / 2} y={H - 4} textAnchor="middle" fill="#3d5070" fontSize="10">Epoch</text>

        {/* Area fill */}
        {series.map(s => (
          <path key={`area-${s.key}`} d={areaPath(s.key)} fill={`url(#grad-${s.key})`} />
        ))}

        {/* Lines */}
        {series.map(s => (
          <path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {/* Best dots */}
        {series.map(s => {
          const isBestAcc = s.key === "val_acc";
          const isBestLoss = s.key === "val_loss";
          if (!isBestAcc && !isBestLoss) return null;
          const bestRow = isBestAcc
            ? data.reduce((b, d) => d.val_acc > b.val_acc ? d : b, data[0])
            : data.reduce((b, d) => d.val_loss < b.val_loss ? d : b, data[0]);
          const idx = data.indexOf(bestRow);
          return (
            <g key={`best-${s.key}`}>
              <circle cx={xp(idx)} cy={yp(bestRow[s.key])} r="5" fill={s.color} />
              <circle cx={xp(idx)} cy={yp(bestRow[s.key])} r="9" fill="none" stroke={s.color} strokeWidth="1.5" strokeOpacity="0.4" />
            </g>
          );
        })}

        {/* Legend */}
        {series.map((s, i) => (
          <g key={`leg-${s.key}`} transform={`translate(${PAD.left + cW + 14},${PAD.top + i * 26})`}>
            <rect x="0" y="1" width="18" height="3" rx="1.5" fill={s.color} />
            <text x="24" y="10" fill="#6b7fa3" fontSize="11">{s.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
