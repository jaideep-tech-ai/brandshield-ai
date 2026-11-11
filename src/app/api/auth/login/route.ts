import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken } from "@/lib/brandshield/server/auth";
import { ensureSeed } from "@/lib/brandshield/server/seed";
import { jsonError } from "@/lib/brandshield/server/json";
import { hashPassword, verifyPassword } from "@/lib/brandshield/server/password";
import { checkRateLimit, clientIp } from "@/lib/brandshield/server/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Brute-force guard: 15 attempts / 15 minutes / IP — then 429.
const LOGIN_LIMIT = { limit: 15, windowMs: 15 * 60 * 1000 };

function firebaseError(code: string, message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, code, ...extra }, { status });
}

/**
 * Firebase-Auth-compatible email/password sign-in.
 * Mirrors `signInWithEmailAndPassword` semantics and error codes:
 *   auth/invalid-email · auth/user-not-found · auth/wrong-password ·
 *   auth/too-many-requests
 *
 * Security notes:
 *   • Passwords verified in constant time against salted scrypt hashes.
 *   • Rows still carrying a legacy plaintext password (early demo build) are
 *     verified transparently and re-hashed on the fly — zero-downtime migration.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureSeed();

    // ── Rate limit (before any DB read) ──
    const rl = checkRateLimit(`login:${clientIp(req)}`, LOGIN_LIMIT.limit, LOGIN_LIMIT.windowMs);
    if (!rl.ok) {
      return firebaseError(
        "auth/too-many-requests",
        `Too many sign-in attempts. Please wait ${Math.ceil(rl.retryAfterSec / 60)} minute(s) and try again.`,
        429,
        { retryAfterSec: rl.retryAfterSec }
      );
    }

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
        "No account found for this email. Please check the address or create an account on the “Create account” tab.",
        401
      );
    }

    const { valid, needsUpgrade } = await verifyPassword(password ?? "", user.password);
    if (!valid) {
      return firebaseError("auth/wrong-password", "Incorrect password. Please verify your credentials and try again.", 401);
    }

    // Transparently upgrade legacy plaintext rows to salted scrypt hashes.
    if (needsUpgrade) {
      await db.user.update({ where: { id: user.id }, data: { password: await hashPassword(password) } });
    }

    const sessionToken = createSessionToken(user.id);
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
      token: sessionToken,
    });
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
