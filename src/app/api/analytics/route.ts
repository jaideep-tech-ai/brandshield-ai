import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";
import type { AnalyticsPayload, Finding, Severity, SubmissionStatus } from "@/lib/brandshield/types";

export async function GET() {
  try {
    const user = await requireUser();
    const [submissions, findings, auditLogs] = await Promise.all([
      db.submission.findMany({
        where: { orgId: user.orgId },
        include: { findings: true, inspections: { orderBy: { createdAt: "desc" }, take: 1 } },
      }),
      db.finding.findMany({
        where: { submission: { orgId: user.orgId } },
        orderBy: { createdAt: "desc" },
      }),
      db.auditLog.findMany({ where: { orgId: user.orgId } }),
    ]);

    const scans = submissions.reduce((acc, s) => acc + s.scanCount, 0);
    const openFindings = findings.filter((f) => f.status === "open").length;
    const approved = submissions.filter((s) => s.status === "approved").length;
    const scored = submissions.filter((s) => s.complianceScore !== null);
    const avgCompliance = scored.length
      ? Math.round(scored.reduce((a, s) => a + (s.complianceScore ?? 0), 0) / scored.length)
      : 0;

    // Resolution speed: createdAt → resolvedAt on resolved findings
    const resolved = findings.filter((f) => f.resolvedAt);
    const avgResolutionHours = resolved.length
      ? Math.max(
          0,
          +(
            resolved.reduce(
              (a, f) => a + (new Date(f.resolvedAt!).getTime() - new Date(f.createdAt).getTime()) / 3_600_000,
              0
            ) / resolved.length
          ).toFixed(1)
        )
      : 0;

    const countBy = <K extends string>(items: Finding[] | typeof submissions, key: (x: never) => K) => items;
    void countBy;

    const severityBreakdown = (["critical", "warning", "minor"] as Severity[]).map((severity) => ({
      severity,
      count: findings.filter((f) => f.severity === severity).length,
    }));
    const categories = ["claim", "tone", "visual", "style", "trademark"];
    const categoryBreakdown = categories.map((category) => ({
      category,
      count: findings.filter((f) => f.category === category).length,
    }));

    // Top violated rules: group by ruleCitation
    const ruleMap = new Map<string, { count: number; sourceDoc: string; category: string }>();
    for (const f of findings) {
      const key = f.ruleCitation.slice(0, 120);
      const prev = ruleMap.get(key);
      ruleMap.set(key, {
        count: (prev?.count ?? 0) + 1,
        sourceDoc: f.sourceDoc,
        category: f.category,
      });
    }
    const topViolatedRules = [...ruleMap.entries()]
      .map(([rule, v]) => ({ rule, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Department compliance scores
    const deptMap = new Map<string, { total: number; count: number }>();
    for (const s of submissions) {
      const dept = s.department ?? "Unassigned";
      if (s.complianceScore === null) continue;
      const prev = deptMap.get(dept) ?? { total: 0, count: 0 };
      deptMap.set(dept, { total: prev.total + s.complianceScore, count: prev.count + 1 });
    }
    const departmentScores = [...deptMap.entries()]
      .map(([department, v]) => ({ department, avgScore: Math.round(v.total / v.count), submissions: v.count }))
      .sort((a, b) => b.avgScore - a.avgScore);

    // Scan trend (last 14 days)
    const trend: AnalyticsPayload["scanTrend"] = [];
    for (let d = 13; d >= 0; d--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - d);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const daySubs = submissions.filter((s) => {
        const t = new Date(s.updatedAt).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      });
      const dayFindings = findings.filter((f) => {
        const t = new Date(f.createdAt).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      });
      trend.push({
        date: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        scans: daySubs.reduce((a, s) => a + Math.max(1, s.scanCount ? 1 : 0), 0),
        findings: dayFindings.length,
      });
    }

    const statusDistribution = (["draft", "in_review", "changes_requested", "approved"] as SubmissionStatus[]).map((status) => ({
      status,
      count: submissions.filter((s) => s.status === status).length,
    }));

    // Bi-directional feedback loop: rule friction analysis
    // friction = triggers weighted by override rate + open rate → ambiguous policies
    const frictionMap = new Map<string, { triggers: number; overridden: number; open: number; sourceDoc: string }>();
    for (const f of findings) {
      const key = f.ruleCitation.slice(0, 120);
      const prev = frictionMap.get(key) ?? { triggers: 0, overridden: 0, open: 0, sourceDoc: f.sourceDoc };
      prev.triggers += 1;
      if (f.status === "overridden") prev.overridden += 1;
      if (f.status === "open") prev.open += 1;
      frictionMap.set(key, prev);
    }
    const ambiguousPolicies = [...frictionMap.entries()]
      .filter(([, v]) => v.triggers >= 2)
      .map(([rule, v]) => {
        const overrideRate = v.overridden / v.triggers;
        const openRate = v.open / v.triggers;
        const frictionScore = +(overrideRate * 0.6 + openRate * 0.4).toFixed(2);
        const verdict =
          frictionScore >= 0.6 ? "Ambiguous — refine this rule" : frictionScore >= 0.35 ? "High friction — review wording" : "Watch";
        return { rule, sourceDoc: v.sourceDoc, triggers: v.triggers, overrideRate: +overrideRate.toFixed(2), openRate: +openRate.toFixed(2), frictionScore, verdict };
      })
      .sort((a, b) => b.frictionScore - a.frictionScore)
      .slice(0, 6);

    const payload: AnalyticsPayload = {
      totals: {
        submissions: submissions.length,
        scans,
        findings: findings.length,
        openFindings,
        approved,
        avgCompliance,
        avgResolutionHours,
      },
      severityBreakdown,
      categoryBreakdown,
      topViolatedRules,
      departmentScores,
      scanTrend: trend,
      statusDistribution,
      ambiguousPolicies,
    };
    void auditLogs;
    return NextResponse.json(payload);
  } catch (e) {
    return jsonError(e);
  }
}
