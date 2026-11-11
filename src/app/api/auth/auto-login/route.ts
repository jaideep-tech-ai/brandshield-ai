import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken, verifySessionToken } from "@/lib/brandshield/server/auth";
import { forceSeedDemoWorkspace } from "@/lib/brandshield/server/seed";
import { jsonError } from "@/lib/brandshield/server/json";

// In-memory sliding-window rate limiter for auto-login (10 req/min per IP)
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (timestamps.length >= limit) {
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip")?.trim() ||
      "127.0.0.1";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many auto-login requests. Please wait a minute before retrying." },
        { status: 429 }
      );
    }

    let requestedRole: string | undefined;
    try {
      const body = (await req.json()) as { role?: string };
      requestedRole = body.role;
    } catch {
      // Empty body is valid
    }

    // 2. Ensure isolated demo evaluation workspace exists
    await forceSeedDemoWorkspace();

    // 3. Security Policy: Server-Controlled Demo Roles
    // Unauthenticated public requests CANNOT claim production admin access or access customer data.
    // Public auto-login is strictly locked to restricted demo evaluation accounts in 'nimbus-labs'.
    const sessionTokenFromCookie = req.cookies.get(SESSION_COOKIE)?.value;
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const sessionTokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const existingUserId = verifySessionToken(sessionTokenFromCookie || sessionTokenFromHeader);

    let isAdminAuthenticated = false;
    if (existingUserId) {
      const existingUser = await db.user.findUnique({ where: { id: existingUserId } });
      isAdminAuthenticated = existingUser?.role === "admin";
    }

    // Non-admin public visitors are strictly assigned to the restricted Reviewer persona (Marcus Reed)
    // or Creator persona (Ava Chen). Admin escalation is blocked.
    let targetEmail = "marcus@nimbus.demo"; // Default safe evaluation persona: Reviewer
    if (requestedRole === "creator") {
      targetEmail = "ava@nimbus.demo";
    } else if (requestedRole === "contractor") {
      targetEmail = "priya@pixelworks.demo";
    } else if (requestedRole === "admin" && isAdminAuthenticated) {
      targetEmail = "elena@nimbus.demo";
    } else if (requestedRole === "admin") {
      // Deny public admin privilege escalation; route to restricted reviewer persona
      targetEmail = "marcus@nimbus.demo";
    }

    let user = await db.user.findFirst({
      where: {
        email: targetEmail,
        organization: { slug: "nimbus-labs" },
      },
      include: { organization: true },
    });

    if (!user) {
      // Fallback only within the isolated demo organization
      user = await db.user.findFirst({
        where: { organization: { slug: "nimbus-labs" } },
        include: { organization: true },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Demo evaluation workspace is initializing. Please retry in a few seconds." },
        { status: 503 }
      );
    }

    const sessionToken = createSessionToken(user.id);
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
      token: sessionToken,
    };

    const isProduction = process.env.NODE_ENV === "production";
    const res = NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });

    res.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e) {
    return jsonError(e);
  }
}

