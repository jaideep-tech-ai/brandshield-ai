"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ClipboardCheck,
  Database,
  FileSearch,
  GraduationCap,
  PartyPopper,
  ScanSearch,
  Sparkles,
  BarChart3,
  X,
} from "lucide-react";
import { useUIStore, type ViewKey } from "@/lib/brandshield/store";
import type { Role } from "@/lib/brandshield/types";
import { cn } from "@/lib/brandshield/utils";
import { Button } from "@/components/ui/button";

export const TOUR_STORAGE_KEY = "bs_tour_done_v2";

interface TourStep {
  view: ViewKey;
  target: string | null; // [data-tour=…] selector; null = centered completion card
  icon: typeof Sparkles;
  title: string;
  body: string;
}

function buildSteps(role: Role): TourStep[] {
  const steps: TourStep[] = [
    {
      view: "dashboard",
      target: "[data-tour='stats']",
      icon: Sparkles,
      title: "Your governance cockpit",
      body:
        role === "creator" || role === "contractor"
          ? "Live counters for your submissions, open findings, average compliance score and review queue — all updating in real time."
          : "Live counters for team submissions, open findings, average compliance score and the review queue — all updating in real time.",
    },
    {
      view: "dashboard",
      target: "[data-tour='quick-actions']",
      icon: Sparkles,
      title: "One-click shortcuts",
      body: "Every common task is one click away. Try “Run a pre-flight scan” — we'll walk you through it next.",
    },
    {
      view: "knowledge",
      target: "[data-tour='page-root']",
      icon: Database,
      title: "Stage 1 · Ground-truth repository",
      body: "Upload brand guidelines, product facts and visual tokens. Documents are chunked and indexed so every future finding can cite a verbatim rule.",
    },
    {
      view: "scanner",
      target: "[data-tour='page-root']",
      icon: ScanSearch,
      title: "Stage 2 · Pre-flight scanner",
      body: "Paste copy or drop a banner. A deterministic pre-filter runs first (<100 ms, no AI cost), then the RAG + vision pipeline verifies claims, tone and color contrast.",
    },
    {
      view: "findings",
      target: "[data-tour='page-root']",
      icon: FileSearch,
      title: "Stage 3 · Explainable findings",
      body: "Each flag shows the exact phrase, the rule it broke, why it matters — and a one-click rewrite that fixes intent, not just words.",
    },
    {
      view: "approvals",
      target: "[data-tour='page-root']",
      icon: ClipboardCheck,
      title: "Stage 4 · Sign-off & audit trail",
      body: "Reviewers compare versions side-by-side, approve or request changes, and every decision is hashed into a tamper-evident SHA-256 audit chain.",
    },
  ];

  if (role === "reviewer" || role === "admin") {
    steps.push({
      view: "analytics",
      target: "[data-tour='page-root']",
      icon: BarChart3,
      title: "Stage 5 · Drift analytics",
      body: "Spot where brand drift happens, which departments are fastest, and which rules keep triggering — a signal that a rule is ambiguous or too strict.",
    });
  }

  return steps;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function DemoTour({ role }: { role: Role }) {
  const { tourOpen, setTourOpen, view, setView } = useUIStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  // Stable identity across renders — otherwise the step effect would
  // re-fire every render and loop forever.
  const steps = useMemo(() => buildSteps(role), [role]);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isLast = stepIndex === steps.length;
  const total = steps.length + 1;

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    } catch {
      /* private mode — ignore */
    }
    setTourOpen(false);
    setView("dashboard");
  }, [setTourOpen, setView]);

  const start = useCallback(() => {
    setStepIndex(0);
    setTourOpen(true);
  }, [setTourOpen]);

  // Expose manual start from shell buttons via a custom event
  useEffect(() => {
    const handler = () => start();
    window.addEventListener("brandshield:start-tour", handler);
    return () => window.removeEventListener("brandshield:start-tour", handler);
  }, [start]);

  // Auto-start on first ever login
  useEffect(() => {
    if (!tourOpen) {
      try {
        if (!window.localStorage.getItem(TOUR_STORAGE_KEY)) {
          const t = window.setTimeout(() => start(), 700);
          return () => window.clearTimeout(t);
        }
      } catch {
        /* ignore */
      }
    }
  }, [tourOpen, start]);

  // Navigate to the step's view, then locate the spotlight target
  useEffect(() => {
    if (!tourOpen) return;
    if (!isLast && view !== step.view) {
      setView(step.view);
    }
    let raf = 0;
    let tries = 0;
    let scrolled = false;
    const tick = () => {
      tries += 1;
      if (isLast) {
        setRect(null);
        return;
      }
      const el = step.target ? document.querySelector<HTMLElement>(step.target) : null;
      if (el) {
        const r = el.getBoundingClientRect();
        const fullyVisible = r.top >= 90 && r.bottom <= window.innerHeight - 90;
        if (!fullyVisible && !scrolled && tries < 40) {
          scrolled = true;
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          raf = window.requestAnimationFrame(tick);
          return;
        }
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else if (tries < 60) {
        raf = window.requestAnimationFrame(tick);
      } else {
        setRect(null); // give up: show centered card
      }
    };
    // Clear the previous spotlight and re-locate asynchronously (avoids
    // synchronous setState inside the effect body).
    const timeout = window.setTimeout(() => {
      setRect(null);
      if (!isLast) tick();
    }, isLast ? 0 : 420); // let AnimatePresence switch views
    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(raf);
    };
  }, [tourOpen, stepIndex, isLast, step, view, setView]);

  // Keep spotlight glued to the target on resize / scroll
  useLayoutEffect(() => {
    if (!tourOpen || isLast) return;
    const update = () => {
      const el = step.target ? document.querySelector<HTMLElement>(step.target) : null;
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [tourOpen, isLast, step]);

  // ESC skips the tour
  useEffect(() => {
    if (!tourOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourOpen, finish]);

  if (!tourOpen) return null;

  const next = () => (isLast ? finish() : setStepIndex((i) => Math.min(i + 1, total - 1)));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  // Card placement: prefer below the target, flip above if not enough room.
  // Very tall targets (full-page wrappers) get a top-anchored card.
  const hugeTarget = rect ? rect.height > window.innerHeight - 260 : false;
  const cardBelow = rect ? rect.top + rect.height + 16 < window.innerHeight - 230 : true;
  const cardStyle: React.CSSProperties | undefined = rect
    ? {
        top: hugeTarget
          ? Math.max(84, rect.top + 16)
          : cardBelow
            ? rect.top + rect.height + 14
            : undefined,
        bottom: !hugeTarget && !cardBelow ? window.innerHeight - rect.top + 14 : undefined,
        left: Math.max(16, Math.min(rect.left + rect.width / 2 - 175, window.innerWidth - 366)),
      }
    : undefined;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Guided product tour">
      {/* Spotlight + scrim — glides smoothly between steps */}
      {rect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="pointer-events-none absolute rounded-xl border-2 border-teal-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.55)]"
        >
          <motion.span
            className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-teal-500 text-white shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", bounce: 0.5 }}
          >
            <GraduationCap className="size-3.5" />
          </motion.span>
        </motion.div>
      )}

      {/* Centered scrim when no target (welcome-adjacent & completion steps) */}
      {!rect && <div className="absolute inset-0 bg-slate-950/55" />}

      {/* Tooltip card */}
      <div
        className={cn(
          "absolute w-[350px] max-w-[calc(100vw-32px)]",
          !rect && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        style={rect ? cardStyle : undefined}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                  {isLast ? <PartyPopper className="size-4.5" /> : <step.icon className="size-4.5" />}
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-600">
                    {isLast ? "You're all set" : `Step ${stepIndex + 1} of ${total}`}
                  </p>
                  <h2 className="text-sm font-semibold leading-tight text-slate-900">
                    {isLast ? "Tour complete — you're ready to ship on-brand" : step.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={finish}
                aria-label="Skip tour"
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {isLast
                ? "Jump in with the demo personas on the sign-in screen — each one shows a different role's workspace. You can replay this tour anytime from the 🎓 button in the header."
                : step.body}
            </p>

            {/* Progress dots */}
            <div className="mt-4 flex items-center gap-1.5" aria-hidden>
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === stepIndex ? "w-5 bg-teal-600" : i < stepIndex ? "w-1.5 bg-teal-300" : "w-1.5 bg-slate-200"
                  )}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={finish} className="text-slate-500 hover:text-slate-800">
                Skip tour
              </Button>
              <div className="flex items-center gap-2">
                {stepIndex > 0 && !isLast && (
                  <Button variant="outline" size="sm" onClick={back} className="rounded-lg">
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={next}
                  className="gap-1.5 rounded-lg bg-teal-700 text-white hover:bg-teal-800"
                >
                  {isLast ? "Finish" : stepIndex === 0 ? "Let's go" : "Next"}
                  {!isLast && <ArrowRight className="size-3.5" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
