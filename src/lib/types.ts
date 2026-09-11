export type Verdict = "FORGED" | "AUTHENTIC";
export type ForgeryType = "copy-move" | "splicing" | "unknown" | "none";

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

export interface DetectResponse {
  verdict: Verdict;
  confidence: number;
  forgery_type: ForgeryType;
  regions_found: number;
  heatmap: string;          // base64 JPEG — pure JET colormap (SLIC+SIFT mask)
  gradcam_jpeg: string;     // base64 JPEG — pure JET colormap (Grad-CAM from EfficientNetB0)
  ela_jpeg: string | null;  // base64 JPEG — Error Level Analysis heatmap
  ela_uniformity: number;   // 0-100: higher = more uniform ELA = more likely AI
  original_jpeg: string;    // base64 JPEG of original (display-safe for any input format)
  process_time_ms: number;  // inference + localization time in ms
  forensic_meta: ForensicMeta;
  ai_detection: AiDetection;
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
}

export interface StoredResult {
  id: string;
  timestamp: number;
  filename: string;
  originalDataUrl: string;
  result: DetectResponse;
}
