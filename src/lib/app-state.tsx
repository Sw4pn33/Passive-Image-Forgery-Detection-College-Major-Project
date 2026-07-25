import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { StoredResult } from "./types";

interface AppState {
  currentResult: StoredResult | null;
  setCurrentResult: (r: StoredResult | null) => void;
  historyOpen: boolean;
  setHistoryOpen: (o: boolean) => void;
  requestFilePicker: number;
  triggerFilePicker: () => void;
  requestAnalyze: number;
  triggerAnalyze: () => void;
  requestClear: number;
  triggerClear: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [currentResult, setCurrentResult] = useState<StoredResult | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [requestFilePicker, setRfp] = useState(0);
  const [requestAnalyze, setRa] = useState(0);
  const [requestClear, setRc] = useState(0);

  const value = useMemo<AppState>(
    () => ({
      currentResult,
      setCurrentResult,
      historyOpen,
      setHistoryOpen,
      requestFilePicker,
      triggerFilePicker: () => setRfp((n) => n + 1),
      requestAnalyze,
      triggerAnalyze: () => setRa((n) => n + 1),
      requestClear,
      triggerClear: () => setRc((n) => n + 1),
    }),
    [currentResult, historyOpen, requestFilePicker, requestAnalyze, requestClear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
