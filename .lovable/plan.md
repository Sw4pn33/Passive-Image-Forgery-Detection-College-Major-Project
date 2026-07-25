# ForensicVision — Passive Image Forgery Detection Frontend

## Stack note (important)
The project is on **TanStack Start v1** (file-based routing, SSR-capable), not plain Vite React. All requested features work identically; two adjustments:
- Routes live under `src/routes/*.tsx` (not `src/pages`). Tabs will be real routes: `/` (Detection), `/training`, `/methodology`, with a shared header/footer in `__root.tsx`.
- Dev proxy is configured on the Vite dev server inside `vite.config.ts` — same effect as requested (`/api` and `/health` → `http://localhost:8000`).

Everything else (React 19, TS, Tailwind v4, shadcn/ui, lucide, Recharts, React Query, sonner) matches spec.

## Design system (src/styles.css)
- Replace default tokens with the spec palette using `oklch()` equivalents mapped to semantic names: `background #060b14`, `surface #0d1526`, `surface-2 #142038`, `border #1e2d47`, `primary #2e7cf6`, `teal #00d4aa`, `danger #ef4444`, `warn #f59e0b`, `good #10b981`.
- Add tokens: `--gradient-brand: linear-gradient(135deg,#2e7cf6,#00d4aa)`, `--shadow-glass`, `--font-sans: "IBM Plex Sans"`, `--font-mono: "IBM Plex Mono"`.
- Global body: dark background + faint 48px blue grid via layered `background-image` (linear-gradients at rgba(46,124,246,0.04)).
- `@utility` classes: `.glass-card` (surface + border + rounded-2xl + subtle inner shadow), `.gradient-brand` (bg gradient), `.mono` (font-mono tabular-nums), `.animate-result` (fade + translateY keyframe).
- Force dark mode by adding `class="dark"` on `<html>` in `__root.tsx` shell.

## Fonts
- Load IBM Plex Sans + Mono via `<link>` tags added to `__root.tsx` `head().links` (preconnect + Google Fonts stylesheet — never `@import` in CSS per Tailwind v4 rules).

## Routing / layout
- `src/routes/__root.tsx`: dark shell, sticky header, hero stats bar, `<Outlet />`, footer, `<Toaster />` (sonner), `<HistorySheet />` mounted at root with zustand-free React context or a lightweight store using `useState` + localStorage sync.
- `src/routes/index.tsx`: Detection tab (replace placeholder).
- `src/routes/training.tsx`: Training Metrics tab.
- `src/routes/methodology.tsx`: Methodology tab.
- Header nav uses `<Link>` with `activeProps` to render the pill-tab active state.

## Components (src/components/)
- `layout/Header.tsx` — logo, title, subtitle, nav pills, `BackendStatusPill`, keyboard hint chips (U/Enter/Esc), history button with badge.
- `layout/HeroStats.tsx` — 4 stat cards + tagline line.
- `layout/Footer.tsx`.
- `common/StatCard.tsx`, `common/SectionEyebrow.tsx`, `common/MetricCell.tsx`, `common/ScoreBar.tsx`.
- `detection/UploadPanel.tsx` — drag-and-drop dropzone, thumbnail preview, Analyze/Clear buttons, Detection Pipeline card (4 steps with gradient step icons).
- `detection/ResultsPanel.tsx` — state machine (empty / loading / error / result) with animated transitions.
- `detection/ResultView.tsx` — header actions (Copy, Report TXT, Report PDF), Verdict block, Confidence bar (animates on mount), Original vs Heatmap grid with legend, Algorithm Diagnostics (2×2 metric grid + Copy-Move / Splicing score bars + conclusion row), Model Comparison table.
- `detection/HistorySheet.tsx` — shadcn `Sheet` (right side), lists last 5 from localStorage, click to restore, clear all.
- `training/StatsRow.tsx`, `training/AccuracyChart.tsx`, `training/LossChart.tsx` (Recharts `LineChart` + `Area` gradients + reference dot on best epoch + custom tooltip), `training/EpochTable.tsx` (shadcn `Table`, best row highlighted, ★ marker).
- `methodology/ResearchGap.tsx`, `methodology/Contribution.tsx` (numbered gradient badges 01–04), `methodology/Performance.tsx`, `methodology/HowItWorks.tsx`.

## Data layer (src/lib/)
- `api.ts` — typed fetchers: `detectImage(file) → DetectResponse`, `getTrainingHistory() → TrainingHistory`, `getHealth() → HealthStatus`. All hit `/api/*` and `/health` (proxied).
- `types.ts` — `Verdict`, `ForgeryType`, `DetectResponse`, `TrainingEpoch`, etc.
- `history.ts` — localStorage helpers (`getHistory`, `pushHistory` keeping last 5, `clearHistory`, `subscribe`).
- `reports.ts` — `buildTxtReport(result)`, `downloadTxt`, `downloadPdf` (uses `window.print()` of a hidden report node or dynamic import of jsPDF — will pick jsPDF for reliable output).
- `hooks/useBackendHealth.ts` — React Query polling `/health` every 30s.
- `hooks/useKeyboardShortcuts.ts` — U / Enter / Esc bindings scoped to detection page.
- `hooks/useDetectMutation.ts` — React Query mutation wrapping `detectImage`, pushes to history on success, shows sonner toast on error.

## Dependencies to add
- `recharts`, `sonner`, `jspdf`. shadcn primitives to generate/verify: `card`, `badge`, `button`, `tooltip`, `sheet`, `separator`, `progress`, `table`, `sonner`. (Some may already exist — verify before adding.)

## Vite proxy
Update `vite.config.ts` to add:
```ts
server: {
  proxy: {
    "/api":    { target: "http://localhost:8000", changeOrigin: true },
    "/health": { target: "http://localhost:8000", changeOrigin: true },
  },
}
```
(Preserve existing plugins and config.)

## Route metadata (SEO)
Each route gets its own `head()` with unique title/description/OG tags:
- `/` — "Detection · ForensicVision"
- `/training` — "Training Metrics · ForensicVision"
- `/methodology` — "Methodology · ForensicVision"
Root `head()` updated to "ForensicVision — Passive Image Forgery Detection" (replaces "Lovable App" placeholder).

## Behavior details
- Drop zone: visual `border-primary` + subtle glow while dragging; accepts `image/jpeg,image/png,image/tiff,image/bmp,image/webp`.
- Confidence bar animates from 0 → value on mount via CSS transition on `width`.
- Backend status pill: green pulsing dot when `model_loaded: true`, red when fetch fails; label "Model Ready" / "Backend Offline".
- History badge shows count; sheet restores by setting a shared "current result" state.
- All numeric values wrapped in `<span className="mono">`.
- Tooltips (shadcn) on every metric cell + score bar explaining meaning.
- Responsive: main grid `grid-cols-1 lg:grid-cols-2`; hero stats `grid-cols-2 lg:grid-cols-4`.
- No emojis, lucide-react icons only, no Lovable branding.

## Out of scope
- No backend code; assumes FastAPI runs separately on :8000.
- No auth, no persistence beyond localStorage history.
- No tests (college project scope).
