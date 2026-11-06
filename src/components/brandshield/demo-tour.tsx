"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  CreditCard,
  Database,
  FileSearch,
  Flag,
  Gauge,
  GitBranch,
  GraduationCap,
  HeartPulse,
  ListOrdered,
  Lock,
  PartyPopper,
  PenLine,
  Radar,
  ScanSearch,
  Settings,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/lib/brandshield/i18n";
import { useUIStore, type ViewKey } from "@/lib/brandshield/store";
import type { Role } from "@/lib/brandshield/types";
import { cn } from "@/lib/brandshield/utils";
import { Button } from "@/components/ui/button";
import "@/lib/brandshield/i18n/dict-tour";

// Per-role storage: switching demo personas replays that role's own tour.
export function tourKey(role: Role) {
  return `bs_tour_done_v3_${role}`;
}

interface TourStep {
  view: ViewKey;
  target: string | null; // [data-tour=…] selector; null = centered card (intro / completion)
  icon: LucideIcon;
  titleKey: string;
  bodyKey: string;
}

// ─── Role-specific scripts (copy lives in dict-tour → tour.<role>.s<n>.*) ────

function buildSteps(role: Role): TourStep[] {
  switch (role) {
    case "creator":
      return [
        { view: "dashboard", target: null, icon: Sparkles, titleKey: "tour.creator.s1.title", bodyKey: "tour.creator.s1.body" },
        { view: "dashboard", target: "[data-tour='composer']", icon: PenLine, titleKey: "tour.creator.s2.title", bodyKey: "tour.creator.s2.body" },
        { view: "dashboard", target: "[data-tour='pipeline']", icon: GitBranch, titleKey: "tour.creator.s3.title", bodyKey: "tour.creator.s3.body" },
        { view: "dashboard", target: "[data-tour='attention']", icon: Flag, titleKey: "tour.creator.s4.title", bodyKey: "tour.creator.s4.body" },
        { view: "knowledge", target: "[data-tour='page-root']", icon: Database, titleKey: "tour.creator.s5.title", bodyKey: "tour.creator.s5.body" },
        { view: "scanner", target: "[data-tour='page-root']", icon: ScanSearch, titleKey: "tour.creator.s6.title", bodyKey: "tour.creator.s6.body" },
        { view: "findings", target: "[data-tour='page-root']", icon: FileSearch, titleKey: "tour.creator.s7.title", bodyKey: "tour.creator.s7.body" },
        { view: "approvals", target: "[data-tour='page-root']", icon: ClipboardCheck, titleKey: "tour.creator.s8.title", bodyKey: "tour.creator.s8.body" },
      ];
    case "reviewer":
      return [
        { view: "dashboard", target: null, icon: Sparkles, titleKey: "tour.reviewer.s1.title", bodyKey: "tour.reviewer.s1.body" },
        { view: "dashboard", target: "[data-tour='queue']", icon: ListOrdered, titleKey: "tour.reviewer.s2.title", bodyKey: "tour.reviewer.s2.body" },
        { view: "dashboard", target: "[data-tour='risk']", icon: Radar, titleKey: "tour.reviewer.s3.title", bodyKey: "tour.reviewer.s3.body" },
        { view: "approvals", target: "[data-tour='page-root']", icon: ClipboardCheck, titleKey: "tour.reviewer.s4.title", bodyKey: "tour.reviewer.s4.body" },
        { view: "findings", target: "[data-tour='page-root']", icon: FileSearch, titleKey: "tour.reviewer.s5.title", bodyKey: "tour.reviewer.s5.body" },
        { view: "analytics", target: "[data-tour='page-root']", icon: BarChart3, titleKey: "tour.reviewer.s6.title", bodyKey: "tour.reviewer.s6.body" },
      ];
    case "contractor":
      return [
        { view: "dashboard", target: null, icon: Sparkles, titleKey: "tour.contractor.s1.title", bodyKey: "tour.contractor.s1.body" },
        { view: "dashboard", target: "[data-tour='sandbox-hero']", icon: Lock, titleKey: "tour.contractor.s2.title", bodyKey: "tour.contractor.s2.body" },
        { view: "dashboard", target: "[data-tour='steps']", icon: ListOrdered, titleKey: "tour.contractor.s3.title", bodyKey: "tour.contractor.s3.body" },
        { view: "scanner", target: "[data-tour='page-root']", icon: ScanSearch, titleKey: "tour.contractor.s4.title", bodyKey: "tour.contractor.s4.body" },
        { view: "findings", target: "[data-tour='page-root']", icon: FileSearch, titleKey: "tour.contractor.s5.title", bodyKey: "tour.contractor.s5.body" },
        { view: "knowledge", target: "[data-tour='page-root']", icon: Database, titleKey: "tour.contractor.s6.title", bodyKey: "tour.contractor.s6.body" },
      ];
    case "admin":
      return [
        { view: "dashboard", target: null, icon: Sparkles, titleKey: "tour.admin.s1.title", bodyKey: "tour.admin.s1.body" },
        { view: "dashboard", target: "[data-tour='kpi']", icon: Gauge, titleKey: "tour.admin.s2.title", bodyKey: "tour.admin.s2.body" },
        { view: "dashboard", target: "[data-tour='health']", icon: HeartPulse, titleKey: "tour.admin.s3.title", bodyKey: "tour.admin.s3.body" },
        { view: "dashboard", target: "[data-tour='kb']", icon: Database, titleKey: "tour.admin.s4.title", bodyKey: "tour.admin.s4.body" },
        { view: "dashboard", target: "[data-tour='billing-snap']", icon: CreditCard, titleKey: "tour.admin.s5.title", bodyKey: "tour.admin.s5.body" },
        { view: "knowledge", target: "[data-tour='page-root']", icon: Database, titleKey: "tour.admin.s6.title", bodyKey: "tour.admin.s6.body" },
        { view: "approvals", target: "[data-tour='page-root']", icon: ClipboardCheck, titleKey: "tour.admin.s7.title", bodyKey: "tour.admin.s7.body" },
        { view: "analytics", target: "[data-tour='page-root']", icon: BarChart3, titleKey: "tour.admin.s8.title", bodyKey: "tour.admin.s8.body" },
        { view: "settings", target: "[data-tour='page-root']", icon: Settings, titleKey: "tour.admin.s9.title", bodyKey: "tour.admin.s9.body" },
      ];
  }
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function DemoTour({ role }: { role: Role }) {
  const { tourOpen, setTourOpen, view, setView } = useUIStore();
  const { t } = useLang();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [lastRole, setLastRole] = useState(role);

  // A persona switch mid-tour restarts that role's own script.
  // (Adjust state during render — the React-endorsed alternative to effects.)
  if (lastRole !== role) {
    setLastRole(role);
    setStepIndex(0);
  }

  // Stable identity across renders — otherwise the step effect would
  // re-fire every render and loop forever.
  const steps = useMemo(() => buildSteps(role), [role]);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isLast = stepIndex === steps.length;
  const total = steps.length + 1;
  const roleLabel = t(`common.role.${role}`);

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(tourKey(role), "1");
    } catch {
      /* private mode — ignore */
    }
    setTourOpen(false);
    setView("dashboard");
  }, [role, setTourOpen, setView]);

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

  // Auto-start on this role's first ever login
  useEffect(() => {
    if (!tourOpen) {
      try {
        if (!window.localStorage.getItem(tourKey(role))) {
          const timer = window.setTimeout(() => start(), 700);
          return () => window.clearTimeout(timer);
        }
      } catch {
        /* ignore */
      }
    }
  }, [tourOpen, start, role]);

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
    // synchronous setState inside the effect body). Target-less intro steps
    // and the completion card center immediately.
    const timeout = window.setTimeout(
      () => {
        setRect(null);
        if (!isLast && step.target) tick();
      },
      isLast || !step.target ? 0 : 420 // let AnimatePresence switch views
    );
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
    <div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label={t("tour.aria.dialog")}
    >
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

      {/* Centered scrim when no target (intro & completion steps) */}
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
                    {isLast ? t("tour.allSet") : t("tour.stepCounter", { x: stepIndex + 1, y: total })}
                  </p>
                  <h2 className="text-sm font-semibold leading-tight text-slate-900">
                    {isLast ? t("tour.complete.title") : t(step.titleKey, { role: roleLabel })}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={finish}
                aria-label={t("tour.aria.skip")}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {isLast
                ? t(`tour.${role}.done.body`, { role: roleLabel })
                : t(step.bodyKey, { role: roleLabel })}
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
                {t("tour.btn.skip")}
              </Button>
              <div className="flex items-center gap-2">
                {stepIndex > 0 && !isLast && (
                  <Button variant="outline" size="sm" onClick={back} className="rounded-lg">
                    {t("tour.btn.back")}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={next}
                  className="gap-1.5 rounded-lg bg-teal-700 text-white hover:bg-teal-800"
                >
                  {isLast ? t("tour.btn.finish") : stepIndex === 0 ? t("tour.btn.go") : t("tour.btn.next")}
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
