import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken } from "@/lib/brandshield/server/auth";
import { forceSeedDemoWorkspace } from "@/lib/brandshield/server/seed";
import { jsonError } from "@/lib/brandshield/server/json";

export async function POST(req: NextRequest) {
  try {
    let targetRole: string | undefined;
    try {
      const body = (await req.json()) as { role?: string };
      targetRole = body.role;
    } catch {
      // Empty body is valid
    }

    // Ensure the enterprise evaluation workspace exists in this environment
    await forceSeedDemoWorkspace();

    const roleMap: Record<string, string> = {
      admin: "elena@nimbus.demo",
      reviewer: "marcus@nimbus.demo",
      creator: "ava@nimbus.demo",
      contractor: "priya@pixelworks.demo",
    };

    const targetEmail = (targetRole && roleMap[targetRole]) || "elena@nimbus.demo";
    let user = await db.user.findUnique({
      where: { email: targetEmail },
      include: { organization: true },
    });

    if (!user) {
      // Fallback to any user in the database
      user = await db.user.findFirst({
        include: { organization: true },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "Failed to initialize auto-login user" }, { status: 500 });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      avatarColor: user.avatarColor,
      orgId: user.orgId,
      orgName: user.organization.name,
      orgSlug: user.organization.slug,
      zeroDataRetention: user.organization.zeroDataRetention,
    };

    const res = NextResponse.json(payload);
    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e) {
    return jsonError(e);
  }
}
