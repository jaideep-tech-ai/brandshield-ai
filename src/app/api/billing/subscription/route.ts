import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

export async function GET() {
  try {
    const user = await requireUser();
    let sub = await db.subscription.findUnique({ where: { orgId: user.orgId } });
    if (!sub) {
      sub = await db.subscription.create({ data: { orgId: user.orgId, tier: "starter", scanLimit: 50, priceCents: 4900, seats: 5 } });
    }
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
