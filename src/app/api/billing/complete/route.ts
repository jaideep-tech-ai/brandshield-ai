import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, requireRole } from "@/lib/brandshield/server/auth";
import { appendAuditLog } from "@/lib/brandshield/server/engine";
import { jsonError } from "@/lib/brandshield/server/json";
import { TIER_META } from "@/lib/brandshield/types";

/**
 * Completes a checkout session (sandbox) — equivalent to the production
 * stripeWebhook handler for checkout.session.completed: verifies the session,
 * maps tier → quota, and syncs the organization subscription record.
 */
const sandboxSessions = globalThis as typeof globalThis & { __bsCheckoutSessions?: Map<string, string> };

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    requireRole(user, "admin");
    const body = (await req.json()) as { sessionId?: string; tier?: string };
    if (!body.sessionId?.startsWith("cs_")) {
      return NextResponse.json({ error: "Invalid checkout session" }, { status: 400 });
    }
    // Resolve tier from the sandbox session (falls back to request body)
    const tier = sandboxSessions.__bsCheckoutSessions?.get(body.sessionId) ?? body.tier;
    if (!tier || !["starter", "growth", "enterprise"].includes(tier)) {
      return NextResponse.json({ error: "Invalid checkout session" }, { status: 400 });
    }
    sandboxSessions.__bsCheckoutSessions?.delete(body.sessionId);
    const meta = TIER_META[tier as keyof typeof TIER_META];
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const sub = await db.subscription.upsert({
      where: { orgId: user.orgId },
      create: {
        orgId: user.orgId,
        tier,
        status: "active",
        scanLimit: meta.scanLimit,
        seats: tier === "starter" ? 5 : tier === "growth" ? 12 : 50,
        priceCents: meta.price * 100,
        currentPeriodEnd: periodEnd,
      },
      update: {
        tier,
        status: "active",
        scanLimit: meta.scanLimit,
        priceCents: meta.price * 100,
        currentPeriodEnd: periodEnd,
      },
    });
    await appendAuditLog({
      orgId: user.orgId,
      submissionId: null,
      actorId: user.id,
      action: "SUBSCRIPTION",
      details: { event: "checkout.completed", tier, seats: sub.seats, sandbox: true },
    });
    return NextResponse.json({
      tier: sub.tier,
      status: sub.status,
      scanLimit: sub.scanLimit,
      scansUsed: sub.scansUsed,
      seats: sub.seats,
      priceCents: sub.priceCents,
      currentPeriodEnd: sub.currentPeriodEnd,
    });
  } catch (e) {
    return jsonError(e);
  }
}
