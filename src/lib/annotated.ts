import type { StoredResult } from "./types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Compose the original image + JET heatmap (at the given opacity) + a labelled
 * legend strip into a single annotated PNG and trigger a download.
 */
export async function downloadAnnotatedPng(item: StoredResult, opacity: number) {
  const [original, heatmap] = await Promise.all([
    loadImage(item.originalDataUrl),
    loadImage(`data:image/jpeg;base64,${item.result.heatmap}`),
  ]);

  const w = original.naturalWidth;
  const h = original.naturalHeight;
  const legendH = Math.max(56, Math.round(h * 0.07));
  const pad = Math.max(16, Math.round(w * 0.015));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h + legendH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");

  // Original
  ctx.drawImage(original, 0, 0, w, h);

  // Heatmap overlay (resized to fit original)
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.drawImage(heatmap, 0, 0, w, h);
  ctx.globalAlpha = 1;

  // Legend background
  ctx.fillStyle = "#060b14";
  ctx.fillRect(0, h, w, legendH);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, h, w, 1);

  const r = item.result;
  const verdictColor = r.verdict === "FORGED" ? "#ef4444" : "#10b981";
  const fontBase = Math.max(12, Math.round(legendH * 0.28));

  // Verdict text (left)
  ctx.fillStyle = verdictColor;
  ctx.font = `bold ${fontBase + 4}px "IBM Plex Sans", system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText(r.verdict, pad, h + legendH / 2 - fontBase * 0.55);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `${fontBase - 2}px "IBM Plex Mono", ui-monospace, monospace`;
  const sub =
    `${r.confidence.toFixed(1)}%  ·  ${r.forgery_type}` +
    (item.filename ? `  ·  ${item.filename}` : "");
  ctx.fillText(sub, pad, h + legendH / 2 + fontBase * 0.85);

  // JET colour bar (right)
  const barW = Math.min(Math.round(w * 0.28), 320);
  const barH = Math.max(10, Math.round(legendH * 0.22));
  const barX = w - pad - barW;
  const barY = h + legendH / 2 - barH / 2 - fontBase * 0.2;

  const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  grad.addColorStop(0.0, "#000080");
  grad.addColorStop(0.25, "#0000ff");
  grad.addColorStop(0.5, "#00ff00");
  grad.addColorStop(0.75, "#ffff00");
  grad.addColorStop(1.0, "#ff0000");
  ctx.fillStyle = grad;
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `${fontBase - 4}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.textBaseline = "top";
  ctx.fillText("low", barX, barY + barH + 4);
  const highLabel = "high";
  const highWidth = ctx.measureText(highLabel).width;
  ctx.fillText(highLabel, barX + barW - highWidth, barY + barH + 4);

  ctx.fillStyle = "#e2e8f0";
  ctx.textBaseline = "bottom";
  ctx.font = `${fontBase - 3}px "IBM Plex Sans", system-ui, sans-serif`;
  const title = `Heatmap · ${Math.round(opacity * 100)}% overlay`;
  const titleWidth = ctx.measureText(title).width;
  ctx.fillText(title, barX + barW - titleWidth, barY - 4);

  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve();
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `forensicvision-${item.id}-annotated.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}
