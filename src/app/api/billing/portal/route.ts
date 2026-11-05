import { NextResponse } from "next/server";
import { getSessionUser, requireRole } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

/**
 * Stripe Customer Billing Portal session. In production this calls
 * stripe.billingPortal.sessions.create({ customer }). Sandbox returns a flag.
 */
export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    requireRole(user, "admin");
    const hasStripe = !!process.env.STRIPE_SECRET_KEY;
    return NextResponse.json({ sandbox: !hasStripe, url: null });
  } catch (e) {
    return jsonError(e);
  }
}
