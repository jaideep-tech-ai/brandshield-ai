"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HelpCircle,
  Search,
  X,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Sliders,
  GitBranch,
  Blocks,
  FileSearch,
  ExternalLink,
  GraduationCap,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/brandshield/utils";
import { useLang } from "@/lib/brandshield/i18n";
import "@/lib/brandshield/i18n/dict-help";

export type GuideKey =
  | "overview"
  | "roles"
  | "scanner"
  | "findings"
  | "approvals"
  | "gitlab"
  | "extensions"
  | "guidelines"
  | "copilot"
  | "security";

export interface GuideMeta {
  key: GuideKey;
  catKey: string;
  readMinutes: number;
  icon: typeof BookOpen;
  targetView?: string;
}

export const GUIDES: GuideMeta[] = [
  { key: "overview", catKey: "cat.platform", readMinutes: 3, icon: ShieldCheck, targetView: "dashboard" },
  { key: "roles", catKey: "cat.governance", readMinutes: 4, icon: Sliders, targetView: "dashboard" },
  { key: "scanner", catKey: "cat.tools", readMinutes: 4, icon: FileSearch, targetView: "scanner" },
  { key: "findings", catKey: "cat.review", readMinutes: 4, icon: ShieldAlert, targetView: "findings" },
  { key: "approvals", catKey: "cat.workflow", readMinutes: 3, icon: CheckCircle2, targetView: "approvals" },
  { key: "gitlab", catKey: "cat.integrations", readMinutes: 5, icon: GitBranch, targetView: "integrations" },
  { key: "extensions", catKey: "cat.integrations", readMinutes: 3, icon: Blocks, targetView: "integrations" },
  { key: "guidelines", catKey: "cat.knowledge", readMinutes: 4, icon: Layers, targetView: "knowledge" },
  { key: "copilot", catKey: "cat.ai", readMinutes: 4, icon: Sparkles, targetView: "copilot" },
  { key: "security", catKey: "cat.security", readMinutes: 3, icon: ShieldCheck, targetView: "analytics" },
];

/** Open the Help Center programmatically to an optional specific guide */
export function openHelpCenter(guideKey?: GuideKey) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("brandshield:open-help", {
        detail: { guideKey },
      })
    );
  }
}

/** Hook to easily trigger Help Center from any page */
export function useHelpCenter() {
  const openHelp = useCallback((guideKey?: GuideKey) => {
    openHelpCenter(guideKey);
  }, []);
  return { openHelp };
}

/** Contextual "Need help?" button for embedding inside page headers */
export function ContextualHelpButton({
  guideKey,
  labelKey,
  className,
}: {
  guideKey: GuideKey;
  labelKey?: string;
  className?: string;
}) {
  const { t } = useLang();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => openHelpCenter(guideKey)}
      className={cn(
        "min-h-9 gap-1.5 rounded-lg border-teal-200 bg-teal-50/50 text-xs font-semibold text-teal-800 transition hover:bg-teal-100/70 hover:text-teal-900",
        className
      )}
    >
      <HelpCircle className="size-3.5 text-teal-600" />
      <span>{labelKey ? t(labelKey) : t("help.needHelp.btn")}</span>
    </Button>
  );
}

export function HelpCenterModal({
  onNavigate,
}: {
  onNavigate?: (view: string) => void;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [activeGuide, setActiveGuide] = useState<GuideKey>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");

  useEffect(() => {
    function handleOpen(e: Event) {
      const custom = e as CustomEvent<{ guideKey?: GuideKey }>;
      if (custom.detail?.guideKey) {
        setActiveGuide(custom.detail.guideKey);
      }
      setOpen(true);
    }
    window.addEventListener("brandshield:open-help", handleOpen);
    return () => window.removeEventListener("brandshield:open-help", handleOpen);
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(GUIDES.map((g) => g.catKey));
    return ["all", ...Array.from(cats)];
  }, []);

  const filteredGuides = useMemo(() => {
    return GUIDES.filter((g) => {
      if (selectedCat !== "all" && g.catKey !== selectedCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = t(`help.guide.${g.key}.title`).toLowerCase();
      const summary = t(`help.guide.${g.key}.summary`).toLowerCase();
      const s1 = t(`help.guide.${g.key}.section1Body`).toLowerCase();
      const s2 = t(`help.guide.${g.key}.section2Body`).toLowerCase();
      const s3 = t(`help.guide.${g.key}.section3Body`).toLowerCase();
      return (
        title.includes(q) ||
        summary.includes(q) ||
        s1.includes(q) ||
        s2.includes(q) ||
        s3.includes(q)
      );
    });
  }, [selectedCat, searchQuery, t]);

  const currentMeta = useMemo(() => {
    return GUIDES.find((g) => g.key === activeGuide) || GUIDES[0];
  }, [activeGuide]);

  const startTour = useCallback(() => {
    setOpen(false);
    window.dispatchEvent(new Event("brandshield:start-tour"));
  }, []);

  const handleJump = useCallback(
    (view?: string) => {
      if (!view) return;
      setOpen(false);
      if (onNavigate) {
        onNavigate(view);
      }
    },
    [onNavigate]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden sm:rounded-2xl max-h-[90vh] flex flex-col border-slate-200">
        <DialogHeader className="p-4 sm:p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-xs">
                <BookOpen className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {t("help.modal.title")}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                  {t("help.modal.desc")}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={startTour}
                className="hidden sm:inline-flex gap-1.5 text-xs font-semibold text-teal-800 border-teal-200 bg-teal-50/50 hover:bg-teal-100"
              >
                <GraduationCap className="size-3.5" />
                <span>{t("help.modal.takeTourCta")}</span>
              </Button>
            </div>
          </div>

          {/* Search bar & Category filters */}
          <div className="mt-3.5 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder={t("help.modal.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs sm:text-sm bg-slate-50/60 border-slate-200 focus-visible:ring-teal-600/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              {categories.map((cat) => {
                const isAll = cat === "all";
                const label = isAll ? t("help.modal.allCategories") : t(`help.${cat}`);
                const active = selectedCat === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCat(cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-full whitespace-nowrap font-medium text-xs transition min-h-[30px]",
                      active
                        ? "bg-teal-700 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </DialogHeader>

        {/* Two-column layout: left guide list, right guide reader */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 bg-slate-50/50">
          {/* Guide list column */}
          <div className="md:col-span-4 border-r border-slate-200/80 bg-white overflow-y-auto max-h-[220px] md:max-h-[560px] p-2 space-y-1">
            {filteredGuides.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                <p className="font-semibold text-slate-700">{t("help.modal.noResults")}</p>
                <p className="mt-1 text-slate-400">{t("help.modal.noResultsHint")}</p>
              </div>
            ) : (
              filteredGuides.map((guide) => {
                const active = guide.key === activeGuide;
                const Icon = guide.icon;
                return (
                  <button
                    key={guide.key}
                    type="button"
                    onClick={() => setActiveGuide(guide.key)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl transition flex items-center gap-2.5 group min-h-[44px]",
                      active
                        ? "bg-teal-50/80 text-teal-900 border border-teal-200/70 shadow-xs"
                        : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg transition",
                        active
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 text-slate-700 group-hover:text-slate-900"
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold truncate">
                          {t(`help.guide.${guide.key}.title`)}
                        </span>
                        <ChevronRight
                          className={cn(
                            "size-3.5 shrink-0 transition",
                            active ? "text-teal-700 translate-x-0.5" : "text-slate-300"
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                        <span>{t(`help.${guide.catKey}`)}</span>
                        <span>•</span>
                        <span>{t("help.modal.readingTime", { m: guide.readMinutes })}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Guide reader column */}
          <div className="md:col-span-8 overflow-y-auto max-h-[340px] md:max-h-[560px] p-4 sm:p-6 bg-white space-y-5">
            {/* Guide Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-teal-50 text-teal-800 border-teal-200/80 text-[11px] font-semibold"
                >
                  {t(`help.${currentMeta.catKey}`)}
                </Badge>
                <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Clock className="size-3" />
                  {t("help.modal.readingTime", { m: currentMeta.readMinutes })}
                </span>
                {currentMeta.targetView && onNavigate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleJump(currentMeta.targetView)}
                    className="ml-auto text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 h-7 px-2 font-medium gap-1"
                  >
                    <span>{t("help.modal.jumpTo")}</span>
                    <ExternalLink className="size-3" />
                  </Button>
                )}
              </div>
              <h3 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight mt-2">
                {t(`help.guide.${currentMeta.key}.title`)}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                {t(`help.guide.${currentMeta.key}.summary`)}
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {/* Section 1 */}
              <div className="p-3.5 rounded-xl border border-slate-200/70 bg-white shadow-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold">
                    1
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {t(`help.guide.${currentMeta.key}.section1Title`)}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">
                  {t(`help.guide.${currentMeta.key}.section1Body`)}
                </p>
              </div>

              {/* Section 2 */}
              <div className="p-3.5 rounded-xl border border-slate-200/70 bg-white shadow-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold">
                    2
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {t(`help.guide.${currentMeta.key}.section2Title`)}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">
                  {t(`help.guide.${currentMeta.key}.section2Body`)}
                </p>
              </div>

              {/* Section 3 */}
              <div className="p-3.5 rounded-xl border border-slate-200/70 bg-white shadow-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold">
                    3
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {t(`help.guide.${currentMeta.key}.section3Title`)}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">
                  {t(`help.guide.${currentMeta.key}.section3Body`)}
                </p>
              </div>

              {/* Section 4 (if available for roles) */}
              {currentMeta.key === "roles" && (
                <div className="p-3.5 rounded-xl border border-slate-200/70 bg-white shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold">
                      4
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {t(`help.guide.roles.section4Title`)}
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">
                    {t(`help.guide.roles.section4Body`)}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={startTour}
                className="gap-1.5 text-xs text-slate-700 min-h-[38px]"
              >
                <GraduationCap className="size-4 text-teal-600" />
                <span>{t("help.modal.takeTourCta")}</span>
              </Button>

              {currentMeta.targetView && onNavigate && (
                <Button
                  size="sm"
                  onClick={() => handleJump(currentMeta.targetView)}
                  className="gap-1.5 text-xs bg-teal-700 text-white hover:bg-teal-800 min-h-[38px]"
                >
                  <span>{t("help.modal.jumpTo")}</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
