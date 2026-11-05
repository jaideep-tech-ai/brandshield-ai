"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Gauge,
  AlertOctagon,
  Repeat2,
  ArrowUpDown,
  ShieldQuestion,
  Timer,
  FileCheck2,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useAnalytics } from "@/lib/brandshield/client";
import { useUIStore } from "@/lib/brandshield/store";
import { cn } from "@/lib/brandshield/utils";
import { SEVERITY_META, type Severity } from "@/lib/brandshield/types";

const SEVERITY_COLORS: Record<Severity, string> = { critical: "#DC2626", warning: "#D97706", minor: "#0D9488" };
const CATEGORY_COLORS: Record<string, string> = {
  claim: "#DC2626",
  tone: "#D97706",
  visual: "#7C3AED",
  style: "#0D9488",
  trademark: "#475569",
};

export function AnalyticsView() {
  const analytics = useAnalytics();
  const setView = useUIStore((s) => s.setView);
  const d = analytics.data;

  if (analytics.isLoading || !d) {
    return (
      <div className="flex h-72 items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Crunching governance data…
      </div>
    );
  }

  const statCards = [
    { icon: FileCheck2, label: "Avg compliance score", value: `${d.totals.avgCompliance}/100`, tone: d.totals.avgCompliance >= 85 ? "text-emerald-600" : d.totals.avgCompliance >= 60 ? "text-amber-600" : "text-red-600" },
    { icon: Gauge, label: "Pre-flight scans", value: String(d.totals.scans), tone: "text-teal-700" },
    { icon: AlertOctagon, label: "Open findings", value: String(d.totals.openFindings), tone: d.totals.openFindings > 0 ? "text-amber-600" : "text-emerald-600" },
    { icon: Timer, label: "Avg resolution time", value: `${d.totals.avgResolutionHours}h`, tone: "text-slate-700" },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600/10 text-teal-700">
              <BarChart3 className="h-5 w-5" />
            </span>
            Brand Drift &amp; Rule Friction Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Continuous governance — where content drifts, which rules get violated, and which policies confuse your teams.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 border-teal-200 bg-teal-50 text-teal-700">
          <Repeat2 className="h-3.5 w-3.5" /> Bi-directional feedback loop active
        </Badge>
      </div>

      {/* Stat band */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">{s.label}</p>
                  <s.icon className="h-4 w-4 text-slate-300" />
                </div>
                <p className={cn("mt-1.5 text-2xl font-bold tracking-tight", s.tone)}>{s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Scan trend */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><TrendingUp className="h-4 w-4 text-teal-700" /> Governance velocity — last 14 days</h3>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.scanTrend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scanFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D9488" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#0D9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="findFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D97706" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#D97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} allowDecimals={false} />
                  <ChartTooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="scans" stroke="#0D9488" strokeWidth={2} fill="url(#scanFill)" name="Scans" />
                  <Area type="monotone" dataKey="findings" stroke="#D97706" strokeWidth={2} fill="url(#findFill)" name="Findings" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Severity mix */}
        <Card>
          <CardContent className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><AlertOctagon className="h-4 w-4 text-teal-700" /> Severity mix</h3>
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={d.severityBreakdown.filter((s) => s.count > 0).map((s) => ({ name: SEVERITY_META[s.severity].label.split(" — ")[0], value: s.count, severity: s.severity }))}
                    dataKey="value"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    strokeWidth={2}
                  >
                    {d.severityBreakdown.filter((s) => s.count > 0).map((s) => (
                      <Cell key={s.severity} fill={SEVERITY_COLORS[s.severity]} />
                    ))}
                  </Pie>
                  <ChartTooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Top violated rules */}
        <Card>
          <CardContent className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><ArrowUpDown className="h-4 w-4 text-teal-700" /> Top violated rules</h3>
            {d.topViolatedRules.length === 0 ? (
              <p className="mt-6 text-center text-sm text-slate-400">No violations recorded yet.</p>
            ) : (
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.topViolatedRules.map((r, i) => ({ name: `R${i + 1}`, count: r.count, rule: r.rule, sourceDoc: r.sourceDoc, category: r.category }))} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#94A3B8" }} />
                    <YAxis type="category" dataKey="name" width={30} tick={{ fontSize: 10, fill: "#94A3B8" }} />
                    <ChartTooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                      formatter={(value) => [`${value} violations`, "Count"]}
                      labelFormatter={(_l, payload) => {
                        const p = payload?.[0]?.payload as { rule?: string } | undefined;
                        return p?.rule?.slice(0, 80) ?? "";
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {d.topViolatedRules.map((r, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[r.category] ?? "#0D9488"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <ul className="mt-3 space-y-1">
              {d.topViolatedRules.slice(0, 3).map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-slate-500">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[r.category] ?? "#0D9488" }} />
                  <span className="line-clamp-1">R{i + 1}: {r.rule.slice(0, 90)} · <span className="text-slate-400">{r.sourceDoc}</span></span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Department scores */}
        <Card>
          <CardContent className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Gauge className="h-4 w-4 text-teal-700" /> Department compliance scores</h3>
            {d.departmentScores.length === 0 ? (
              <p className="mt-6 text-center text-sm text-slate-400">No scored submissions yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {d.departmentScores.map((dept) => (
                  <div key={dept.department}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">{dept.department}</span>
                      <span className={cn("font-semibold", dept.avgScore >= 85 ? "text-emerald-600" : dept.avgScore >= 60 ? "text-amber-600" : "text-red-600")}>
                        {dept.avgScore} <span className="text-[10px] font-normal text-slate-400">· {dept.submissions} drafts</span>
                      </span>
                    </div>
                    <Progress value={dept.avgScore} className={cn("h-2", dept.avgScore < 60 && "[&>div]:bg-red-500", dept.avgScore >= 60 && dept.avgScore < 85 && "[&>div]:bg-amber-500")} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bi-directional feedback loop */}
      <Card className="border-amber-200/70 bg-gradient-to-br from-amber-50/60 to-white">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ShieldQuestion className="h-4 w-4 text-amber-600" /> Bi-directional feedback — rules flagged as ambiguous / high friction
            </h3>
            <Badge variant="outline" className="border-amber-300 bg-amber-100/60 text-[10px] text-amber-800">repeated triggers across teams → refine the rule</Badge>
          </div>
          {d.ambiguousPolicies.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No policy friction detected — teams are finding the guidelines clear.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {d.ambiguousPolicies.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-amber-200/70 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-700">{p.rule}</p>
                    <Badge variant="outline" className={cn("shrink-0 text-[10px]", p.frictionScore >= 0.6 ? "border-red-200 bg-red-50 text-red-600" : p.frictionScore >= 0.35 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-500")}>
                      {p.frictionScore >= 0.6 ? "Ambiguous" : p.frictionScore >= 0.35 ? "High friction" : "Watch"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{p.sourceDoc}</p>
                  <div className="mt-2.5 flex items-center gap-4 text-[11px] text-slate-500">
                    <span>{p.triggers} triggers</span>
                    <span>{Math.round(p.overrideRate * 100)}% overridden</span>
                    <span>{Math.round(p.openRate * 100)}% still open</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Progress value={p.frictionScore * 100} className="h-1.5 flex-1 [&>div]:bg-amber-500" />
                    <button onClick={() => setView("knowledge")} className="shrink-0 text-[11px] font-medium text-teal-700 underline-offset-2 hover:underline">
                      Refine guideline →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
