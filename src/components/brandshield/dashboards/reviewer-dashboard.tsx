"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCheck,
  ClipboardCheck,
  Clock,
  Copy,
  Gauge,
  History,
  Inbox,
  ListChecks,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrgAuditTrail, useSession, useSubmissions } from "@/lib/brandshield/client";
import { useLang } from "@/lib/brandshield/i18n";
import { useUIStore, type ViewKey } from "@/lib/brandshield/store";
import { cn, shortHash, timeAgo } from "@/lib/brandshield/utils";
import type { AuditEntry, Submission } from "@/lib/brandshield/types";
import { WorkflowCard } from "@/components/brandshield/workflow-card";
import { GuidedTasksCard } from "@/components/brandshield/demo-tour";

// ─── Review Desk — reviewer landing dashboard (amber identity) ───────────────
// Focus: queue → decide → audit. Structurally distinct from the Content
// Studio: priority queue + risk radar + hash-chained decision feed.

const CRITICAL_WINDOW_MS = 24 * 60 * 60 * 1000;

const ACTION_KEYS: Record<string, string> = {
  APPROVAL: "dash.reviewer.action.approval",
  SIGN_OFF: "dash.reviewer.action.signOff",
  CHANGES_REQUESTED: "dash.reviewer.action.changes",
  SUBMITTED_FOR_REVIEW: "dash.reviewer.action.submittedReview",
  SUBMITTED: "dash.reviewer.action.submitted",
};

function critCount(s: Submission): number {
  return s.findings?.filter((f) => f.status === "open" && f.severity === "critical").length ?? 0;
}

function waitingOver24h(s: Submission): boolean {
  return Date.now() - new Date(s.updatedAt).getTime() > CRITICAL_WINDOW_MS;
}

export function ReviewerDashboard() {
  const { t, lang } = useLang();
  const session = useSession();
  const submissions = useSubmissions();
  const audit = useOrgAuditTrail();
  const setView = useUIStore((s) => s.setView);
  const openSubmission = useUIStore((s) => s.openSubmission);

  const user = session.data;
  const subs = submissions.data ?? [];

  const pending = subs.filter((s) => s.status === "in_review");
  const decided = subs.filter((s) => s.status === "approved").length;
  const scored = subs.filter((s) => s.complianceScore !== null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((a, s) => a + (s.complianceScore ?? 0), 0) / scored.length)
    : null;
  const openCritical = subs.reduce((a, s) => a + critCount(s), 0);

  // Longest waiting first — oldest updatedAt leads the queue.
  const queue = [...pending]
    .sort((a, b) => +new Date(a.updatedAt) - +new Date(b.updatedAt))
    .slice(0, 6);

  const risks = subs.filter((s) => s.status !== "approved" && critCount(s) > 0);

  const decisions: AuditEntry[] = (audit.data ?? [])
    .filter((a) => /APPROV|CHANGES|SUBMIT|SIGN_OFF/.test(a.action))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  function actionLabel(action: string): string {
    const key = ACTION_KEYS[action];
    return key ? t(key) : action; // dict mapping with raw fallback
  }

  function copyHash(hash: string) {
    try {
      void navigator.clipboard?.writeText(hash);
      toast.success(t("common.action.copied"));
    } catch {
      /* clipboard unavailable — silent */
    }
  }

  if (!user) return null; // RoleDashboard guarantees a session

  const stats: { icon: LucideIcon; label: string; value: string; tone: string }[] = [
    { icon: Inbox, label: t("dash.reviewer.stats.pending"), value: String(pending.length), tone: "text-amber-600" },
    { icon: CheckCheck, label: t("dash.reviewer.stats.decided"), value: String(decided), tone: "text-emerald-600" },
    {
      icon: Gauge,
      label: t("dash.reviewer.stats.avg"),
      value: avgScore !== null ? t("common.score.of100", { score: avgScore }) : "—",
      tone: "text-teal-600",
    },
    { icon: ShieldAlert, label: t("dash.reviewer.stats.critical"), value: String(openCritical), tone: "text-red-600" },
  ];

  const quickActions: { icon: LucideIcon; label: string; view: ViewKey }[] = [
    { icon: ClipboardCheck, label: t("dash.reviewer.quick.approvals"), view: "approvals" },
    { icon: ShieldCheck, label: t("dash.reviewer.quick.chain"), view: "approvals" },
    { icon: BarChart3, label: t("dash.reviewer.quick.drift"), view: "analytics" },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
      {/* 1 · Welcome hero — amber identity */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="overflow-hidden border-amber-100 bg-gradient-to-br from-amber-50/80 via-white to-white">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700/70">
                {t("dash.reviewer.desk")} · {user.orgName}
              </p>
              <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                {t("dash.reviewer.welcome", { name: user.name.split(" ")[0] })}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                <span className="font-bold text-slate-900">{pending.length}</span>{" "}
                {t("dash.reviewer.awaiting.rest")}
              </p>
              <p className="mt-1 max-w-xl text-xs text-slate-400">{t("dash.reviewer.hero.sub")}</p>
            </div>
            <Button
              onClick={() => setView("approvals")}
              className="min-h-11 gap-2 bg-amber-600 px-5 hover:bg-amber-700"
            >
              <ClipboardCheck className="h-4 w-4" /> {t("dash.reviewer.hero.cta")}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2 · 7-Stage Brand Governance Lifecycle */}
      <WorkflowCard />

      {/* 2.5 · Guided First-Time Tasks */}
      <GuidedTasksCard role="reviewer" />

      {/* 3 · Stats row — informational (not clickable) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 + i * 0.05 }}
          >
            <Card className="h-full">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-slate-500">{s.label}</p>
                  <s.icon className={cn("h-4 w-4 shrink-0", s.tone)} />
                </div>
                <p className="mt-1.5 truncate text-2xl font-bold tracking-tight text-slate-900">{s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 3 · Priority queue — longest waiting first */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
        <Card data-tour="queue" className="border-amber-100">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-1">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ListChecks className="h-4 w-4 text-amber-600" /> {t("dash.reviewer.queue.title")}
              </h2>
              <span className="text-xs text-slate-400">{t("dash.reviewer.queue.sub")}</span>
            </div>

            {queue.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <CheckCheck className="h-8 w-8 text-emerald-300" />
                <p className="text-sm text-slate-500">{t("dash.reviewer.queue.empty")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-100 bg-white px-4 py-3 transition hover:border-amber-200 hover:bg-amber-50/30"
                  >
                    <span className="min-w-0 flex-1 basis-48">
                      <span className="block truncate text-sm font-medium text-slate-800">{s.title}</span>
                      <span className="block truncate text-xs text-slate-400">
                        {s.authorName ?? "—"} · {s.department ?? "—"}
                      </span>
                    </span>
                    <Badge
                      variant="outline"
                      title={t("dash.reviewer.queue.waitingTip")}
                      className={cn(
                        "shrink-0 gap-1",
                        waitingOver24h(s)
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      )}
                    >
                      <Clock className="h-3 w-3" /> {timeAgo(s.updatedAt, lang)}
                    </Badge>
                    {critCount(s) > 0 && (
                      <Badge variant="outline" className="shrink-0 gap-1 border-red-200 bg-red-50 text-red-700">
                        <ShieldAlert className="h-3 w-3" /> {critCount(s)}
                      </Badge>
                    )}
                    {s.complianceScore !== null && <ScoreChip score={s.complianceScore} />}
                    <Button
                      size="sm"
                      onClick={() => openSubmission(s.id, "approvals")}
                      className="ml-auto min-h-9 shrink-0 gap-1 bg-amber-600 px-3 hover:bg-amber-700"
                    >
                      {t("dash.reviewer.queue.review")} <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 4 · Risk radar + recent decisions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="min-w-0">
          <Card data-tour="risk" className="h-full">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-1">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <ShieldAlert className="h-4 w-4 text-red-600" /> {t("dash.reviewer.risk.title")}
                </h2>
                <span className="text-xs text-slate-400">{t("dash.reviewer.risk.sub")}</span>
              </div>

              {risks.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <ShieldCheck className="h-8 w-8 text-emerald-300" />
                  <p className="text-sm text-slate-500">{t("dash.reviewer.risk.empty")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {risks.slice(0, 4).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => openSubmission(s.id, "findings")}
                      className="rounded-xl border border-red-200 bg-red-50/40 p-4 text-left transition hover:border-red-300 hover:bg-red-50/70"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="gap-1 border-red-200 bg-white text-red-700">
                          <ShieldAlert className="h-3 w-3" /> {t("dash.reviewer.risk.flagged", { n: critCount(s) })}
                        </Badge>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-red-300" />
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold text-slate-900">{s.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {s.authorName ?? "—"} · {timeAgo(s.updatedAt, lang)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }} className="min-w-0">
          <Card className="h-full">
            <CardContent className="flex h-full flex-col p-5 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <History className="h-4 w-4 text-amber-600" /> {t("dash.reviewer.decisions.title")}
              </h2>

              {decisions.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
                  <History className="h-8 w-8 text-slate-200" />
                  <p className="text-sm text-slate-500">{t("dash.reviewer.decisions.empty")}</p>
                </div>
              ) : (
                <ul className="flex-1 space-y-2">
                  {decisions.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-100 bg-white px-3 py-2.5"
                    >
                      <span className="min-w-0 flex-1 basis-32">
                        <span className="block truncate text-sm font-medium text-slate-800">{actionLabel(a.action)}</span>
                        <span className="block truncate text-xs text-slate-400">{a.actorName ?? a.actorId}</span>
                      </span>
                      <code className="hidden shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 sm:block">
                        {shortHash(a.contentHash)}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyHash(a.contentHash)}
                        title={t("common.action.copy")}
                        className="min-h-9 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(a.createdAt, lang)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("approvals")}
                className="mt-3 w-full min-h-9 gap-1 text-amber-700 hover:bg-amber-50"
              >
                {t("dash.reviewer.decisions.footer")} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 5 · Quick actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
        <div data-tour="quick-actions">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">{t("dash.reviewer.quick.title")}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {quickActions.map((qa) => (
              <motion.button
                key={qa.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                onClick={() => setView(qa.view)}
                className="min-h-11 text-left"
              >
                <Card className="transition hover:border-amber-200 hover:shadow-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50">
                      <qa.icon className="h-4 w-4 text-amber-700" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{qa.label}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </CardContent>
                </Card>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

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
