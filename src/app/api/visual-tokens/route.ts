import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireRole, requireUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const tokens = await db.visualToken.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(tokens);
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    requireRole(user, "admin");
    const body = (await req.json()) as { tokenType?: string; name?: string; value?: string; secondary?: string; usageNotes?: string };
    if (!body.tokenType || !body.name?.trim() || !body.value?.trim()) {
      return NextResponse.json({ error: "tokenType, name and value are required" }, { status: 400 });
    }
    const token = await db.visualToken.create({
      data: {
        orgId: user.orgId,
        tokenType: body.tokenType,
        name: body.name.trim(),
        value: body.value.trim(),
        secondary: body.secondary?.trim() || null,
        usageNotes: body.usageNotes?.trim() || null,
      },
    });
    return NextResponse.json(token);
  } catch (e) {
    return jsonError(e);
  }
}
