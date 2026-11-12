"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Gauge,
  Hourglass,
  Image as ImageIcon,
  Info,
  Lightbulb,
  Loader2,
  PartyPopper,
  PenLine,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  Type,
  Undo2,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSubmission, useScanSubmission, useSession, useSubmissions, useSubscription } from "@/lib/brandshield/client";
import { useLang } from "@/lib/brandshield/i18n";
import { useUIStore, type ViewKey } from "@/lib/brandshield/store";
import { cn, timeAgo } from "@/lib/brandshield/utils";
import { SEVERITY_META, STATUS_META, type Severity, type SubmissionStatus } from "@/lib/brandshield/types";
import { WorkflowCard } from "@/components/brandshield/workflow-card";
import { GuidedTasksCard } from "@/components/brandshield/demo-tour";

// ─── Content Studio — creator landing dashboard (teal identity) ──────────────
// Focus: draft → scan → fix → submit. Structurally distinct from the Review
// Desk: inline composer + clickable pipeline + personal compliance rail.

const TIP_KEYS = [
  "dash.creator.tips.1",
  "dash.creator.tips.2",
  "dash.creator.tips.3",
] as const;

const PIPELINE_CARDS: { status: SubmissionStatus; icon: LucideIcon; view: ViewKey }[] = [
  { status: "draft", icon: PenLine, view: "scanner" },
  { status: "in_review", icon: Hourglass, view: "approvals" },
  { status: "changes_requested", icon: Undo2, view: "findings" },
  { status: "approved", icon: BadgeCheck, view: "approvals" },
];

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, warning: 1, minor: 2 };

export function CreatorDashboard() {
  const { t, lang } = useLang();
  const session = useSession();
  const submissions = useSubmissions();
  const subscription = useSubscription();
  const setView = useUIStore((s) => s.setView);
  const openSubmission = useUIStore((s) => s.openSubmission);
  const createSub = useCreateSubmission();
  const scanSub = useScanSubmission();

  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"copy" | "banner">("copy");
  const [content, setContent] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const user = session.data;
  const mine = useMemo(
    () => (submissions.data ?? []).filter((s) => s.authorId === user?.id),
    [submissions.data, user?.id]
  );

  const busy = createSub.isPending || scanSub.isPending;

  const counts = useMemo(() => {
    const c: Record<SubmissionStatus, number> = { draft: 0, in_review: 0, changes_requested: 0, approved: 0 };
    for (const s of mine) c[s.status] += 1;
    return c;
  }, [mine]);

  const attention = useMemo(() => {
    return mine
      .flatMap((s) => (s.findings ?? []).filter((f) => f.status === "open").map((f) => ({ f, submission: s })))
      .sort(
        (a, b) =>
          SEVERITY_RANK[a.f.severity] - SEVERITY_RANK[b.f.severity] ||
          +new Date(b.f.createdAt) - +new Date(a.f.createdAt)
      )
      .slice(0, 6);
  }, [mine]);

  const scored = mine.filter((s) => s.complianceScore !== null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((a, s) => a + (s.complianceScore ?? 0), 0) / scored.length)
    : null;

  const sub = subscription.data;

  function focusComposer() {
    titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    titleRef.current?.focus({ preventScroll: true });
  }

  function handleScan() {
    if (!user || busy || !title.trim() || !content.trim()) return;
    createSub.mutate(
      {
        title: title.trim(),
        contentType: mode === "banner" ? "banner" : "text",
        content,
        department: user.department ?? undefined,
      },
      {
        onSuccess: (created) => {
          toast.success(t("dash.creator.composer.created"));
          scanSub.mutate(created.id, {
            onSuccess: () => {
              setTitle("");
              setContent("");
              openSubmission(created.id, "findings");
            },
            onError: () => {
              toast.error(t("dash.creator.composer.errorScan"));
              openSubmission(created.id, "findings");
            },
          });
        },
        onError: () => toast.error(t("dash.creator.composer.errorCreate")),
      }
    );
  }

  if (!user) return null; // RoleDashboard guarantees a session

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
      {/* 1 · Welcome hero — teal identity */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="overflow-hidden border-teal-100 bg-gradient-to-br from-teal-50/80 via-white to-white">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700/70">
                {t("dash.creator.studio")} · {user.orgName}
              </p>
              <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                {t("dash.creator.welcome", { name: user.name.split(" ")[0] })}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-slate-500">{t("dash.creator.hero.sub")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {user.zeroDataRetention && (
                <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> {t("dash.creator.hero.zdr")}
                </Badge>
              )}
              <Button
                onClick={() => setView("scanner")}
                className="min-h-11 gap-2 bg-teal-700 px-5 hover:bg-teal-800"
              >
                <ScanSearch className="h-4 w-4" /> {t("dash.creator.hero.cta")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2 · 7-Stage Brand Governance Lifecycle */}
      <WorkflowCard />

      {/* 2.5 · Guided First-Time Tasks */}
      <GuidedTasksCard role="creator" />

      {/* 3 · Draft Composer — signature feature */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <Card data-tour="composer" className="border-teal-100">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <PenLine className="h-4 w-4 text-teal-700" /> {t("dash.creator.composer.title")}
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">{t("dash.creator.composer.sub")}</p>
              </div>
              <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5" role="group">
                {(
                  [
                    { key: "copy" as const, icon: Type },
                    { key: "banner" as const, icon: ImageIcon },
                  ]
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    aria-pressed={mode === opt.key}
                    onClick={() => setMode(opt.key)}
                    className={cn(
                      "flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-all",
                      mode === opt.key ? "bg-teal-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                    {t(`dash.creator.composer.type.${opt.key}`)}
                  </button>
                ))}
              </div>
            </div>

            {mode === "banner" && (
              <p className="mb-3 flex items-start gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                {t("dash.creator.composer.bannerNote")}
              </p>
            )}

            <div className="space-y-3">
              <Input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("dash.creator.composer.titlePlaceholder")}
                className="min-h-11"
                maxLength={120}
              />
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("dash.creator.composer.contentPlaceholder")}
                className="min-h-[120px] resize-y"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleScan}
                  disabled={busy || !title.trim() || !content.trim()}
                  className="min-h-11 gap-2 bg-teal-700 px-5 hover:bg-teal-800"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {busy ? t("dash.creator.composer.scanning") : t("dash.creator.composer.scan")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3 · My pipeline — 4 clickable stage cards */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <div data-tour="pipeline">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-1">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Workflow className="h-4 w-4 text-teal-700" /> {t("dash.creator.pipeline.title")}
            </h2>
            <span className="text-xs text-slate-400">{t("dash.creator.pipeline.sub")}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PIPELINE_CARDS.map((c, i) => (
              <motion.button
                key={c.status}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                onClick={() => setView(c.view)}
                className="min-h-11 text-left"
              >
                <Card className="h-full transition hover:border-teal-200 hover:shadow-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                        STATUS_META[c.status].className
                      )}
                    >
                      <c.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xl font-bold leading-none text-slate-900">{counts[c.status]}</span>
                      <span className="mt-1 block truncate text-xs font-medium text-slate-500">
                        {t(`common.status.${c.status}`)}
                      </span>
                    </span>
                  </CardContent>
                </Card>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 4 · Attention feed + personal rail */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* LEFT — Needs your attention */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="min-w-0 lg:col-span-2"
        >
          <Card data-tour="attention" className="h-full">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-1">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Target className="h-4 w-4 text-teal-700" /> {t("dash.creator.attention.title")}
                </h2>
                <span className="text-xs text-slate-400">{t("dash.creator.attention.sub")}</span>
              </div>

              {attention.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <PartyPopper className="h-8 w-8 text-teal-300" />
                  <p className="text-sm font-medium text-slate-700">{t("dash.creator.attention.empty.title")}</p>
                  <p className="max-w-xs text-xs text-slate-400">{t("dash.creator.attention.empty.body")}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={focusComposer}
                    className="min-h-9 gap-2 border-teal-200 text-teal-700 hover:bg-teal-50"
                  >
                    <PenLine className="h-3.5 w-3.5" /> {t("dash.creator.attention.empty.cta")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {attention.map(({ f, submission }) => (
                    <button
                      key={f.id}
                      onClick={() => openSubmission(submission.id, "findings")}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 text-left transition hover:border-teal-200 hover:bg-teal-50/40"
                    >
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", SEVERITY_META[f.severity].dot)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">{f.flaggedText}</span>
                        <span className="block truncate text-xs text-slate-400">
                          {t(`common.category.${f.category}`)} · {submission.title} · {timeAgo(f.createdAt, lang)}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* RIGHT — personal rail */}
        <div className="min-w-0 space-y-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
            <Card className="h-full">
              <CardContent className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Gauge className="h-4 w-4 text-teal-700" /> {t("dash.creator.compliance.title")}
                </h2>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <p className="text-3xl font-bold tracking-tight text-slate-900">
                    {avgScore !== null ? t("common.score.of100", { score: avgScore }) : "—"}
                  </p>
                </div>
                <Progress value={avgScore ?? 0} className="mt-3 h-2" />
                <p
                  className={cn(
                    "mt-2 text-xs font-semibold",
                    avgScore === null ? "text-slate-400" : avgScore >= 85 ? "text-emerald-600" : "text-amber-600"
                  )}
                >
                  {avgScore === null
                    ? t("dash.creator.compliance.noData")
                    : avgScore >= 85
                      ? t("dash.creator.compliance.strong")
                      : t("dash.creator.compliance.needsCare")}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card className="h-full">
              <CardContent className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Zap className="h-4 w-4 text-teal-700" /> {t("dash.creator.scans.title")}
                </h2>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-2xl font-bold tracking-tight text-slate-900">
                    {sub ? (sub.scanLimit === -1 ? `${sub.scansUsed}` : `${sub.scansUsed}/${sub.scanLimit}`) : "—"}
                  </p>
                  {sub?.scanLimit === -1 && (
                    <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-700">
                      {t("dash.creator.scans.unlimited")}
                    </Badge>
                  )}
                </div>
                {sub && sub.scanLimit !== -1 && (
                  <>
                    <Progress value={(sub.scansUsed / sub.scanLimit) * 100} className="mt-3 h-2" />
                    <p className="mt-2 text-xs text-slate-400">
                      {t("dash.creator.scans.left", { left: Math.max(0, sub.scanLimit - sub.scansUsed) })}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
            <Card className="h-full">
              <CardContent className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Lightbulb className="h-4 w-4 text-amber-500" /> {t("dash.creator.tips.title")}
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {TIP_KEYS.map((key) => (
                    <li key={key} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span>{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
