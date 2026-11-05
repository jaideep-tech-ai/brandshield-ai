import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken } from "@/lib/brandshield/server/auth";
import { ensureSeed } from "@/lib/brandshield/server/seed";
import { jsonError } from "@/lib/brandshield/server/json";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function firebaseError(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

/**
 * Firebase-Auth-compatible email/password sign-in.
 * Mirrors `signInWithEmailAndPassword` semantics and error codes:
 *   auth/invalid-email · auth/user-not-found · auth/wrong-password
 */
export async function POST(req: NextRequest) {
  try {
    await ensureSeed();
    const { email: rawEmail, password } = (await req.json()) as { email?: string; password?: string };
    const email = rawEmail?.toLowerCase().trim() ?? "";

    if (!email || !password) {
      return firebaseError("auth/missing-credentials", "Email and password are required.", 400);
    }
    if (!EMAIL_RE.test(email)) {
      return firebaseError("auth/invalid-email", "That email address doesn't look right. Check the format — e.g. you@company.com.", 400);
    }

    const user = await db.user.findUnique({ where: { email }, include: { organization: true } });
    if (!user) {
      return firebaseError(
        "auth/user-not-found",
        "No account found for this email. Create one on the “Create account” tab, or use a one-click demo persona.",
        401
      );
    }
    if (user.password !== password) {
      return firebaseError("auth/wrong-password", "Incorrect password. Demo accounts use “demo1234”.", 401);
    }

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
