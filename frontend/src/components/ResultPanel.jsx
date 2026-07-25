import { CheckCircle2, AlertTriangle, Copy, FileDown, TrendingUp, Activity, Layers } from "lucide-react";

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

function downloadTxt(result) {
  const ts = new Date();
  const stamp = ts.toISOString().replace(/[:.]/g, "-");
  const body = `FORENSICVISION — IMAGE FORGERY DETECTION REPORT
================================================
Generated: ${ts.toLocaleString()}

VERDICT
  Result:        ${result.verdict}
  Confidence:    ${result.confidence}%
  Forgery Type:  ${result.forgery_type}
  Regions Found: ${result.regions_found}

ALGORITHM DIAGNOSTICS
  SIFT Keypoints:    ${result.forensic_meta?.sift_keypoints ?? "N/A"}
  SIFT Matches:      ${result.forensic_meta?.sift_matches ?? "N/A"}
  SLIC Segments:     ${result.forensic_meta?.slic_segments ?? "N/A"}
  Outlier Segments:  ${result.forensic_meta?.outlier_segments ?? "N/A"}
  Copy-Move Score:   ${((result.forensic_meta?.copy_move_score ?? 0) * 100).toFixed(1)}%
  Splicing Score:    ${((result.forensic_meta?.splicing_score ?? 0) * 100).toFixed(1)}%

MODEL
  Architecture:  EfficientNetB0 + SLIC + SIFT
  Dataset:       CASIA v1.0 (~1,700 images)
  Best Val Acc:  92.64% (Epoch 32 of 40)

NOTE
  Research prototype. Not for forensic or legal use without expert validation.
`;
  const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `forensicvision-report-${stamp}.txt` });
  a.click(); URL.revokeObjectURL(url);
}

/* ── Loading ── */
function Loading() {
  return (
    <div className="glass" style={{ minHeight: 420, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, textAlign: "center" }}>
      <div className="scan-box"><div className="scan-line" /></div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>Analyzing image…</div>
      <div style={{ fontSize: 11, color: "var(--t2)" }}>DCNN classification · SLIC segmentation · SIFT matching</div>
    </div>
  );
}

/* ── Error ── */
function Err({ error }) {
  return (
    <div className="glass" style={{ minHeight: 420, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center" }}>
      <AlertTriangle size={40} color="var(--danger)" />
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--danger)" }}>Analysis failed</div>
      <div style={{ fontSize: 12, color: "var(--t2)", maxWidth: 280 }}>{error}</div>
    </div>
  );
}

/* ── Empty ── */
function Empty() {
  return (
    <div className="empty-glass">
      <div className="empty-icon-wrap">
        <Activity size={24} color="#fff" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>Awaiting Analysis</div>
      <div style={{ fontSize: 12, color: "var(--t2)", maxWidth: 260 }}>
        Upload an image and click Analyze. The DCNN verdict, confidence score, heatmap,
        and forensic diagnostics will appear here.
      </div>
    </div>
  );
}

/* ── Score bar ── */
function ScoreBar({ label, value, color }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div className="score-bar-row">
      <div className="score-bar-header">
        <span className="score-bar-label">{label}</span>
        <span className="score-bar-pct" style={{ color }}>{pct}%</span>
      </div>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── Main result ── */
export default function ResultPanel({ result, loading, preview, error }) {
  if (loading) return <Loading />;
  if (error)   return <Err error={error} />;
  if (!result) return <Empty />;

  const isForged = result.verdict === "FORGED";
  const meta     = result.forensic_meta || {};

  const typeLabel = {
    "copy-move": "Copy-Move Forgery",
    "splicing":  "Image Splicing",
    "unknown":   "Unknown Manipulation",
    "none":      "No Manipulation",
  }[result.forgery_type] ?? result.forgery_type;

  const summaryText = `ForensicVision · Verdict: ${result.verdict} · Confidence: ${result.confidence}% · Type: ${typeLabel}`;

  return (
    <div className="result-glass">
      {/* Header */}
      <div className="result-header">
        <div className="result-title-row">
          <CheckCircle2 size={16} color={isForged ? "var(--danger)" : "var(--ok)"} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Analysis Complete</span>
        </div>
        <div className="result-actions">
          <button
            className="btn-icon"
            onClick={() => copyToClipboard(summaryText)}
            title="Copy result summary"
          >
            <Copy size={12} /> Copy
          </button>
          <button
            className="btn-icon"
            onClick={() => downloadTxt(result)}
            title="Download text report"
          >
            <FileDown size={12} /> Report
          </button>
        </div>
      </div>

      {/* Verdict */}
      <div className={`verdict-block ${isForged ? "verdict-forged" : "verdict-authentic"}`}>
        <div className="verdict-icon-box">
          {isForged
            ? <AlertTriangle size={22} />
            : <CheckCircle2 size={22} />
          }
        </div>
        <div>
          <div className="verdict-text">{result.verdict}</div>
          <div className="verdict-sub">{isForged ? typeLabel : "No manipulation detected"}</div>
        </div>
      </div>

      {/* Confidence */}
      <div className="conf-row">
        <span className="conf-label">Confidence</span>
        <div className="conf-track">
          <div
            className="conf-fill"
            style={{
              width: `${result.confidence}%`,
              background: isForged ? "var(--danger)" : "var(--ok)",
            }}
          />
        </div>
        <span className="conf-val">{result.confidence}%</span>
      </div>

      {/* Image comparison */}
      {preview && (
        <div className="img-grid">
          <figure className="img-figure">
            <figcaption className="img-caption">Original</figcaption>
            <img src={preview} alt="uploaded original" className="result-img" />
          </figure>
          <figure className="img-figure">
            <figcaption className="img-caption">{isForged ? "Forgery Heatmap" : "Analysis Map"}</figcaption>
            <img src={`data:image/jpeg;base64,${result.heatmap}`} alt="heatmap overlay" className="result-img" />
          </figure>
        </div>
      )}

      {/* Forensic diagnostics (only when forged) */}
      {isForged && Object.keys(meta).length > 0 && (
        <div className="meta-box">
          <div className="meta-box-header">
            <Layers size={14} color="var(--teal)" />
            Algorithm Diagnostics
          </div>
          <div className="meta-box-body">
            <div className="meta-cells">
              <div className="meta-cell">
                <div className="meta-cell-icon"><Activity size={13} /></div>
                <div>
                  <div className="meta-num">{meta.sift_keypoints ?? "—"}</div>
                  <div className="meta-lbl">SIFT Keypoints</div>
                </div>
              </div>
              <div className={`meta-cell ${meta.sift_matches > 0 ? "alert" : ""}`}>
                <div className="meta-cell-icon"><Activity size={13} /></div>
                <div>
                  <div className="meta-num">{meta.sift_matches ?? "—"}</div>
                  <div className="meta-lbl">SIFT Matches</div>
                </div>
              </div>
              <div className="meta-cell">
                <div className="meta-cell-icon"><Layers size={13} /></div>
                <div>
                  <div className="meta-num">{meta.slic_segments ?? "—"}</div>
                  <div className="meta-lbl">SLIC Segments</div>
                </div>
              </div>
              <div className={`meta-cell ${meta.outlier_segments > 0 ? "alert" : ""}`}>
                <div className="meta-cell-icon"><AlertTriangle size={13} /></div>
                <div>
                  <div className="meta-num">{meta.outlier_segments ?? "—"}</div>
                  <div className="meta-lbl">Outlier Regions</div>
                </div>
              </div>
            </div>
            <div className="score-bars">
              <ScoreBar label="Copy-Move Score" value={meta.copy_move_score} color="var(--warn)" />
              <ScoreBar label="Splicing Score"  value={meta.splicing_score}  color="var(--purple)" />
            </div>
          </div>
        </div>
      )}

      {/* Alert */}
      {isForged && result.regions_found > 0 && (
        <div className="alert-row">
          <AlertTriangle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Manipulated region detected via{" "}
            {result.forgery_type === "copy-move"
              ? "SIFT keypoint duplication — a region was copied and pasted within the same image"
              : "SLIC colour-illumination inconsistency — foreign content inserted from another source"}.
            Red/yellow zones in the heatmap indicate high tampering probability.
          </span>
        </div>
      )}

      {!isForged && (
        <div className="authentic-row">
          <CheckCircle2 size={14} color="var(--ok)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            No evidence of copy-move or splicing detected by SIFT keypoint analysis
            and SLIC colour-consistency scoring.
          </span>
        </div>
      )}

      {/* Model comparison */}
      <div className="compare-box">
        <div className="compare-header">
          <TrendingUp size={14} color="var(--teal)" /> Model Performance
        </div>
        <table className="compare-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Val Accuracy</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Our EfficientNetB0 + SLIC + SIFT</td>
              <td className="ok">92.64%</td>
              <td className="ok">Best (epoch 32)</td>
            </tr>
            <tr>
              <td>AlexNet baseline (Li et al.)</td>
              <td className="bad">~78%</td>
              <td style={{ color: "var(--t2)" }}>Baseline</td>
            </tr>
            <tr>
              <td>Single-modal CNN (no SLIC/SIFT)</td>
              <td className="bad">~83%</td>
              <td style={{ color: "var(--t2)" }}>No localization</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
