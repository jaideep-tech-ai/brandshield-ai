import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken } from "@/lib/brandshield/server/auth";
import { ensureSeed } from "@/lib/brandshield/server/seed";
import { jsonError } from "@/lib/brandshield/server/json";
import { hashPassword } from "@/lib/brandshield/server/password";
import { checkRateLimit, clientIp } from "@/lib/brandshield/server/rate-limit";
import { provisionWorkspace } from "@/lib/brandshield/server/workspace";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(["creator", "reviewer", "contractor", "admin"]);

// Scaling guard: a burst of automated signups gets 429s, not 1000 rows.
const REGISTER_LIMIT = { limit: 8, windowMs: 60 * 60 * 1000 }; // 8 signups / hour / IP

function firebaseError(code: string, message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, code, ...extra }, { status });
}

/**
 * Firebase-Auth-compatible email/password account creation.
 * Mirrors `createUserWithEmailAndPassword` semantics and error codes:
 *   auth/invalid-email · auth/missing-password · auth/weak-password ·
 *   auth/email-already-in-use · auth/too-many-requests
 *
 * Consistency contract (see server/workspace.ts):
 *   • Every account provisions its OWN workspace in one atomic transaction.
 *   • Email is globally unique and stored lower-cased — duplicates are
 *     impossible at the schema level and rejected with 409 at the API level.
 *   • Passwords are stored as salted scrypt hashes, never plaintext.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureSeed();

    // ── Rate limit (before any DB write) ──
    const rl = checkRateLimit(`register:${clientIp(req)}`, REGISTER_LIMIT.limit, REGISTER_LIMIT.windowMs);
    if (!rl.ok) {
      return firebaseError(
        "auth/too-many-requests",
        `Too many accounts created from this network. Please try again in about ${Math.ceil(rl.retryAfterSec / 60)} minute(s).`,
        429,
        { retryAfterSec: rl.retryAfterSec }
      );
    }

    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
      role?: string;
      department?: string;
      organizationName?: string;
    };

    const email = body.email?.toLowerCase().trim() ?? "";
    const password = body.password ?? "";
    const name = body.name?.trim() ?? "";
    const role = VALID_ROLES.has(body.role ?? "") ? (body.role as string) : "creator";
    const department = body.department?.trim() || null;
    const organizationName = body.organizationName?.trim().slice(0, 60) || null;

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

    // ── Duplicate protection: unique index is the backstop, this is the UX ──
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return firebaseError(
        "auth/email-already-in-use",
        `An account with ${email} already exists. Sign in instead — or reset your password.`,
        409
      );
    }

    // ── Atomic provisioning: org + subscription + user (+ genesis audit) ──
    const passwordHash = await hashPassword(password);
    const { user, organization } = await provisionWorkspace({
      email,
      name,
      passwordHash,
      role,
      department,
      organizationName,
    });

    const res = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      avatarColor: user.avatarColor,
      orgId: user.orgId,
      orgName: organization.name,
      orgSlug: organization.slug,
      zeroDataRetention: organization.zeroDataRetention,
    });
    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    // Race guard: two concurrent signups with the same email — the DB unique
    // index wins; surface the friendly 409 instead of a 500.
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint") || msg.includes("P2002")) {
      return firebaseError("auth/email-already-in-use", "An account with this email already exists. Try signing in instead.", 409);
    }
    return jsonError(e);
  }
}
