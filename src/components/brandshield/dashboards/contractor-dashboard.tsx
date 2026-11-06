"use client";

import { motion } from "framer-motion";
import {
  PlayCircle,
  ClipboardPaste,
  Zap,
  Wrench,
  ArrowRight,
  ShieldCheck,
  FlaskConical,
  TriangleAlert,
  BookOpenText,
  Sparkles,
  History,
  ScanSearch,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSession, useSubmissions, useSubscription, useGuidelines } from "@/lib/brandshield/client";
import { useUIStore } from "@/lib/brandshield/store";
import { useLang } from "@/lib/brandshield/i18n";
import { cn, timeAgo, formatDate } from "@/lib/brandshield/utils";
import { STATUS_META, type Submission } from "@/lib/brandshield/types";

import "@/lib/brandshield/i18n/dict-dash-b";

// ─── Contractor "Client Sandbox" — risk-free pre-checks for client brands ────

export function ContractorDashboard() {
  const session = useSession();
  const submissions = useSubmissions();
  const subscription = useSubscription();
  const guidelines = useGuidelines();
  const { t, lang } = useLang();
  const setView = useUIStore((s) => s.setView);
  const openSubmission = useUIStore((s) => s.openSubmission);

  const user = session.data;
  if (session.isLoading || !user) {
    return (
      <div className="flex h-72 items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("common.action.loading")}
      </div>
    );
  }

  const sub = subscription.data;
  const unlimited = !!sub && sub.scanLimit === -1;
  const exhausted = !!sub && sub.scanLimit !== -1 && sub.scansUsed >= sub.scanLimit;
  const usagePct = sub && sub.scanLimit > 0 ? Math.min(100, (sub.scansUsed / sub.scanLimit) * 100) : 0;

  const mine = [...(submissions.data ?? [])]
    .filter((s) => s.authorId === user.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const docs = (guidelines.data ?? []).slice(0, 3);

  const steps = [
    { icon: ClipboardPaste, title: t("dash.contractor.step1.title"), desc: t("dash.contractor.step1.desc") },
    { icon: Zap, title: t("dash.contractor.step2.title"), desc: t("dash.contractor.step2.desc") },
    { icon: Wrench, title: t("dash.contractor.step3.title"), desc: t("dash.contractor.step3.desc") },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
      {/* 1 · Welcome hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="relative overflow-hidden border-orange-100 bg-gradient-to-br from-orange-50/80 via-white to-white">
          <div aria-hidden className="pointer-events-none absolute inset-2 rounded-xl border border-dashed border-orange-200/80" />
          <CardContent className="relative flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-orange-700/80">
                {t("dash.contractor.hero.eyebrow")} · {user.orgName}
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                {t("dash.contractor.welcome", { name: user.name.split(" ")[0] })}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-slate-500">{t("dash.contractor.hero.explainer")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {user.zeroDataRetention && (
                <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> {t("dash.contractor.hero.badge.zdr")}
                </Badge>
              )}
              <Badge className="gap-1 border border-orange-200 bg-orange-100 text-orange-800">
                <FlaskConical className="h-3.5 w-3.5" /> {t("dash.contractor.hero.badge.sandbox")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2 · Big pre-check CTA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} data-tour="sandbox-hero">
        <Card className="border-orange-200/70 bg-white shadow-sm">
          <CardContent className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex min-w-0 items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange-100 text-orange-700">
                <PlayCircle className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{t("dash.contractor.precheck.title")}</h2>
                <p className="mt-0.5 max-w-lg text-sm text-slate-500">{t("dash.contractor.precheck.desc")}</p>
                <Button
                  onClick={() => setView("scanner")}
                  className="mt-4 min-h-11 gap-2 bg-orange-600 px-6 text-white hover:bg-orange-700"
                >
                  <ScanSearch className="h-4 w-4" /> {t("dash.contractor.precheck.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Usage meter */}
            <div className="w-full max-w-sm rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500">{t("dash.contractor.usage.label")}</p>
                {sub && unlimited && (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    {t("dash.contractor.usage.unlimited")}
                  </Badge>
                )}
              </div>
              {sub && !unlimited && (
                <>
                  <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                    {sub.scansUsed}/{sub.scanLimit}
                  </p>
                  <Progress value={usagePct} className="mt-2 h-2 bg-orange-100 [&_[data-slot=progress-indicator]]:bg-orange-600" />
                  {sub.currentPeriodEnd && (
                    <p className="mt-2 text-xs text-slate-400">
                      {t("dash.contractor.usage.resets", { date: formatDate(sub.currentPeriodEnd, lang) })}
                    </p>
                  )}
                </>
              )}
              {sub && exhausted && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                    <TriangleAlert className="h-3.5 w-3.5 shrink-0" /> {t("dash.contractor.usage.exhausted")}
                  </p>
                  <p className="mt-1 text-xs text-amber-700">{t("dash.contractor.usage.exhaustedNote")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3 · How it works */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} data-tour="steps">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Sparkles className="h-4 w-4 text-orange-600" /> {t("dash.contractor.steps.title")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div key={step.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 + i * 0.06 }}>
              <Card className="h-full border-dashed border-orange-200/80 transition hover:border-orange-300 hover:shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-orange-600 text-xs font-bold text-white">{i + 1}</span>
                    <step.icon className="h-4.5 w-4.5 text-orange-600" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{step.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 4 · History + guidelines */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* LEFT — My pre-check history */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="min-w-0 lg:col-span-2">
          <Card className="h-full">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <History className="h-4 w-4 text-orange-600" /> {t("dash.contractor.history.title")}
                </h2>
                <Button variant="ghost" size="sm" className="text-orange-700 hover:text-orange-800" onClick={() => setView("scanner")}>
                  {t("dash.contractor.precheck.cta")} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              {submissions.isLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : mine.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <FlaskConical className="h-8 w-8 text-slate-200" />
                  <p className="max-w-xs text-sm text-slate-400">{t("dash.contractor.history.empty")}</p>
                  <Button size="sm" className="min-h-11 bg-orange-600 text-white hover:bg-orange-700" onClick={() => setView("scanner")}>
                    <ScanSearch className="h-4 w-4" /> {t("dash.contractor.history.cta")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {mine.map((s, i) => (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.24 + i * 0.04 }}
                      onClick={() => openSubmission(s.id, "findings")}
                      className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-100 bg-white px-4 py-3 text-left transition hover:border-orange-200 hover:bg-orange-50/40"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">{s.title}</span>
                        <span className="text-xs text-slate-400">{timeAgo(s.updatedAt, lang)}</span>
                      </span>
                      {s.complianceScore !== null && <ScoreChip score={s.complianceScore} />}
                      <StatusBadge status={s.status} t={t} />
                    </motion.button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* RIGHT — Guidelines peek + upgrade teaser */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="min-w-0 space-y-5">
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <BookOpenText className="h-4 w-4 text-orange-600" /> {t("dash.contractor.guidelines.title")}
              </h2>
              {guidelines.isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : docs.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">{t("dash.contractor.guidelines.empty")}</p>
              ) : (
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <div key={doc.id} className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 transition hover:border-orange-200">
                      <p className="truncate text-sm font-medium text-slate-800">{doc.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-[10px] text-orange-700">
                          {doc.docType}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10px] text-slate-600">
                          {t("dash.contractor.guidelines.chunks", { n: doc.chunkCount })}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                className="mt-3 min-h-11 w-full gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                onClick={() => setView("knowledge")}
              >
                {t("dash.contractor.guidelines.browse")} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>

          {/* Upgrade teaser — no billing navigation (billing is admin-only) */}
          {sub?.tier === "starter" && (
            <Card className="border-dashed border-orange-200 bg-gradient-to-br from-orange-50/70 via-white to-white">
              <CardContent className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Sparkles className="h-4 w-4 text-orange-600" /> {t("dash.contractor.upgrade.title")}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{t("dash.contractor.upgrade.desc")}</p>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> {t("dash.contractor.upgrade.note")}
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Small shared pieces ─────────────────────────────────────────────────────

function ScoreChip({ score }: { score: number }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 text-[10px]",
        score >= 85
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : score >= 60
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {score}
    </Badge>
  );
}

function StatusBadge({ status, t }: { status: Submission["status"]; t: (key: string) => string }) {
  return (
    <Badge variant="outline" className={cn("border", STATUS_META[status]?.className)}>
      {t(`common.status.${status}`)}
    </Badge>
  );
}
