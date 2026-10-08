import type { DetectResponse, HealthStatus, TrainingHistory } from "./types";

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) msg = String(body.detail);
      else if (body?.message) msg = String(body.message);
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function detectImage(file: File): Promise<DetectResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/detect", { method: "POST", body: fd });
  return jsonOrThrow<DetectResponse>(res);
}

const PHASE3_STATIC: TrainingHistory = {
  epochs: [
    { epoch: 1,  train_loss: 0.83, train_acc: 61.2, val_loss: 0.78, val_acc: 57.4 },
    { epoch: 2,  train_loss: 0.72, train_acc: 62.8, val_loss: 0.69, val_acc: 59.1 },
    { epoch: 3,  train_loss: 0.61, train_acc: 63.5, val_loss: 0.62, val_acc: 60.8 },
    { epoch: 4,  train_loss: 0.52, train_acc: 64.1, val_loss: 0.58, val_acc: 61.9 },
    { epoch: 5,  train_loss: 0.47, train_acc: 64.8, val_loss: 0.55, val_acc: 62.6 },
    { epoch: 6,  train_loss: 0.43, train_acc: 65.2, val_loss: 0.57, val_acc: 62.1 },
    { epoch: 7,  train_loss: 0.40, train_acc: 65.5, val_loss: 0.59, val_acc: 61.5 },
    { epoch: 8,  train_loss: 0.38, train_acc: 65.8, val_loss: 0.61, val_acc: 61.0 },
    { epoch: 9,  train_loss: 0.36, train_acc: 66.1, val_loss: 0.63, val_acc: 60.6 },
    { epoch: 10, train_loss: 0.34, train_acc: 66.3, val_loss: 0.64, val_acc: 60.2 },
    { epoch: 11, train_loss: 0.33, train_acc: 66.5, val_loss: 0.65, val_acc: 59.8 },
    { epoch: 12, train_loss: 0.32, train_acc: 66.7, val_loss: 0.67, val_acc: 59.4 },
    { epoch: 13, train_loss: 0.31, train_acc: 66.9, val_loss: 0.68, val_acc: 59.0 },
  ],
};

export async function getTrainingHistory(): Promise<TrainingHistory> {
  try {
    const res = await fetch("/api/training-history");
    if (!res.ok) return PHASE3_STATIC;
    return res.json() as Promise<TrainingHistory>;
  } catch {
    return PHASE3_STATIC;
  }
}

export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch("/api/health");
  return jsonOrThrow<HealthStatus>(res);
}
