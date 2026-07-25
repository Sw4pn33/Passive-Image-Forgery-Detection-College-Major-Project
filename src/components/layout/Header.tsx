import { Link } from "@tanstack/react-router";
import { ShieldCheck, History, Keyboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackendStatusPill } from "./BackendStatusPill";
import { useAppState } from "@/lib/app-state";
import { useHistory } from "@/hooks/useHistory";

const TABS = [
  { to: "/", label: "Detection" },
  { to: "/training", label: "Training Metrics" },
  { to: "/methodology", label: "Methodology" },
] as const;

export function Header() {
  const { setHistoryOpen } = useAppState();
  const history = useHistory();

  return (
    <header
      className="sticky top-0 z-40 border-b border-border/70 backdrop-blur-xl"
      style={{ background: "var(--header-bg)" }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-6 py-3.5">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="grid size-10 place-items-center rounded-xl gradient-brand shadow-md shadow-primary/20">
            <ShieldCheck className="size-5 text-white" strokeWidth={2} />
          </div>
          <div className="hidden sm:block">
            <div className="text-[15px] font-semibold tracking-tight text-foreground leading-tight">
              ForensicVision
            </div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground mono">
              Passive Image Forgery · DCNN · SLIC · SIFT
            </div>
          </div>
        </Link>

        <nav className="mx-auto hidden md:flex items-center gap-1 rounded-full border border-border/70 bg-surface/60 p-1">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: true }}
              className="px-4 py-1.5 text-[13px] font-medium rounded-full text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{
                className:
                  "px-4 py-1.5 text-[13px] font-medium rounded-full text-white gradient-brand shadow-sm shadow-primary/20",
              }}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-1.5 text-muted-foreground">
            <Keyboard className="size-3.5" />
            <KbdHint k="U" label="upload" />
            <KbdHint k="↵" label="analyze" />
            <KbdHint k="Esc" label="clear" />
          </div>
          <BackendStatusPill />
          <Button
            variant="outline"
            size="sm"
            className="relative border-border/70 bg-background/60"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="size-4" />
            <span className="hidden sm:inline">History</span>
            {history.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 min-w-5 rounded-full gradient-brand text-white px-1.5 mono text-[10px]">
                {history.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="md:hidden border-t border-border/60">
        <div className="mx-auto flex max-w-[1400px] gap-1 px-3 py-2 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: true }}
              className="px-3 py-1.5 text-xs font-medium rounded-full text-muted-foreground whitespace-nowrap hover:text-foreground transition-colors"
              activeProps={{
                className:
                  "px-3 py-1.5 text-xs font-medium rounded-full text-white gradient-brand whitespace-nowrap",
              }}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

function KbdHint({ k, label }: { k: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[10.5px]">
      <kbd className="mono rounded border border-border/80 bg-surface-2/60 px-1.5 py-0.5 text-[10px] text-foreground">
        {k}
      </kbd>
      <span className="text-[10px]">{label}</span>
    </span>
  );
}
