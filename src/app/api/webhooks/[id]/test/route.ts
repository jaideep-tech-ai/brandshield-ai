import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";
import { deliverWebhook } from "@/lib/brandshield/server/webhooks";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await context.params;

    const endpoint = await db.webhookEndpoint.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!endpoint) {
      return NextResponse.json({ error: "Webhook endpoint not found." }, { status: 404 });
    }

    const testPayload = JSON.stringify({
      id: `evt_test_${Date.now()}`,
      event: "webhook.test_ping",
      timestamp: new Date().toISOString(),
      organizationId: user.orgId,
      data: {
        message: "BrandShield AI test webhook dispatch",
        tester: user.name,
        role: user.role,
        sentAt: new Date().toISOString(),
      },
    });

    const result = await deliverWebhook(endpoint, "webhook.test_ping", testPayload);

    return NextResponse.json({
      delivered: result.success,
      status: result.status,
      error: result.error,
    });
  } catch (e) {
    return jsonError(e);
  }
}

