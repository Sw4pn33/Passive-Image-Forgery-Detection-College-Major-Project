import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { UploadCloud, ImageIcon, X, Cpu, Eye, Zap } from "lucide-react";

const ACCEPTED = ["image/jpeg", "image/png", "image/tiff", "image/bmp", "image/webp"];

const PIPELINE = [
  { icon: Cpu,         name: "DCNN Classification",   desc: "EfficientNetB0 classifies authentic vs forged" },
  { icon: Zap,         name: "SLIC Segmentation",      desc: "~100 superpixels, colour-illumination stats" },
  { icon: Eye,         name: "SIFT Keypoint Matching", desc: "500 keypoints, brute-force L2 duplicate search" },
  { icon: UploadCloud, name: "Heatmap Output",         desc: "JET-coloured overlay on detected regions" },
];

const UploadPanel = forwardRef(function UploadPanel({ file, preview, loading, onFile, onDetect, onClear }, ref) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  useImperativeHandle(ref, () => ({
    open: () => !loading && inputRef.current?.click(),
  }));

  const pick = (f) => {
    if (!f || !ACCEPTED.includes(f.type)) return;
    onFile(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    pick(e.dataTransfer.files[0]);
  }, [onFile]);

  return (
    <div className="glass" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div className="glass-title">Upload Image</div>
        <div className="glass-sub">JPG · PNG · TIFF · BMP · WebP</div>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && !loading && inputRef.current?.click()}
        aria-label="Upload image for forgery analysis"
      >
        <input
          ref={inputRef} type="file" accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => pick(e.target.files[0])}
        />

        {file ? (
          <>
            {preview ? (
              <img
                src={preview} alt="preview"
                style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }}
              />
            ) : (
              <ImageIcon size={40} className="drop-icon" />
            )}
            <div className="fname">{file.name}</div>
            <div className="fsize">{(file.size / 1024).toFixed(1)} KB</div>
          </>
        ) : (
          <>
            <UploadCloud size={44} className="drop-icon" />
            <div className="drop-text">Drag &amp; drop image here</div>
            <div className="drop-sub">or click to browse · press <kbd className="kbd">U</kbd></div>
          </>
        )}
      </div>

      {/* Actions */}
      {file && (
        <div className="actions">
          <button
            className="btn-primary"
            onClick={() => onDetect(file)}
            disabled={loading}
            aria-label="Analyze image for forgery"
          >
            {loading ? (
              <><span className="spin" /> Analyzing…</>
            ) : (
              <><Cpu size={14} /> Analyze Image</>
            )}
          </button>
          <button className="btn-ghost" onClick={onClear} disabled={loading} aria-label="Clear image">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Pipeline info */}
      <div className="pipeline-card">
        <div className="pipeline-title">Detection Pipeline</div>
        <ul className="pipeline-steps">
          {PIPELINE.map((p, i) => (
            <li key={p.name}>
              <div className="step-num-badge">{i + 1}</div>
              <div>
                <span className="step-name">{p.name}</span>
                {p.desc}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

export default UploadPanel;
