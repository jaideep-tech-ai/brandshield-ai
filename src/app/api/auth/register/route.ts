import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken } from "@/lib/brandshield/server/auth";
import { ensureSeed } from "@/lib/brandshield/server/seed";
import { jsonError } from "@/lib/brandshield/server/json";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(["creator", "reviewer", "contractor", "admin"]);
const AVATAR_COLORS = ["#0F766E", "#B45309", "#7C2D12", "#4D7C0F", "#6D28D9", "#BE185D"];

function firebaseError(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

/**
 * Firebase-Auth-compatible email/password account creation.
 * Mirrors `createUserWithEmailAndPassword` semantics and error codes:
 *   auth/invalid-email · auth/missing-password · auth/weak-password
 *   auth/email-already-in-use
 */
export async function POST(req: NextRequest) {
  try {
    await ensureSeed();
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
      role?: string;
      department?: string;
    };

    const email = body.email?.toLowerCase().trim() ?? "";
    const password = body.password ?? "";
    const name = body.name?.trim() ?? "";
    const role = VALID_ROLES.has(body.role ?? "") ? (body.role as string) : "creator";
    const department = body.department?.trim() || null;

    if (!email || !EMAIL_RE.test(email)) {
      return firebaseError("auth/invalid-email", "That email address doesn't look right. Check the format — e.g. you@company.com.", 400);
    }
    if (!password) {
      return firebaseError("auth/missing-password", "Please enter a password.", 400);
    }
    if (password.length < 6) {
      return firebaseError("auth/weak-password", "Password should be at least 6 characters.", 400);
    }
    if (!name) {
      return firebaseError("auth/missing-name", "Please tell us your full name — it appears on reviews and audit logs.", 400);
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return firebaseError("auth/email-already-in-use", "An account with this email already exists. Try signing in instead.", 409);
    }

    // New teammates join the demo organization (Nimbus Labs) so the
    // workspace is pre-populated with the seeded brand repository.
    const org = await db.organization.findUnique({ where: { slug: "nimbus-labs" } });
    if (!org) {
      return firebaseError("server/org-unavailable", "Workspace is initializing. Try again in a moment.", 503);
    }

    const user = await db.user.create({
      data: {
        email,
        name,
        password,
        role,
        department,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        orgId: org.id,
      },
      include: { organization: true },
    });

    const res = NextResponse.json({
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
    });
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
