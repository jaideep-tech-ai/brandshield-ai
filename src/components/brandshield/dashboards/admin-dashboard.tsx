"use client";

import { motion } from "framer-motion";
import {
  Database,
  BarChart3,
  FileCheck2,
  Gauge,
  AlertOctagon,
  CheckCircle2,
  HeartPulse,
  Scale,
  Users,
  CreditCard,
  BookOpenText,
  ArrowRight,
  Loader2,
  TriangleAlert,
  ScanSearch,
  Timer,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSession, useSubscription, useGuidelines, useAnalytics, useTeam } from "@/lib/brandshield/client";
import { useUIStore } from "@/lib/brandshield/store";
import { useLang } from "@/lib/brandshield/i18n";
import { cn, formatDate, initials } from "@/lib/brandshield/utils";
import type { TeamMember } from "@/lib/brandshield/types";
import { WorkflowCard } from "@/components/brandshield/workflow-card";

import "@/lib/brandshield/i18n/dict-dash-b";

// ─── Admin "Governance HQ" — full governance picture for the CMO ─────────────

export function AdminDashboard() {
  const session = useSession();
  const analytics = useAnalytics();
  const guidelines = useGuidelines();
  const subscription = useSubscription();
  const team = useTeam();
  const { t, lang } = useLang();
  const setView = useUIStore((s) => s.setView);

  const user = session.data;
  if (session.isLoading || !user) {
    return (
      <div className="flex h-72 items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("common.action.loading")}
      </div>
    );
  }

  const totals = analytics.data?.totals;
  const sub = subscription.data;
  const members = team.data ?? [];

  // Brand health math
  const avgCompliance = totals ? Math.round(totals.avgCompliance) : null;
  const health =
    avgCompliance === null ? null : avgCompliance >= 85 ? "healthy" : avgCompliance >= 60 ? "watch" : "atRisk";
  const approvedRate = totals && totals.submissions > 0 ? Math.round((totals.approved / totals.submissions) * 100) : null;

  const kpis = [
    { icon: FileCheck2, label: t("dash.admin.kpi.submissions"), value: totals ? String(totals.submissions) : "—" },
    { icon: Gauge, label: t("dash.admin.kpi.avgCompliance"), value: avgCompliance !== null ? `${avgCompliance}/100` : "—" },
    { icon: AlertOctagon, label: t("dash.admin.kpi.openFindings"), value: totals ? String(totals.openFindings) : "—" },
    { icon: CheckCircle2, label: t("dash.admin.kpi.approved"), value: totals ? String(totals.approved) : "—" },
  ];

  const topRules = (analytics.data?.topViolatedRules ?? []).slice(0, 4);
  const frictionRules = (analytics.data?.ambiguousPolicies ?? [])
    .filter((p) => p.frictionScore >= 40)
    .slice(0, 3);

  const docs = guidelines.data ?? [];
  const totalChunks = docs.reduce((a, d) => a + d.chunkCount, 0);
  const lastUpdated = docs.length > 0 ? docs.reduce((a, d) => (d.updatedAt > a ? d.updatedAt : a), docs[0].updatedAt) : null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
      {/* 1 · Welcome hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-white">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-emerald-700/80">
                {t("dash.admin.hero.eyebrow")} · {user.orgName}
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                {t("dash.admin.welcome", { name: user.name.split(" ")[0] })}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-slate-500">{t("dash.admin.hero.tagline")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="min-h-11 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                onClick={() => setView("knowledge")}
              >
                <BookOpenText className="h-4 w-4" /> {t("dash.admin.hero.kb")}
              </Button>
              <Button className="min-h-11 gap-2 bg-emerald-700 text-white hover:bg-emerald-800" onClick={() => setView("analytics")}>
                <BarChart3 className="h-4 w-4" /> {t("dash.admin.hero.analytics")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2 · 7-Stage Brand Governance Lifecycle */}
      <WorkflowCard />

      {/* 3 · KPI row */}
      <div data-tour="kpi" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="transition hover:border-emerald-200 hover:shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-slate-500">{k.label}</p>
                  <k.icon className="h-4 w-4 shrink-0 text-slate-300" />
                </div>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{k.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 3 · Governance stacks */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* LEFT — Brand health · top rules · friction */}
        <div className="min-w-0 space-y-5 lg:col-span-2">
          {/* a · Brand health */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} data-tour="health">
            <Card>
              <CardContent className="p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <HeartPulse className="h-4 w-4 text-emerald-700" /> {t("dash.admin.health.title")}
                </h2>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight text-slate-900">{avgCompliance !== null ? avgCompliance : "—"}</span>
                    <span className="text-sm font-medium text-slate-400">/100</span>
                    {health && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-2",
                          health === "healthy"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : health === "watch"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-red-200 bg-red-50 text-red-700"
                        )}
                      >
                        {t(`dash.admin.health.${health}`)}
                      </Badge>
                    )}
                  </div>
                  {approvedRate !== null && (
                    <p className="text-xs text-slate-500">
                      {t("dash.admin.health.approvedRate")}: <span className="font-semibold text-slate-700">{approvedRate}%</span>
                    </p>
                  )}
                </div>
                <Progress
                  value={avgCompliance ?? 0}
                  className={cn(
                    "mt-3 h-2 bg-slate-100",
                    health === "healthy"
                      ? "[&_[data-slot=progress-indicator]]:bg-emerald-600"
                      : health === "watch"
                        ? "[&_[data-slot=progress-indicator]]:bg-amber-500"
                        : "[&_[data-slot=progress-indicator]]:bg-red-500"
                  )}
                />
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                  <SubMetric icon={ScanSearch} label={t("dash.admin.health.scans")} value={totals ? String(totals.scans) : "—"} />
                  <SubMetric icon={AlertOctagon} label={t("dash.admin.health.findings")} value={totals ? String(totals.findings) : "—"} />
                  <SubMetric
                    icon={Timer}
                    label={t("dash.admin.health.resolution")}
                    value={totals ? t("dash.admin.health.hours", { n: Math.round(totals.avgResolutionHours) }) : "—"}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* b · Top violated rules */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} data-tour="rules">
            <Card>
              <CardContent className="p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Scale className="h-4 w-4 text-emerald-700" /> {t("dash.admin.rules.title")}
                </h2>
                {analytics.isLoading ? (
                  <div className="mt-4 space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : topRules.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">{t("dash.admin.rules.empty")}</p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {topRules.map((rule, i) => (
                      <div key={`${rule.rule}-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-2.5">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-800">{rule.rule}</span>
                          <span className="block truncate text-xs text-slate-400">{rule.sourceDoc}</span>
                        </span>
                        <Badge variant="outline" className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700">
                          {t("dash.admin.rules.count", { n: rule.count })}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* c · Rules causing friction (hidden when clean) */}
          {frictionRules.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <TriangleAlert className="h-4 w-4 text-amber-600" /> {t("dash.admin.friction.title")}
                  </h2>
                  <p className="mt-1 text-xs text-amber-700/90">{t("dash.admin.friction.desc")}</p>
                  <div className="mt-4 space-y-2">
                    {frictionRules.map((p, i) => (
                      <div key={`${p.rule}-${i}`} className="rounded-xl border border-amber-200/80 bg-white px-4 py-3">
                        <p className="truncate text-sm font-medium text-slate-800">{p.rule}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <span className="text-amber-800">
                            {t("dash.admin.friction.overrideRate")}:{" "}
                            <span className="font-semibold">{Math.round(p.overrideRate)}%</span>
                          </span>
                          <span className="text-slate-500">{t("dash.admin.friction.triggers", { n: p.triggers })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 min-h-11 gap-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={() => setView("analytics")}
                  >
                    {t("dash.admin.friction.openAnalytics")} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* RIGHT — KB health · billing · team */}
        <div className="min-w-0 space-y-5">
          {/* a · Knowledge base health */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} data-tour="kb">
            <Card>
              <CardContent className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Database className="h-4 w-4 text-emerald-700" /> {t("dash.admin.kb.title")}
                </h2>
                {guidelines.isLoading ? (
                  <div className="mt-3 space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                  </div>
                ) : docs.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">{t("dash.admin.kb.empty")}</p>
                ) : (
                  <div className="mt-3 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{t("dash.admin.kb.docs")}</span>
                      <span className="font-semibold text-slate-700">{docs.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Layers className="h-3.5 w-3.5 text-slate-300" /> {t("dash.admin.kb.chunks")}
                      </span>
                      <span className="font-semibold text-slate-700">{totalChunks}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="shrink-0 text-slate-500">{t("dash.admin.kb.updated")}</span>
                      <span className="truncate font-medium text-slate-700">{lastUpdated ? formatDate(lastUpdated, lang) : "—"}</span>
                    </div>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="mt-4 min-h-11 w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                  onClick={() => setView("knowledge")}
                >
                  {t("dash.admin.kb.manage")} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* b · Billing snapshot */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} data-tour="billing-snap">
            <Card>
              <CardContent className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <CreditCard className="h-4 w-4 text-emerald-700" /> {t("dash.admin.billing.title")}
                </h2>
                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("dash.admin.billing.plan")}</span>
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      {sub ? t(`common.tier.${sub.tier}`) : "—"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("dash.admin.billing.seats")}</span>
                    <span className="font-semibold text-slate-700">{sub ? sub.seats : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="shrink-0 text-slate-500">{t("dash.admin.billing.scans")}</span>
                    {sub && sub.scanLimit === -1 ? (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        {t("dash.admin.billing.unlimited")}
                      </Badge>
                    ) : (
                      <span className="truncate font-semibold text-slate-700">{sub ? `${sub.scansUsed}/${sub.scanLimit}` : "—"}</span>
                    )}
                  </div>
                  {sub?.currentPeriodEnd && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="shrink-0 text-slate-500">{t("dash.admin.billing.renews")}</span>
                      <span className="truncate font-medium text-slate-700">{formatDate(sub.currentPeriodEnd, lang)}</span>
                    </div>
                  )}
                </div>
                <Button
                  className="mt-4 min-h-11 w-full gap-2 bg-emerald-700 text-white hover:bg-emerald-800"
                  onClick={() => setView("billing")}
                >
                  {t("dash.admin.billing.manage")} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* c · Team pulse */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} data-tour="team">
            <Card>
              <CardContent className="p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Users className="h-4 w-4 text-emerald-700" /> {t("dash.admin.team.title")}
                </h2>
                {team.isLoading ? (
                  <div className="mt-3 space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : members.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">{t("dash.admin.team.empty")}</p>
                ) : (
                  <div className="mt-3 space-y-1.5">
                    {members.slice(0, 5).map((m) => (
                      <TeamRow key={m.id} member={m} t={t} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Small shared pieces ─────────────────────────────────────────────────────

function SubMetric({ icon: Icon, label, value }: { icon: typeof ScanSearch; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 truncate text-[11px] text-slate-400">
        <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
      </p>
      <p className="mt-0.5 truncate text-lg font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function TeamRow({ member: m, t }: { member: TeamMember; t: (key: string) => string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50">
      <Avatar className="size-9">
        <AvatarFallback className="text-xs font-semibold text-white" style={{ backgroundColor: m.avatarColor }}>
          {initials(m.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{m.name}</p>
        <p className="truncate text-xs text-slate-400">{m.department ?? "—"}</p>
      </div>
      <Badge variant="outline" className="shrink-0 border-slate-200 bg-slate-50 text-[10px] text-slate-600">
        {t(`common.role.${m.role}`)}
      </Badge>
    </div>
  );
}
