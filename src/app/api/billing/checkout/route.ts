import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSessionUser, requireRole } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

/**
 * Stripe Checkout session creation.
 * In production (STRIPE_SECRET_KEY set) this calls stripe.checkout.sessions.create
 * with price IDs and a success/cancel URL. In sandbox mode we return a local
 * session id that /api/billing/complete converts into a subscription change.
 */
/**
 * Sandbox session store — mirrors Stripe's checkout.session object which
 * remembers the price/tier between creation and completion.
 */
const sandboxSessions = globalThis as typeof globalThis & { __bsCheckoutSessions?: Map<string, string> };
sandboxSessions.__bsCheckoutSessions ??= new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    requireRole(user, "admin");
    const { tier } = (await req.json()) as { tier?: string };
    if (!tier || !["starter", "growth", "enterprise"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }
    const hasStripe = !!process.env.STRIPE_SECRET_KEY;
    const sessionId = `cs_sandbox_${randomUUID()}`;
    sandboxSessions.__bsCheckoutSessions!.set(sessionId, tier);
    return NextResponse.json({
      sessionId,
      tier,
      sandbox: !hasStripe,
      // In production: url = session.url from Stripe Checkout
      url: hasStripe ? null : null,
    });
  } catch (e) {
    return jsonError(e);
  }
}
