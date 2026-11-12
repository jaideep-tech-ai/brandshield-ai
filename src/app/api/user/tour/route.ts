import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

export interface TourStatePayload {
  completed: boolean;
  stepIndex: number;
  role: string;
  dismissed: boolean;
  paused: boolean;
  tasksCompleted: string[];
  liveTaskStatus: Record<string, boolean>;
  updatedAt?: string;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { tourState: true, role: true, orgId: true },
    });

    let state: Partial<TourStatePayload> = {};
    if (dbUser?.tourState) {
      try {
        state = JSON.parse(dbUser.tourState);
      } catch {
        state = {};
      }
    }

    // Compute live task completion from real database rows
    const [
      guidelineCount,
      userCount,
      allSubmissionsCount,
      criticalFindingsCount,
      inspectionsCount,
      approvedCount,
      resolvedCount,
      mySubmissionsCount,
      myInspectionsCount,
      myReviewedSubmissionsCount,
      auditLogCount,
    ] = await Promise.all([
      db.guidelineDocument.count({ where: { orgId: user.orgId } }),
      db.user.count({ where: { orgId: user.orgId } }),
      db.submission.count({ where: { orgId: user.orgId } }),
      db.finding.count({ where: { submission: { orgId: user.orgId }, severity: "critical" } }),
      db.inspection.count({ where: { submission: { orgId: user.orgId } } }),
      db.submission.count({ where: { orgId: user.orgId, status: "approved" } }),
      db.finding.count({ where: { submission: { orgId: user.orgId }, status: "resolved" } }),
      db.submission.count({ where: { orgId: user.orgId, authorId: user.id } }),
      db.inspection.count({ where: { submission: { authorId: user.id } } }),
      db.submission.count({ where: { authorId: user.id, status: { in: ["in_review", "approved", "changes_requested"] } } }),
      db.auditLog.count({ where: { orgId: user.orgId } }),
    ]);

    const liveTaskStatus: Record<string, boolean> = {
      // Admin tasks
      admin_configure_org: guidelineCount > 0,
      admin_add_team: userCount > 1,
      admin_review_compliance: allSubmissionsCount > 0,
      // Reviewer tasks
      reviewer_review_critical: criticalFindingsCount > 0,
      reviewer_inspect_evidence: inspectionsCount > 0,
      reviewer_complete_approval: approvedCount > 0 || resolvedCount > 0,
      // Creator tasks
      creator_upload_asset: mySubmissionsCount > 0,
      creator_run_scan: myInspectionsCount > 0,
      creator_submit_approval: myReviewedSubmissionsCount > 0,
      // Auditor tasks
      contractor_review_audit: auditLogCount > 0,
      contractor_inspect_evidence: inspectionsCount > 0 || criticalFindingsCount > 0,
      contractor_export_report: auditLogCount >= 1,
    };

    const payload: TourStatePayload = {
      completed: !!state.completed,
      stepIndex: typeof state.stepIndex === "number" ? state.stepIndex : 0,
      role: dbUser?.role ?? user.role,
      dismissed: !!state.dismissed,
      paused: !!state.paused,
      tasksCompleted: Array.isArray(state.tasksCompleted) ? state.tasksCompleted : [],
      liveTaskStatus,
      updatedAt: state.updatedAt,
    };

    return NextResponse.json(payload);
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);

    const body = (await req.json().catch(() => ({}))) as {
      completed?: boolean;
      stepIndex?: number;
      dismissed?: boolean;
      paused?: boolean;
      taskCompleted?: string;
      restart?: boolean;
      reset?: boolean;
    };

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { tourState: true, role: true },
    });

    let current: Partial<TourStatePayload> = {};
    if (dbUser?.tourState) {
      try {
        current = JSON.parse(dbUser.tourState);
      } catch {
        current = {};
      }
    }

    if (body.restart || body.reset) {
      current = {
        completed: false,
        stepIndex: 0,
        dismissed: false,
        paused: false,
        role: dbUser?.role ?? user.role,
        tasksCompleted: [],
      };
    } else {
      if (typeof body.completed === "boolean") current.completed = body.completed;
      if (typeof body.stepIndex === "number") current.stepIndex = body.stepIndex;
      if (typeof body.dismissed === "boolean") current.dismissed = body.dismissed;
      if (typeof body.paused === "boolean") current.paused = body.paused;
      if (body.taskCompleted) {
        const set = new Set(current.tasksCompleted ?? []);
        set.add(body.taskCompleted);
        current.tasksCompleted = Array.from(set);
      }
    }

    current.role = dbUser?.role ?? user.role;
    current.updatedAt = new Date().toISOString();

    const serialized = JSON.stringify(current);

    await db.user.update({
      where: { id: user.id },
      data: { tourState: serialized },
    });

    return NextResponse.json({ ok: true, state: current });
  } catch (e) {
    return jsonError(e);
  }
}
