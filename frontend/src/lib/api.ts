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

export async function getTrainingHistory(): Promise<TrainingHistory> {
  const res = await fetch("/api/training-history");
  return jsonOrThrow<TrainingHistory>(res);
}

export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch("/api/health");
  return jsonOrThrow<HealthStatus>(res);
}
