import type { StoredResult } from "./types";

const KEY = "fv:history:v1";
const MAX = 5;
type Listener = (items: StoredResult[]) => void;
const listeners = new Set<Listener>();

function safeParse(raw: string | null): StoredResult[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function getHistory(): StoredResult[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(KEY));
}

function write(items: StoredResult[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((fn) => fn(items));
}

export function pushHistory(item: StoredResult) {
  const items = [item, ...getHistory()].slice(0, MAX);
  write(items);
}

export function clearHistory() {
  write([]);
}

export function subscribeHistory(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
