import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken, getSessionUser } from "@/lib/brandshield/server/auth";
import { ensureSeed } from "@/lib/brandshield/server/seed";
import { jsonError } from "@/lib/brandshield/server/json";
import type { Role, SessionUser } from "@/lib/brandshield/types";

const ROLE_PERSONAS: Record<Role, { email: string; name: string; department: string; avatarColor: string }> = {
  admin: {
    email: "elena@nimbus.demo",
    name: "Elena Rodriguez",
    department: "Marketing Leadership",
    avatarColor: "#4D7C0F",
  },
  reviewer: {
    email: "marcus@nimbus.demo",
    name: "Marcus Reed",
    department: "Brand & Legal",
    avatarColor: "#B45309",
  },
  creator: {
    email: "ava@nimbus.demo",
    name: "Ava Chen",
    department: "Content Studio",
    avatarColor: "#0F766E",
  },
  contractor: {
    email: "priya@pixelworks.demo",
    name: "Priya Sharma",
    department: "PixelWorks Agency",
    avatarColor: "#7C2D12",
  },
};

const VALID_ROLES = new Set<Role>(["admin", "reviewer", "creator", "contractor"]);

/**
 * POST /api/auth/switch-role
 *
 * Instant, sandbox-safe role switcher for testing and evaluating BrandShield AI:
 * - Brand Director (Super Admin) -> `admin`
 * - Compliance Officer -> `reviewer`
 * - Content Creator -> `creator`
 * - Auditor / Viewer -> `contractor`
 *
 * Updates the session cookie and resolves with the updated SessionUser.
 */
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json()) as { targetRole?: Role; personaEmail?: string };
    const targetRole = body.targetRole;
    if (!targetRole || !VALID_ROLES.has(targetRole)) {
      return NextResponse.json({ error: "Invalid target role specified." }, { status: 400 });
    }

    await ensureSeed();

    // Check if the current user belongs to the demo organization (nimbus-labs)
    const org = await db.organization.findUnique({
      where: { id: currentUser.orgId },
    });

    let targetUser: any = null;

    if (org?.slug === "nimbus-labs") {
      // Find the specific persona for this role in the demo workspace
      const personaInfo = ROLE_PERSONAS[targetRole];
      targetUser = await db.user.findUnique({
        where: { email: personaInfo.email },
        include: { organization: true },
      });

      if (!targetUser) {
        // Fallback: search for any user in this org with this role
        targetUser = await db.user.findFirst({
          where: { orgId: org.id, role: targetRole },
          include: { organization: true },
        });
      }
    }

    // In a custom enterprise or personal workspace, switch the current user's active role
    if (!targetUser) {
      targetUser = await db.user.update({
        where: { id: currentUser.id },
        data: { role: targetRole },
        include: { organization: true },
      });
    }

    const sessionToken = createSessionToken(targetUser.id);
    const sessionPayload = {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role as Role,
      department: targetUser.department,
      avatarColor: targetUser.avatarColor,
      orgId: targetUser.orgId,
      orgName: targetUser.organization.name,
      orgSlug: targetUser.organization.slug,
      zeroDataRetention: targetUser.organization.zeroDataRetention,
      token: sessionToken,
    };

    const res = NextResponse.json(sessionPayload);
    res.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (e) {
    return jsonError(e);
  }
}
