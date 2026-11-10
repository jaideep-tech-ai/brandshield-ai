import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";
import { validateSsrfSafeUrl } from "@/lib/brandshield/server/ssrf";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Only Admins can delete webhook endpoints." }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await db.webhookEndpoint.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook endpoint not found." }, { status: 404 });
    }

    await db.webhookEndpoint.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Only Admins can update webhook endpoints." }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await db.webhookEndpoint.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook endpoint not found." }, { status: 404 });
    }

    const body = (await req.json()) as {
      active?: boolean;
      url?: string;
      events?: string[];
      name?: string;
    };

    const updateData: Record<string, unknown> = {};

    if (typeof body.active === "boolean") {
      updateData.active = body.active;
    }
    if (typeof body.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
    }
    if (Array.isArray(body.events)) {
      updateData.events = JSON.stringify(body.events);
    }
    if (body.url) {
      const ssrfCheck = await validateSsrfSafeUrl(body.url);
      if (!ssrfCheck.valid) {
        return NextResponse.json({ error: `Invalid URL: ${ssrfCheck.reason}` }, { status: 400 });
      }
      updateData.url = body.url.trim();
    }

    const updated = await db.webhookEndpoint.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      endpoint: {
        id: updated.id,
        name: updated.name,
        url: updated.url,
        active: updated.active,
        events: JSON.parse(updated.events),
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}

