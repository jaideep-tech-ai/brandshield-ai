import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireRole } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    requireRole(user, "admin");
    const { id } = await params;
    const token = await db.visualToken.findUnique({ where: { id } });
    if (!token || token.orgId !== user.orgId) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }
    await db.visualToken.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
