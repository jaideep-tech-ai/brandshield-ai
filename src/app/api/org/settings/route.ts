import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireRole } from "@/lib/brandshield/server/auth";
import { appendAuditLog } from "@/lib/brandshield/server/engine";
import { jsonError } from "@/lib/brandshield/server/json";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    requireRole(user, "admin");
    const body = (await req.json()) as { zeroDataRetention?: boolean; name?: string };
    const org = await db.organization.update({
      where: { id: user.orgId },
      data: {
        ...(typeof body.zeroDataRetention === "boolean" ? { zeroDataRetention: body.zeroDataRetention } : {}),
        ...(body.name?.trim() ? { name: body.name.trim() } : {}),
      },
    });
    if (typeof body.zeroDataRetention === "boolean") {
      await appendAuditLog({
        orgId: user.orgId,
        submissionId: null,
        actorId: user.id,
        action: "SETTINGS",
        details: { zeroDataRetention: body.zeroDataRetention },
      });
    }
    return NextResponse.json({ ok: true, name: org.name, zeroDataRetention: org.zeroDataRetention });
  } catch (e) {
    return jsonError(e);
  }
}
