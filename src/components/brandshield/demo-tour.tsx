"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Blocks,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Database,
  Eye,
  FileCheck2,
  FileSearch,
  Flag,
  FolderGit2,
  Gauge,
  GitBranch,
  GraduationCap,
  HeartPulse,
  Layers,
  ListOrdered,
  Lock,
  Palette,
  PartyPopper,
  Pause,
  PenLine,
  Play,
  Radar,
  RotateCcw,
  ScanSearch,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/lib/brandshield/i18n";
import { useUIStore, type ViewKey } from "@/lib/brandshield/store";
import { useSession, useTourState, useUpdateTourState } from "@/lib/brandshield/client";
import type { Role } from "@/lib/brandshield/types";
import { cn } from "@/lib/brandshield/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import "@/lib/brandshield/i18n/dict-tour";

interface TourStep {
  view: ViewKey;
  target: string | null;
  icon: LucideIcon;
  titleKey: string;
  bodyKey: string;
}

// ─── Four Streamlined, Crisp Role-Based Tours (5 Steps Each) ─────────────────

function buildSteps(role: Role): TourStep[] {
  switch (role) {
    case "admin":
      return [
        { view: "dashboard", target: "[data-tour='kpi']", icon: Gauge, titleKey: "tour.admin.s1.title", bodyKey: "tour.admin.s1.body" },
        { view: "knowledge", target: null, icon: Database, titleKey: "tour.admin.s2.title", bodyKey: "tour.admin.s2.body" },
        { view: "scanner", target: null, icon: ScanSearch, titleKey: "tour.admin.s3.title", bodyKey: "tour.admin.s3.body" },
        { view: "findings", target: null, icon: FileSearch, titleKey: "tour.admin.s4.title", bodyKey: "tour.admin.s4.body" },
        { view: "approvals", target: null, icon: ClipboardCheck, titleKey: "tour.admin.s5.title", bodyKey: "tour.admin.s5.body" },
      ];

    case "reviewer":
      return [
        { view: "dashboard", target: "[data-tour='queue']", icon: ListOrdered, titleKey: "tour.reviewer.s1.title", bodyKey: "tour.reviewer.s1.body" },
        { view: "knowledge", target: null, icon: Database, titleKey: "tour.reviewer.s2.title", bodyKey: "tour.reviewer.s2.body" },
        { view: "findings", target: null, icon: FileSearch, titleKey: "tour.reviewer.s3.title", bodyKey: "tour.reviewer.s3.body" },
        { view: "findings", target: null, icon: Wand2, titleKey: "tour.reviewer.s4.title", bodyKey: "tour.reviewer.s4.body" },
        { view: "approvals", target: null, icon: ClipboardCheck, titleKey: "tour.reviewer.s5.title", bodyKey: "tour.reviewer.s5.body" },
      ];

    case "creator":
      return [
        { view: "dashboard", target: "[data-tour='composer']", icon: PenLine, titleKey: "tour.creator.s1.title", bodyKey: "tour.creator.s1.body" },
        { view: "scanner", target: null, icon: ScanSearch, titleKey: "tour.creator.s2.title", bodyKey: "tour.creator.s2.body" },
        { view: "findings", target: null, icon: FileSearch, titleKey: "tour.creator.s3.title", bodyKey: "tour.creator.s3.body" },
        { view: "approvals", target: null, icon: ClipboardCheck, titleKey: "tour.creator.s4.title", bodyKey: "tour.creator.s4.body" },
        { view: "copilot", target: null, icon: Sparkles, titleKey: "tour.creator.s5.title", bodyKey: "tour.creator.s5.body" },
      ];

    case "contractor":
      return [
        { view: "dashboard", target: "[data-tour='sandbox-hero']", icon: Lock, titleKey: "tour.contractor.s1.title", bodyKey: "tour.contractor.s1.body" },
        { view: "knowledge", target: null, icon: Database, titleKey: "tour.contractor.s2.title", bodyKey: "tour.contractor.s2.body" },
        { view: "scanner", target: null, icon: ScanSearch, titleKey: "tour.contractor.s3.title", bodyKey: "tour.contractor.s3.body" },
        { view: "findings", target: null, icon: FileSearch, titleKey: "tour.contractor.s4.title", bodyKey: "tour.contractor.s4.body" },
        { view: "analytics", target: null, icon: BarChart3, titleKey: "tour.contractor.s5.title", bodyKey: "tour.contractor.s5.body" },
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
  const { t, lang } = useLang();
  const session = useSession();
  const tourStateQuery = useTourState();
  const updateTourState = useUpdateTourState();

  const [stepIndex, setStepIndex] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const hasHydratedRef = useRef(false);

  // Detect mobile viewport (breakpoint aligned with mobile bottom nav at md)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const steps = useMemo(() => buildSteps(role), [role]);
  const isLast = stepIndex === steps.length;
  const total = steps.length;
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const roleLabel = t(`common.role.${role}`);

  // Restore step from database on initial mount only once (prevents tour from repeatedly popping up)
  useEffect(() => {
    if (!tourStateQuery.data || hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    const s = tourStateQuery.data;

    const isDismissed =
      typeof window !== "undefined" &&
      (sessionStorage.getItem("brandshield:tour-dismissed") === "true" ||
        localStorage.getItem("brandshield:tour-dismissed") === "true");

    if (isDismissed) return;

    if (s.completed || s.dismissed || s.paused) {
      // User has already completed, dismissed, or paused the tour — do not re-show automatically
      if (typeof window !== "undefined") {
        localStorage.setItem("brandshield:tour-dismissed", "true");
        sessionStorage.setItem("brandshield:tour-dismissed", "true");
      }
      return;
    }

    const timer = setTimeout(() => {
      if (typeof s.stepIndex === "number" && s.stepIndex > 0) {
        setStepIndex(s.stepIndex);
        setTourOpen(true);
      } else if (s.stepIndex === 0 && !tourOpen) {
        setShowWelcome(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [tourStateQuery.data, tourOpen, setTourOpen]);

  // Save progress to DB when stepIndex changes
  const saveStepToDb = useCallback(
    (index: number, completed = false, paused = false, dismissed = false, reset = false) => {
      updateTourState.mutate({
        stepIndex: index,
        completed,
        paused,
        dismissed,
        reset,
      });
    },
    [updateTourState]
  );

  const finish = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("brandshield:tour-dismissed", "true");
      localStorage.setItem("brandshield:tour-dismissed", "true");
    }
    saveStepToDb(steps.length, true, false, false);
    setTourOpen(false);
    setShowWelcome(false);
    setView("dashboard");
    toast.success(t("tour.allSet"));
  }, [steps.length, saveStepToDb, setTourOpen, setView, t]);

  const pauseTour = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("brandshield:tour-dismissed", "true");
      localStorage.setItem("brandshield:tour-dismissed", "true");
    }
    setShowWelcome(false);
    setTourOpen(false);
    saveStepToDb(stepIndex, false, true, false);
    toast.info(lang === "hi" ? "टूर रोक दिया गया है। हेडर से कभी भी फिर शुरू करें।" : "Tour paused. Resume anytime from the Tour button in the header.");
  }, [stepIndex, saveStepToDb, setTourOpen, lang]);

  const skipTour = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("brandshield:tour-dismissed", "true");
      localStorage.setItem("brandshield:tour-dismissed", "true");
    }
    setShowWelcome(false);
    setTourOpen(false);
    saveStepToDb(stepIndex, false, false, true);
  }, [stepIndex, saveStepToDb, setTourOpen]);

  const startTour = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("brandshield:tour-dismissed");
      localStorage.removeItem("brandshield:tour-dismissed");
    }
    setShowWelcome(false);
    setStepIndex(0);
    setTourOpen(true);
    saveStepToDb(0, false, false, false);
  }, [setTourOpen, saveStepToDb]);

  const restartTour = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("brandshield:tour-dismissed");
      localStorage.removeItem("brandshield:tour-dismissed");
    }
    setStepIndex(0);
    setShowWelcome(false);
    setTourOpen(true);
    updateTourState.mutate({ reset: true });
    toast.info(lang === "hi" ? "टूर रीसेट हो गया है।" : "Tour reset. Starting fresh from onboarding.");
  }, [setTourOpen, updateTourState, lang]);

  // Listen for shell trigger
  useEffect(() => {
    const handler = () => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("brandshield:tour-dismissed");
        localStorage.removeItem("brandshield:tour-dismissed");
      }
      setStepIndex(0);
      setShowWelcome(false);
      setTourOpen(true);
    };
    window.addEventListener("brandshield:start-tour", handler);
    return () => window.removeEventListener("brandshield:start-tour", handler);
  }, [setTourOpen]);

  // Navigate to step view and spotlight target
  useEffect(() => {
    if (!tourOpen) return;
    if (!isLast && view !== step.view) {
      setView(step.view);
    }
    // Mobile optimization: skip DOM queries and scrolling to maximize touch response time
    if (isMobile) return;
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
        const fullyVisible = r.top >= 80 && r.bottom <= window.innerHeight - 80;
        if (!fullyVisible && !scrolled && tries < 30) {
          scrolled = true;
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          raf = window.requestAnimationFrame(tick);
          return;
        }
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else if (tries < 50) {
        raf = window.requestAnimationFrame(tick);
      } else {
        setRect(null);
      }
    };

    const timeout = window.setTimeout(
      () => {
        setRect(null);
        if (!isLast && step.target) tick();
      },
      isLast || !step.target ? 0 : 380
    );

    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(raf);
    };
  }, [tourOpen, stepIndex, isLast, step, view, setView, isMobile]);

  // Sticky spotlight on scroll/resize (desktop only; skips mobile to maximize response time)
  useLayoutEffect(() => {
    if (!tourOpen || isLast || isMobile) return;
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
  }, [tourOpen, isLast, isMobile, step]);

  // Keyboard navigation: Escape skips/pauses, ArrowRight goes next, ArrowLeft goes back
  useEffect(() => {
    if (!tourOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") pauseTour();
      else if (e.key === "ArrowRight") {
        if (!isLast) {
          setStepIndex((i) => {
            const next = Math.min(i + 1, total - 1);
            saveStepToDb(next);
            return next;
          });
        }
      } else if (e.key === "ArrowLeft") {
        setStepIndex((i) => {
          const prev = Math.max(i - 1, 0);
          saveStepToDb(prev);
          return prev;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourOpen, isLast, total, pauseTour, saveStepToDb]);

  const next = () => {
    if (isLast) {
      finish();
    } else {
      setStepIndex((i) => {
        const n = Math.min(i + 1, total - 1);
        saveStepToDb(n);
        return n;
      });
    }
  };

  const back = () => {
    setStepIndex((i) => {
      const p = Math.max(i - 1, 0);
      saveStepToDb(p);
      return p;
    });
  };

  // Card positioning logic (desktop only)
  const hugeTarget = rect ? rect.height > window.innerHeight - 260 : false;
  const cardBelow = rect ? rect.top + rect.height + 16 < window.innerHeight - 240 : true;
  const cardStyle: React.CSSProperties | undefined =
    !isMobile && rect
      ? {
          position: "absolute",
          top: hugeTarget ? Math.max(84, rect.top + 16) : cardBelow ? rect.top + rect.height + 14 : undefined,
          bottom: !hugeTarget && !cardBelow ? window.innerHeight - rect.top + 14 : undefined,
          left: Math.max(16, Math.min(rect.left + rect.width / 2 - 205, window.innerWidth - 426)),
          zIndex: 50,
        }
      : !isMobile && !rect
      ? { position: "absolute", zIndex: 50 }
      : undefined;

  // 1. First-Time Welcome Modal
  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center bg-slate-950/65 p-3 sm:p-4 backdrop-blur-sm pb-[max(16px,env(safe-area-inset-bottom))]">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
              <ShieldCheck className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 break-words">{t("tour.welcome.title")}</h2>
              <p className="text-xs font-semibold text-emerald-700 truncate">
                {t("tour.welcome.roleLabel")}: <span className="font-bold uppercase tracking-wider">{roleLabel}</span>
              </p>
            </div>
          </div>

          <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-slate-600 break-words font-normal">
            {t("tour.welcome.tagline")}
          </p>

          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Sparkles className="size-3.5 shrink-0" />
              <span>{t("tour.welcome.permissionsTitle")}</span>
            </p>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-emerald-950/90 font-medium break-words">
              {t(`tour.perm.${role}`)}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="min-h-[42px] px-3 text-xs sm:text-sm text-slate-500 hover:text-slate-800"
            >
              {t("tour.welcome.skipCta")}
            </Button>
            <Button
              onClick={startTour}
              className="min-h-[46px] px-6 gap-2.5 rounded-xl bg-[#16a34a] text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-green-600/35 hover:bg-[#15803d] active:bg-[#166534] ring-2 ring-[#22c55e]/70 transition-all cursor-pointer"
            >
              <Play className="size-4 fill-white text-white stroke-[2.5]" />
              <span className="text-white font-extrabold tracking-wide">{t("tour.welcome.cta")}</span>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!tourOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={t("tour.aria.dialog")}>
      {/* Spotlight highlight over targeted element */}
      {rect && !isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
          transition={{ type: "spring", stiffness: 340, damping: 32 }}
          className="pointer-events-none absolute z-20 rounded-xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)] ring-4 ring-emerald-500/20"
        >
          <motion.span
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <GraduationCap className="size-3.5" />
          </motion.span>
        </motion.div>
      )}

      {/* Dimmed backdrop when centered or on mobile */}
      {(!rect || isMobile) && <div className="absolute inset-0 z-20 bg-slate-950/65 backdrop-blur-[2px]" />}

      {/* Tour Tooltip Card / Mobile Bottom Sheet — GUARANTEED Z-50+ ABOVE SPOTLIGHT AND SHADOW */}
      <div
        className={cn(
          isMobile
            ? "fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 pb-[max(16px,env(safe-area-inset-bottom))] pointer-events-auto"
            : "absolute z-50 w-[410px] max-w-[calc(100vw-32px)] pointer-events-auto",
          !rect && !isMobile && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        style={cardStyle}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, y: isMobile ? 18 : 10, scale: isMobile ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isMobile ? 18 : -8, scale: isMobile ? 1 : 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-lg mx-auto rounded-2xl sm:rounded-3xl border-2 border-emerald-500/25 bg-white p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.08)] ring-1 ring-black/5"
          >
            {/* Grab handle for mobile touch bottom sheet */}
            {isMobile && (
              <div className="mx-auto -mt-1 mb-3 h-1 w-10 rounded-full bg-slate-300/80" />
            )}

            {/* Header with Icon, Step Counter, and Close/Pause */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-1 min-w-0 items-start gap-3">
                <span className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70">
                  {isLast ? <PartyPopper className="size-4.5 sm:size-5" /> : <step.icon className="size-4.5 sm:size-5" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700">
                    {isLast ? t("tour.allSet") : t("tour.stepCounter", { x: stepIndex + 1, y: total })}
                  </p>
                  <h3 className="mt-0.5 text-sm sm:text-base font-bold text-slate-900 leading-snug break-words">
                    {isLast ? t("tour.complete.title") : t(step.titleKey, { role: roleLabel })}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={pauseTour}
                  title={t("tour.btn.pause")}
                  className="rounded-lg p-1.5 sm:p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <Pause className="size-3.5 sm:size-4" />
                </button>
                <button
                  type="button"
                  onClick={skipTour}
                  aria-label={t("tour.aria.skip")}
                  className="rounded-lg p-1.5 sm:p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Step Body - readable, smooth line wrapping without broken words */}
            <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 break-words font-normal">
              {isLast
                ? t(`tour.${role}.done.body`, { role: roleLabel })
                : t(step.bodyKey, { role: roleLabel })}
            </p>

            {/* Progress Bar & Dots */}
            <div className="mt-3.5 sm:mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-slate-400">
                <span>{roleLabel} Tour</span>
                <span>{Math.round(((stepIndex + (isLast ? 0 : 1)) / total) * 100)}%</span>
              </div>
              <Progress value={Math.min(100, Math.round(((stepIndex + (isLast ? 0 : 1)) / total) * 100))} className="h-1.5 sm:h-2 bg-slate-100" />
            </div>

            {/* Action Buttons with Vibrant Glowing Emerald Green CTA */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:pt-3.5">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={pauseTour}
                  className="min-h-9 px-2.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  {t("tour.btn.pause")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={restartTour}
                  className="min-h-9 px-2 text-slate-500 hover:text-slate-800"
                  title="Restart from beginning"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {stepIndex > 0 && !isLast && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={back}
                    className="min-h-9 sm:min-h-10 px-3 sm:px-4 gap-1.5 rounded-xl text-xs sm:text-sm font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>{t("tour.btn.back")}</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={next}
                  className="min-h-11 px-6 sm:px-7 gap-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white font-black text-sm tracking-wide shadow-[0_4px_16px_rgba(22,163,74,0.55)] ring-2 ring-[#22c55e] transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: "#16a34a" }}
                >
                  <span className="text-white font-black tracking-wide text-sm drop-shadow-sm">
                    {isLast ? t("tour.btn.finish") : stepIndex === 0 ? t("tour.btn.go") : t("tour.btn.next")}
                  </span>
                  {isLast ? (
                    <CheckCircle2 className="size-4.5 text-white stroke-[3] drop-shadow-sm" />
                  ) : (
                    <ArrowRight className="size-4.5 text-white stroke-[3] drop-shadow-sm" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Guided Tasks Checklist Component ────────────────────────────────────────

const ROLE_TASKS: Record<Role, { id: string; targetView: ViewKey }[]> = {
  admin: [
    { id: "admin_configure_org", targetView: "knowledge" },
    { id: "admin_add_team", targetView: "settings" },
    { id: "admin_review_compliance", targetView: "dashboard" },
  ],
  reviewer: [
    { id: "reviewer_review_critical", targetView: "findings" },
    { id: "reviewer_inspect_evidence", targetView: "findings" },
    { id: "reviewer_complete_approval", targetView: "approvals" },
  ],
  creator: [
    { id: "creator_upload_asset", targetView: "scanner" },
    { id: "creator_run_scan", targetView: "scanner" },
    { id: "creator_submit_approval", targetView: "findings" },
  ],
  contractor: [
    { id: "contractor_review_audit", targetView: "approvals" },
    { id: "contractor_inspect_evidence", targetView: "findings" },
    { id: "contractor_export_report", targetView: "analytics" },
  ],
};

export function GuidedTasksCard({ role }: { role: Role }) {
  const { t } = useLang();
  const setView = useUIStore((s) => s.setView);
  const tourStateQuery = useTourState();
  const tasks = ROLE_TASKS[role] ?? [];

  const liveStatus = tourStateQuery.data?.liveTaskStatus ?? {};
  const completedCount = tasks.filter((task) => liveStatus[task.id]).length;
  const allDone = tasks.length > 0 && completedCount === tasks.length;

  return (
    <Card className="overflow-hidden border-teal-100 bg-gradient-to-br from-teal-50/40 via-white to-white shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-teal-100/70 text-teal-800">
                <CheckCircle2 className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{t("tour.tasks.title")}</h3>
              <Badge variant="outline" className="border-teal-200 bg-teal-50 text-[10px] font-bold text-teal-800">
                {t("tour.tasks.completed", { done: completedCount, total: tasks.length })}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">{t("tour.tasks.subtitle")}</p>
          </div>
          <Progress value={(completedCount / Math.max(1, tasks.length)) * 100} className="h-2 w-full bg-slate-100 sm:w-48" />
        </div>

        {allDone ? (
          <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs font-semibold text-emerald-800">
            <Sparkles className="size-4 shrink-0 text-emerald-600" />
            <span>{t("tour.tasks.allComplete")}</span>
          </div>
        ) : (
          <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {tasks.map((task) => {
              const isComplete = !!liveStatus[task.id];
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex flex-col justify-between rounded-xl border p-3 text-left transition",
                    isComplete
                      ? "border-emerald-200 bg-emerald-50/40 text-emerald-950"
                      : "border-slate-200/80 bg-white hover:border-teal-300 hover:shadow-sm"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {isComplete ? "Completed" : "Action Required"}
                      </span>
                      {isComplete ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <span className="size-2 rounded-full bg-teal-600" />
                      )}
                    </div>
                    <h4 className="mt-1 text-xs font-semibold text-slate-900">
                      {t(`tour.task.${task.id}.title`)}
                    </h4>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">
                      {t(`tour.task.${task.id}.desc`)}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant={isComplete ? "ghost" : "outline"}
                    onClick={() => setView(task.targetView)}
                    className={cn(
                      "mt-2.5 h-7 w-full gap-1 rounded-lg text-[11px] font-medium",
                      isComplete
                        ? "text-emerald-700 hover:bg-emerald-100/60"
                        : "border-teal-200 text-teal-800 hover:bg-teal-50"
                    )}
                  >
                    <span>{isComplete ? "View Result" : "Start Task"}</span>
                    <ChevronRight className="size-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
