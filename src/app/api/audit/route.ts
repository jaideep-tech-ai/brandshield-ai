import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const submissionId = req.nextUrl.searchParams.get("submissionId");
    const logs = await db.auditLog.findMany({
      where: {
        orgId: user.orgId,
        ...(submissionId ? { submissionId } : {}),
      },
      orderBy: { createdAt: "asc" },
      include: { actor: { select: { name: true } } },
      take: 200,
    });
    return NextResponse.json(
      logs.map((l) => ({
        id: l.id,
        orgId: l.orgId,
        submissionId: l.submissionId,
        actorId: l.actorId,
        actorName: l.actor.name,
        action: l.action,
        details: safeParse(l.details),
        contentHash: l.contentHash,
        prevHash: l.prevHash,
        createdAt: l.createdAt,
      }))
    );
  } catch (e) {
    return jsonError(e);
  }
}

function safeParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
