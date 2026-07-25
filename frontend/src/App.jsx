import { useState, useEffect, useCallback, useRef } from "react";
import { Shield, Keyboard, Activity, History, Clock } from "lucide-react";
import UploadPanel from "./components/UploadPanel";
import ResultPanel from "./components/ResultPanel";
import TrainingPanel from "./components/TrainingPanel";
import MethodologyPanel from "./components/MethodologyPanel";

/* ── Backend status pill ── */
function BackendStatus() {
  const [s, setS] = useState("checking");
  useEffect(() => {
    let dead = false;
    const check = async () => {
      try {
        const r = await fetch("/health", { signal: AbortSignal.timeout(3000) });
        if (!dead) setS(r.ok ? "online" : "offline");
      } catch { if (!dead) setS("offline"); }
    };
    check();
    const t = setInterval(check, 30000);
    return () => { dead = true; clearInterval(t); };
  }, []);
  if (s === "checking") return null;
  return (
    <span className={`status-pill ${s === "online" ? "status-online" : "status-offline"}`}>
      <span className="status-dot" />
      {s === "online" ? "Model Ready" : "Backend Offline"}
    </span>
  );
}

/* ── Hero stats ── */
const STATS = [
  { val: "~1,700",      cls: "",       lbl: "Training Images",      sub: "CASIA v1.0 dataset" },
  { val: "92.64%",      cls: "teal",   lbl: "Best Val Accuracy",    sub: "Epoch 32 of 40 trained" },
  { val: "EfficientNetB0", cls: "",    lbl: "Backbone Architecture", sub: "ImageNet pretrained" },
  { val: "SLIC + SIFT", cls: "ok",     lbl: "Localisation Pipeline", sub: "Hybrid ML approach" },
];

/* ── Main app ── */
export default function App() {
  const [tab, setTab] = useState("detect");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [training, setTraining] = useState(null);
  const uploadRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    fetch("/api/training-history").then(r => r.json()).then(d => setTraining(d.epochs || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleDetect = useCallback(async (f) => {
    setLoading(true); setError(null); setResult(null);
    const fd = new FormData(); fd.append("file", f);
    try {
      const res = await fetch("/api/detect", { method: "POST", body: fd });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Error ${res.status}`); }
      const data = await res.json();
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  // Keyboard shortcuts: U = open file, Enter = submit, Esc = clear
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if (e.key === "u" || e.key === "U") { e.preventDefault(); uploadRef.current?.open(); }
      else if (e.key === "Enter" && file && !loading) { e.preventDefault(); handleDetect(file); }
      else if (e.key === "Escape") { setResult(null); setError(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [file, loading, handleDetect]);

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden="true" />

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo-wrap">
            <div className="logo-icon">
              <Shield size={20} />
            </div>
            <div className="logo-text">
              <h1>ForensicVision</h1>
              <p>Passive Image Forgery Detection · DCNN · SLIC · SIFT</p>
            </div>
          </div>

          <nav style={{ display: "flex", gap: 4 }}>
            {["detect", "training", "methodology"].map(t => (
              <button
                key={t}
                className="btn-ghost"
                style={{
                  padding: "6px 14px", fontSize: 12,
                  color: tab === t ? "var(--accent)" : undefined,
                  borderColor: tab === t ? "rgba(46,124,246,0.4)" : undefined,
                  background: tab === t ? "rgba(46,124,246,0.06)" : undefined,
                }}
                onClick={() => setTab(t)}
              >
                {t === "detect" ? "Detection" : t === "training" ? "Training Metrics" : "Methodology"}
              </button>
            ))}
          </nav>

          <div className="header-right">
            <BackendStatus />
            <span className="badge-pill" style={{ display: "none" }}>EfficientNetB0</span>
            <div className="kbd-row" title="U = upload · Enter = analyze · Esc = clear">
              <Keyboard size={12} />
              <kbd className="kbd">U</kbd>
              <kbd className="kbd">↵</kbd>
              <kbd className="kbd">Esc</kbd>
            </div>
          </div>
        </div>
      </header>

      {/* Hero stats */}
      <div className="hero">
        <div className="hero-inner">
          <div className="stat-grid">
            {STATS.map(s => (
              <div className="stat-card" key={s.lbl}>
                <div className={`stat-val ${s.cls}`}>{s.val}</div>
                <div className="stat-lbl">{s.lbl}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
          <p className="hero-note">
            Hybrid approach improvement over single-modal baselines ·&nbsp;
            Localization via <span className="hi">SLIC colour-inconsistency</span> +
            <span className="hi"> SIFT keypoint matching</span> ·&nbsp;
            Forgery types: copy-move, splicing
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="main">
        {tab === "detect" && (
          <div className="section">
            <div className="section-label">
              <div className="section-bar" />
              <div className="section-label-inner">
                <div className="eyebrow">Analyze</div>
                <h2>Upload &amp; Detect</h2>
              </div>
            </div>
            <div className="two-col">
              <UploadPanel
                ref={uploadRef}
                file={file}
                preview={preview}
                loading={loading}
                onFile={(f) => { setFile(f); setResult(null); setError(null); }}
                onDetect={handleDetect}
                onClear={() => { setFile(null); setResult(null); setError(null); }}
              />
              <div ref={resultRef}>
                <ResultPanel result={result} loading={loading} preview={preview} error={error} />
              </div>
            </div>
          </div>
        )}

        {tab === "training" && (
          <div className="section">
            <div className="section-label">
              <div className="section-bar" />
              <div className="section-label-inner">
                <div className="eyebrow">Metrics</div>
                <h2>Training Performance</h2>
              </div>
            </div>
            <TrainingPanel data={training} />
          </div>
        )}

        {tab === "methodology" && (
          <div className="section">
            <div className="section-label">
              <div className="section-bar" />
              <div className="section-label-inner">
                <div className="eyebrow">Research</div>
                <h2>Methodology &amp; Contribution</h2>
              </div>
            </div>
            <MethodologyPanel />
          </div>
        )}
      </main>

      <footer className="footer">
        Hybrid Deep Learning &amp; Machine Learning Approach for Passive Image Forgery Detection · CASIA v1.0 Dataset
      </footer>
    </div>
  );
}
