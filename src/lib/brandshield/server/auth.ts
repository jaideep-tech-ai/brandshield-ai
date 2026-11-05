import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
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

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const { userId } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { userId: string };
    return userId ?? null;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const userId = verifySessionToken(store.get(COOKIE_NAME)?.value);
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
