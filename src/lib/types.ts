export type Verdict = "FORGED" | "AUTHENTIC";
export type ForgeryType = "copy-move" | "splicing" | "unknown" | "none";
export type ForgeryType5 = "copy-move" | "splicing" | "object-removal" | "ai-generated" | "none" | "unknown";

export interface ForensicMeta {
  sift_keypoints: number;
  sift_matches: number;
  slic_segments: number;
  outlier_segments: number;
  copy_move_score: number;
  splicing_score: number;
}

export interface AiDetectionSignals {
  exif: number;
  frequency: number;
  noise: number;
  ela: number;
}

export interface AiDetection {
  is_ai_generated: boolean;
  confidence: number;
  label: string;
  signals: AiDetectionSignals;
}

export interface DomainScores {
  rgb: number;
  srm: number;
  freq: number;
  ela: number;
}

export interface DetectResponse {
  verdict: Verdict;
  confidence: number;
  forgery_type: ForgeryType;
  regions_found: number;
  heatmap: string;          // base64 JPEG — JET colormap (SLIC+SIFT or pixel mask)
  gradcam_jpeg: string;     // base64 JPEG — Grad-CAM
  ela_jpeg: string | null;  // base64 JPEG — ELA heatmap
  ela_uniformity: number;   // 0-100: higher = more uniform = likely AI
  original_jpeg: string;    // base64 JPEG of original
  process_time_ms: number;
  forensic_meta: ForensicMeta;
  ai_detection: AiDetection;
  // Phase 3 fields (optional for backward compat with Phase 2 backend)
  pixel_mask_256?: string | null;   // base64 JPEG 256×256 U-Net segmentation mask
  domain_scores?: DomainScores | null;
  evidence_score?: number | null;   // 0-100 evidence fusion confidence
  forgery_type_5?: ForgeryType5 | null;
}

export interface TrainingEpoch {
  epoch: number;
  train_acc: number;
  val_acc: number;
  train_loss: number;
  val_loss: number;
}

export interface TrainingHistory {
  epochs: TrainingEpoch[];
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  model_phase?: string;
  gpu?: boolean;
}

export interface StoredResult {
  id: string;
  timestamp: number;
  filename: string;
  originalDataUrl: string;
  result: DetectResponse;
}
