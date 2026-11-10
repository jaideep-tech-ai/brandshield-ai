import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";
import { generateWebhookSecret } from "@/lib/brandshield/server/webhooks";
import { validateSsrfSafeUrl } from "@/lib/brandshield/server/ssrf";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const endpoints = await db.webhookEndpoint.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { deliveries: true },
        },
      },
    });

    return NextResponse.json({
      endpoints: endpoints.map((ep) => ({
        id: ep.id,
        name: ep.name,
        url: ep.url,
        secretPreview: `${ep.secret.slice(0, 10)}...`,
        events: JSON.parse(ep.events || "[]"),
        active: ep.active,
        deliveryCount: ep._count.deliveries,
        createdAt: ep.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Only Brand Directors (Admins) can configure webhook endpoints." }, { status: 403 });
    }

    const body = (await req.json()) as {
      name?: string;
      url?: string;
      events?: string[];
    };

    const name = body.name?.trim() || "Default Pre-Publish Webhook";
    const url = body.url?.trim();
    const events = Array.isArray(body.events) && body.events.length > 0 ? body.events : ["*"];

    if (!url) {
      return NextResponse.json({ error: "Webhook destination URL is required." }, { status: 400 });
    }

    const ssrfCheck = await validateSsrfSafeUrl(url);
    if (!ssrfCheck.valid) {
      return NextResponse.json({ error: `Invalid webhook destination: ${ssrfCheck.reason}` }, { status: 400 });
    }

    const secret = generateWebhookSecret();

    const created = await db.webhookEndpoint.create({
      data: {
        orgId: user.orgId,
        name,
        url,
        secret,
        events: JSON.stringify(events),
        active: true,
      },
    });

    return NextResponse.json(
      {
        endpoint: {
          id: created.id,
          name: created.name,
          url: created.url,
          secret: created.secret, // returned once upon creation
          events,
          active: created.active,
          createdAt: created.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (e) {
    return jsonError(e);
  }
}

