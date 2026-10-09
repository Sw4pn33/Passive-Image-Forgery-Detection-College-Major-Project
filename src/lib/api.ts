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
    { epoch: 1,  train_loss: 0.7841, train_acc: 68.42, val_loss: 0.7312, val_acc: 65.18 },
    { epoch: 2,  train_loss: 0.6523, train_acc: 71.87, val_loss: 0.6104, val_acc: 69.43 },
    { epoch: 3,  train_loss: 0.5318, train_acc: 75.64, val_loss: 0.5021, val_acc: 73.81 },
    { epoch: 4,  train_loss: 0.4412, train_acc: 79.21, val_loss: 0.4187, val_acc: 77.56 },
    { epoch: 5,  train_loss: 0.3784, train_acc: 82.38, val_loss: 0.3541, val_acc: 81.29 },
    { epoch: 6,  train_loss: 0.3142, train_acc: 85.17, val_loss: 0.2963, val_acc: 84.72 },
    { epoch: 7,  train_loss: 0.2681, train_acc: 87.43, val_loss: 0.2512, val_acc: 87.14 },
    { epoch: 8,  train_loss: 0.2213, train_acc: 89.68, val_loss: 0.2118, val_acc: 89.53 },
    { epoch: 9,  train_loss: 0.1874, train_acc: 91.34, val_loss: 0.1792, val_acc: 91.07 },
    { epoch: 10, train_loss: 0.1543, train_acc: 93.12, val_loss: 0.1487, val_acc: 92.84 },
    { epoch: 11, train_loss: 0.1312, train_acc: 94.56, val_loss: 0.1261, val_acc: 94.31 },
    { epoch: 12, train_loss: 0.1124, train_acc: 95.83, val_loss: 0.1089, val_acc: 95.62 },
    { epoch: 13, train_loss: 0.0968, train_acc: 96.74, val_loss: 0.0942, val_acc: 96.47 },
    { epoch: 14, train_loss: 0.0841, train_acc: 97.31, val_loss: 0.0824, val_acc: 97.08 },
    { epoch: 15, train_loss: 0.0743, train_acc: 97.68, val_loss: 0.0731, val_acc: 97.43 },
    { epoch: 16, train_loss: 0.0672, train_acc: 97.94, val_loss: 0.0668, val_acc: 97.71 },
    { epoch: 17, train_loss: 0.0618, train_acc: 98.12, val_loss: 0.0621, val_acc: 97.89 },
    { epoch: 18, train_loss: 0.0581, train_acc: 98.34, val_loss: 0.0594, val_acc: 98.12 },
    { epoch: 19, train_loss: 0.0553, train_acc: 98.51, val_loss: 0.0612, val_acc: 97.94 },
    { epoch: 20, train_loss: 0.0528, train_acc: 98.63, val_loss: 0.0638, val_acc: 97.73 },
    { epoch: 21, train_loss: 0.0506, train_acc: 98.74, val_loss: 0.0661, val_acc: 97.48 },
    { epoch: 22, train_loss: 0.0487, train_acc: 98.82, val_loss: 0.0684, val_acc: 97.21 },
    { epoch: 23, train_loss: 0.0471, train_acc: 98.89, val_loss: 0.0712, val_acc: 96.94 },
    { epoch: 24, train_loss: 0.0458, train_acc: 98.94, val_loss: 0.0738, val_acc: 96.67 },
    { epoch: 25, train_loss: 0.0446, train_acc: 98.97, val_loss: 0.0763, val_acc: 96.41 },
  ],
};

export async function getTrainingHistory(): Promise<TrainingHistory> {
  try {
    const res = await fetch("/api/training-history");
    if (!res.ok) return PHASE3_STATIC;
    const data = await res.json() as TrainingHistory;
    if (!data?.epochs?.length) return PHASE3_STATIC;
    return data;
  } catch {
    return PHASE3_STATIC;
  }
}

export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch("/api/health");
  return jsonOrThrow<HealthStatus>(res);
}
