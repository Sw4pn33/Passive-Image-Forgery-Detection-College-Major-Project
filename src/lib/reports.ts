import type { StoredResult } from "./types";

function fmtDate(ts: number) {
  return new Date(ts).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export function buildTxtReport(item: StoredResult): string {
  const r = item.result;
  const m = r.forensic_meta;
  const lines = [
    "ForensicVision — Passive Image Forgery Detection Report",
    "=".repeat(60),
    `Timestamp:       ${fmtDate(item.timestamp)}`,
    `Source file:     ${item.filename}`,
    "",
    "Verdict",
    "-".repeat(60),
    `Verdict:         ${r.verdict}`,
    `Confidence:      ${r.confidence.toFixed(2)} %`,
    `Forgery type:    ${r.forgery_type}`,
    `Regions found:   ${r.regions_found}`,
    "",
    "Algorithm Diagnostics",
    "-".repeat(60),
    `SIFT keypoints:  ${m.sift_keypoints}`,
    `SIFT matches:    ${m.sift_matches}`,
    `SLIC segments:   ${m.slic_segments}`,
    `Outlier regions: ${m.outlier_segments}`,
    `Copy-move score: ${(m.copy_move_score * 100).toFixed(2)} %`,
    `Splicing score:  ${(m.splicing_score * 100).toFixed(2)} %`,
    "",
    "Pipeline",
    "-".repeat(60),
    "EfficientNetB0 (ImageNet pretrained) → SLIC superpixels →",
    "SIFT keypoint matching → JET heatmap localization",
    "",
    "CASIA v1.0 dataset · ~1,700 training images · Best val_acc 92.64% (epoch 32/40)",
    "",
  ];
  return lines.join("\n");
}

export function downloadTxt(item: StoredResult) {
  const blob = new Blob([buildTxtReport(item)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `forensicvision-${item.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadPdf(item: StoredResult) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const r = item.result;
  const m = r.forensic_meta;
  let y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ForensicVision", 48, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text("Passive Image Forgery Detection Report", 48, y);
  y += 24;
  doc.setTextColor(0);

  doc.setFontSize(10);
  doc.text(`Timestamp:  ${fmtDate(item.timestamp)}`, 48, y);
  y += 14;
  doc.text(`File:       ${item.filename}`, 48, y);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Verdict", 48, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const verdictColor: [number, number, number] =
    r.verdict === "FORGED" ? [239, 68, 68] : [16, 185, 129];
  doc.setTextColor(...verdictColor);
  doc.setFont("helvetica", "bold");
  doc.text(`${r.verdict}   ${r.confidence.toFixed(2)}%`, 48, y);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  y += 16;
  doc.text(`Forgery type: ${r.forgery_type}`, 48, y);
  y += 14;
  doc.text(`Regions found: ${r.regions_found}`, 48, y);
  y += 22;

  // images side by side
  const imgW = 230;
  const imgH = 160;
  try {
    doc.addImage(item.originalDataUrl, "JPEG", 48, y, imgW, imgH);
  } catch {
    /* ignore */
  }
  try {
    doc.addImage(`data:image/jpeg;base64,${r.heatmap}`, "JPEG", 48 + imgW + 20, y, imgW, imgH);
  } catch {
    /* ignore */
  }
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Original", 48, y + imgH + 12);
  doc.text("Forgery heatmap (JET)", 48 + imgW + 20, y + imgH + 12);
  doc.setTextColor(0);
  y += imgH + 32;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Algorithm Diagnostics", 48, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const rows = [
    ["SIFT keypoints", `${m.sift_keypoints}`],
    ["SIFT matches", `${m.sift_matches}`],
    ["SLIC segments", `${m.slic_segments}`],
    ["Outlier regions", `${m.outlier_segments}`],
    ["Copy-move score", `${(m.copy_move_score * 100).toFixed(2)}%`],
    ["Splicing score", `${(m.splicing_score * 100).toFixed(2)}%`],
  ];
  rows.forEach(([k, v]) => {
    doc.text(k, 48, y);
    doc.text(v, 220, y);
    y += 14;
  });

  y += 16;
  doc.setTextColor(120);
  doc.setFontSize(9);
  doc.text(
    "EfficientNetB0 · SLIC superpixels · SIFT keypoint matching · CASIA v1.0",
    48,
    y,
  );

  doc.save(`forensicvision-${item.id}.pdf`);
}
