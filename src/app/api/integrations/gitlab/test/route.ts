import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { db } from "@/lib/db";
import { decryptToken } from "@/lib/brandshield/server/crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const connection = await db.gitLabConnection.findFirst({
    where: { orgId: user.orgId },
  });

  if (!connection || !connection.projectId || !connection.encryptedWebhookSecret) {
    return NextResponse.json(
      {
        error: "GitLab integration not configured",
        message: "Please connect a GitLab repository and configure webhooks before testing.",
      },
      { status: 400 }
    );
  }

  const org = await db.organization.findUnique({
    where: { id: user.orgId },
    select: { id: true, slug: true, name: true },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  let webhookSecret: string;
  try {
    webhookSecret = decryptToken(connection.encryptedWebhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to decrypt configured webhook secret", details: String(err) },
      { status: 500 }
    );
  }

  const origin =
    process.env.NEXTAUTH_URL?.split(/\r?\n/)[0]?.trim() ||
    req.nextUrl.origin ||
    "https://brandshield-ai-five.vercel.app";
  const webhookUrl = `${origin}/api/webhooks/incoming/prepublish?orgSlug=${encodeURIComponent(org.slug)}`;

  const syntheticPayload = {
    object_kind: "push",
    event_name: "push",
    before: "0000000000000000000000000000000000000000",
    after: "1111111111111111111111111111111111111111",
    ref: "refs/heads/main",
    checkout_sha: "1111111111111111111111111111111111111111",
    project_id: Number(connection.projectId) || 12345,
    project: {
      id: Number(connection.projectId) || 12345,
      name: connection.projectName || "brandshield-test",
      web_url: connection.projectUrl || "https://gitlab.com",
      path_with_namespace: connection.projectPath || "org/repo",
    },
    commits: [
      {
        id: "1111111111111111111111111111111111111111",
        title: "[BrandShield Test] Synthetic integration connectivity ping",
        message: "[BrandShield Test] Synthetic integration connectivity ping",
        timestamp: new Date().toISOString(),
        author: {
          name: "BrandShield AI Health Checker",
          email: "healthcheck@brandshield.ai",
        },
        added: [],
        modified: [],
        removed: [],
      },
    ],
    total_commits_count: 1,
    user_name: "BrandShield AI",
    user_email: "healthcheck@brandshield.ai",
    isSyntheticTest: true,
  };

  const startTime = Date.now();
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gitlab-Token": webhookSecret,
        "X-Gitlab-Event": "Push Hook",
        "User-Agent": "GitLab/19.5.3 (BrandShield-Synthetic-Test)",
      },
      body: JSON.stringify(syntheticPayload),
    });

    const latencyMs = Date.now() - startTime;
    const resJson = await res.json().catch(() => ({}));

    if (!res.ok) {
      await db.gitLabConnection.update({
        where: { id: connection.id },
        data: {
          lastEventAt: new Date(),
          lastEventStatus: "FAILED",
          lastEventError: `HTTP ${res.status}: ${resJson.error || "Receiver error"}`,
        },
      });

      return NextResponse.json(
        {
          success: false,
          status: res.status,
          latencyMs,
          error: resJson.error || "Webhook test request returned non-200 status",
          details: resJson,
        },
        { status: 200 }
      );
    }

    await db.gitLabConnection.update({
      where: { id: connection.id },
      data: {
        lastEventAt: new Date(),
        lastEventStatus: "PASSED",
        lastEventError: null,
      },
    });

    return NextResponse.json({
      success: true,
      status: 200,
      latencyMs,
      verdict: "PASSED",
      message: "Synthetic test event successfully verified and processed by prepublish receiver.",
      diagnostics: {
        endpoint: webhookUrl,
        responseStatus: res.status,
        latencyMs,
        auditEngineResponse: resJson,
      },
    });
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : "Network error";
    console.error("[GitLab Test API] Test execution failed:", msg);

    await db.gitLabConnection.update({
      where: { id: connection.id },
      data: {
        lastEventAt: new Date(),
        lastEventStatus: "FAILED",
        lastEventError: msg,
      },
    });

    return NextResponse.json(
      {
        success: false,
        latencyMs,
        error: "Failed to dispatch test event to prepublish receiver",
        details: msg,
      },
      { status: 500 }
    );
  }
}

