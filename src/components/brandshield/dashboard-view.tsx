"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ScanSearch,
  FileSearch,
  ClipboardCheck,
  Database,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  AlertOctagon,
  Gauge,
  Hourglass,
  FileCheck2,
  FlaskConical,
  Loader2,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSession, useSubmissions, useSubscription, useAnalytics } from "@/lib/brandshield/client";
import { useUIStore } from "@/lib/brandshield/store";
import { cn, timeAgo } from "@/lib/brandshield/utils";
import { STATUS_META, type SubmissionStatus } from "@/lib/brandshield/types";

export function DashboardView() {
  const session = useSession();
  const submissions = useSubmissions();
  const subscription = useSubscription();
  const analytics = useAnalytics();
  const setView = useUIStore((s) => s.setView);
  const openSubmission = useUIStore((s) => s.openSubmission);

  const user = session.data;
  if (session.isLoading || !user) {
    return (
      <div className="flex h-72 items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing your workspace…
      </div>
    );
  }

  const subs = submissions.data ?? [];
  const mine = subs.filter((s) => s.authorId === user.id);
  const relevant = user.role === "creator" || user.role === "contractor" ? mine : subs;
  const openFindings = relevant.reduce((a, s) => a + (s.findings?.filter((f) => f.status === "open").length ?? 0), 0);
  const pendingReview = subs.filter((s) => s.status === "in_review");
  const scored = relevant.filter((s) => s.complianceScore !== null);
  const avgScore = scored.length ? Math.round(scored.reduce((a, s) => a + (s.complianceScore ?? 0), 0) / scored.length) : null;

  const stats = [
    { icon: FileCheck2, label: user.role === "creator" || user.role === "contractor" ? "My submissions" : "Team submissions", value: String(relevant.length), view: "approvals" as const },
    { icon: AlertOctagon, label: "Open findings", value: String(openFindings), view: "findings" as const },
    { icon: Gauge, label: "Avg compliance", value: avgScore !== null ? `${avgScore}/100` : "—", view: "analytics" as const },
    { icon: Hourglass, label: "Awaiting review", value: String(pendingReview.length), view: "approvals" as const },
  ];

  const quickActions = getQuickActions(user.role, setView);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border-teal-100 bg-gradient-to-br from-teal-50/80 via-white to-white">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-teal-700/70">
                {greetingForRole(user.role)} · {user.orgName}
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Welcome back, {user.name.split(" ")[0]}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-slate-500">{welcomeCopy(user.role)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {user.zeroDataRetention && (
                <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> Zero-Data-Retention
                </Badge>
              )}
              <Button onClick={() => setView("scanner")} className="min-h-11 gap-2 bg-teal-700 px-5 hover:bg-teal-800">
                <ScanSearch className="h-4 w-4" /> New pre-flight scan
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div data-tour="stats" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.button key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setView(s.view)} className="text-left">
            <Card className="transition hover:border-teal-200 hover:shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">{s.label}</p>
                  <s.icon className="h-4 w-4 text-slate-300" />
                </div>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{s.value}</p>
              </CardContent>
            </Card>
          </motion.button>
        ))}
      </div>

      {/* Role-specific panels */}
      {user.role === "reviewer" && pendingReview.length > 0 && (
        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><ClipboardCheck className="h-4 w-4 text-amber-600" /> Your review queue</h2>
              <Button variant="ghost" size="sm" onClick={() => setView("approvals")}>Open board <ArrowRight className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="space-y-2">
              {pendingReview.slice(0, 4).map((s) => (
                <button key={s.id} onClick={() => openSubmission(s.id, "approvals")} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-100 bg-white px-4 py-3 text-left transition hover:border-teal-200 hover:bg-teal-50/40">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{s.title}</span>
                    <span className="text-xs text-slate-400">{s.authorName} · {s.department ?? "—"} · {timeAgo(s.updatedAt)}</span>
                  </span>
                  {s.complianceScore !== null && <ScoreChip score={s.complianceScore} />}
                  <Badge variant="outline" className={cn("border", STATUS_META[s.status as SubmissionStatus]?.className)}>{STATUS_META[s.status as SubmissionStatus]?.label}</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><LayoutDashboard className="h-4 w-4 text-teal-700" /> Recent submissions</h2>
              <Button variant="ghost" size="sm" onClick={() => setView("approvals")}>View all <ArrowRight className="h-3.5 w-3.5" /></Button>
            </div>
            {submissions.isLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div>
            ) : relevant.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <FlaskConical className="h-8 w-8 text-slate-200" />
                <p className="text-sm text-slate-400">No submissions yet — run your first pre-flight scan.</p>
                <Button size="sm" className="bg-teal-700 hover:bg-teal-800" onClick={() => setView("scanner")}>Open scanner</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {relevant.slice(0, 6).map((s) => (
                  <button key={s.id} onClick={() => openSubmission(s.id, "findings")} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-100 bg-white px-4 py-3 text-left transition hover:border-teal-200 hover:bg-teal-50/40">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">{s.title}</span>
                      <span className="text-xs text-slate-400">{s.authorName} · {s.contentType === "banner" ? "Banner" : "Copy"} · {timeAgo(s.updatedAt)}</span>
                    </span>
                    {s.complianceScore !== null && <ScoreChip score={s.complianceScore} />}
                    <Badge variant="outline" className={cn("border", STATUS_META[s.status as SubmissionStatus]?.className)}>{STATUS_META[s.status as SubmissionStatus]?.label}</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side rail */}
        <div className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><Building2 className="h-4 w-4 text-teal-700" /> Workspace status</h2>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Plan</span>
                  <Badge variant="outline" className="capitalize border-teal-200 bg-teal-50 text-teal-700">{subscription.data?.tier ?? "—"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Scans this cycle</span>
                  <span className="font-medium text-slate-700">
                    {subscription.data ? (subscription.data.scanLimit === -1 ? `${subscription.data.scansUsed} · unlimited` : `${subscription.data.scansUsed}/${subscription.data.scanLimit}`) : "—"}
                  </span>
                </div>
                {subscription.data && subscription.data.scanLimit !== -1 && (
                  <Progress value={(subscription.data.scansUsed / subscription.data.scanLimit) * 100} className="h-1.5" />
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Ground-truth docs</span>
                  <span className="font-medium text-slate-700">{analytics.data?.totals.submissions !== undefined ? "indexed" : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Audit chain</span>
                  <span className="flex items-center gap-1 font-medium text-emerald-600"><ShieldCheck className="h-3.5 w-3.5" /> verified</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-tour="quick-actions">
            <CardContent className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">Quick actions</h2>
              <div className="space-y-1.5">
                {quickActions.map((qa) => (
                  <button key={qa.label} onClick={() => setView(qa.view)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50">
                    <qa.icon className="h-4 w-4 text-teal-700" />
                    {qa.label}
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ScoreChip({ score }: { score: number }) {
  return (
    <Badge variant="outline" className={cn("shrink-0 text-[10px]", score >= 85 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : score >= 60 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700")}>
      {score}
    </Badge>
  );
}

function greetingForRole(role: string) {
  switch (role) {
    case "creator": return "Content Studio";
    case "reviewer": return "Brand & Legal Review";
    case "contractor": return "Agency Sandbox";
    case "admin": return "Brand Governance HQ";
    default: return "Workspace";
  }
}

function welcomeCopy(role: string) {
  switch (role) {
    case "creator": return "Scan drafts against the ground-truth repository, resolve flags with one-click rewrites, and submit for review when you're clear.";
    case "reviewer": return "Work the approval queue, verify claim citations, and grant cryptographic sign-offs — every decision is hash-chained.";
    case "contractor": return "This is your self-service sandbox: pre-check copy and banners against client-approved guidelines before formal submission.";
    case "admin": return "Monitor brand drift, review rule friction, manage the knowledge base and billing — the full governance picture.";
    default: return "";
  }
}

function getQuickActions(role: string, setView: (v: ReturnType<typeof useUIStore.getState>["view"]) => void) {
  type QA = { icon: typeof ScanSearch; label: string; view: Parameters<typeof setView>[0] };
  const base: QA[] = [
    { icon: ScanSearch, label: "Run a pre-flight scan", view: "scanner" },
    { icon: FileSearch, label: "Resolve open findings", view: "findings" },
    { icon: Database, label: "Browse the knowledge base", view: "knowledge" },
  ];
  if (role === "reviewer" || role === "admin") {
    base.push({ icon: ClipboardCheck, label: "Open the approval board", view: "approvals" });
    base.push({ icon: BarChart3, label: "See drift analytics", view: "analytics" });
  }
  if (role === "admin") {
    base.push({ icon: BarChart3, label: "Billing & subscription", view: "billing" });
  }
  return base;
}
