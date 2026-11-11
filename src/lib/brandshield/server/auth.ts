import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import type { SessionUser } from "../types";

const COOKIE_NAME = "bs_session";
const SECRET = process.env.SESSION_SECRET ?? "brandshield-dev-secret-2025";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

const MAX_SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { userId?: string; iat?: number };
    if (!data.userId) return null;
    if (typeof data.iat === "number" && Date.now() - data.iat > MAX_SESSION_AGE_MS) {
      return null; // Expired session token
    }
    return data.userId;
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: Request | { headers?: Headers | { get(name: string): string | null }; cookies?: { get(name: string): { value?: string } | undefined } }): Promise<SessionUser | null> {
  let token: string | undefined | null = null;

  // 1. Extract from passed request object if available (e.g. NextRequest)
  if (req) {
    if ("cookies" in req && typeof (req as { cookies?: { get(k: string): { value?: string } | undefined } }).cookies?.get === "function") {
      token = (req as { cookies: { get(k: string): { value?: string } | undefined } }).cookies.get(COOKIE_NAME)?.value;
    }
    if (!token && req.headers && typeof req.headers.get === "function") {
      const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
      }
    }
  }

  // 2. Fallback to Next.js cookies()
  if (!token) {
    try {
      const store = await cookies();
      token = store.get(COOKIE_NAME)?.value;
    } catch {
      // headers may throw in non-request contexts
    }
  }

  // 3. Fallback to Next.js headers()
  if (!token) {
    try {
      const reqHeaders = await headers();
      const authHeader = reqHeaders.get("authorization") || reqHeaders.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
      }
    } catch {
      // headers() may throw in non-request contexts
    }
  }

  const userId = verifySessionToken(token);
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as SessionUser["role"],
    department: user.department,
    avatarColor: user.avatarColor,
    orgId: user.orgId,
    orgName: user.organization.name,
    orgSlug: user.organization.slug,
    zeroDataRetention: user.organization.zeroDataRetention,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Not authenticated");
  return user;
}

export function requireRole(user: SessionUser, ...roles: SessionUser["role"][]) {
  if (!roles.includes(user.role)) {
    throw new HttpError(403, `This action requires one of: ${roles.join(", ")}. You are signed in as ${user.role}.`);
  }
}

export const SESSION_COOKIE = COOKIE_NAME;

export class HttpError extends Error {
  status: number;
  code?: string;
  upgradeTier?: string;
  constructor(status: number, message: string, code?: string, upgradeTier?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.upgradeTier = upgradeTier;
  }
}
