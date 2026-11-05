import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

export async function GET() {
  try {
    const user = await requireUser();
    const members = await db.user.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, department: true, avatarColor: true },
    });
    return NextResponse.json(members);
  } catch (e) {
    return jsonError(e);
  }
}
