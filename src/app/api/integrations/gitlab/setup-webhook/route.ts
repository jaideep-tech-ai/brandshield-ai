import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { db } from "@/lib/db";
import { encryptToken } from "@/lib/brandshield/server/crypto";
import { appendAuditLog } from "@/lib/brandshield/server/engine";
import {
  getValidGitLabToken,
  createGitLabProjectWebhook,
  deleteGitLabProjectWebhook,
} from "@/lib/brandshield/server/gitlab";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { projectId } = body;

  if (!projectId) {
    return NextResponse.json({ error: "Missing required projectId in request body" }, { status: 400 });
  }

  // 1. Fetch organization details to dynamically resolve slug (never hardcode nimbus-labs)
  const org = await db.organization.findUnique({
    where: { id: user.orgId },
    select: { id: true, name: true, slug: true },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // 2. Resolve valid GitLab access token
  const connection = await db.gitLabConnection.findFirst({
    where: { orgId: user.orgId },
  });

  let token: string | null = null;
  if (connection && connection.encryptedAccessToken) {
    try {
      token = await getValidGitLabToken(connection);
    } catch (err) {
      console.error("[GitLab Setup Webhook] Token resolution error:", err);
    }
  }

  if (!token && process.env.GITLAB_ACCESS_TOKEN?.trim()) {
    token = process.env.GITLAB_ACCESS_TOKEN.trim();
  }

  if (!token) {
    return NextResponse.json(
      {
        error: "No active GitLab authorization found.",
        message: "Please connect your GitLab account first.",
      },
      { status: 400 }
    );
  }

  // 3. Fetch authoritative project metadata from GitLab API
  const encodedProjectId = encodeURIComponent(String(projectId));
  let projectMeta: {
    id: number | string;
    name: string;
    path_with_namespace: string;
    web_url: string;
    visibility: string;
  };

  try {
    const metaRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedProjectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "BrandShield-AI",
      },
    });

    if (!metaRes.ok) {
      const errText = await metaRes.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Failed to access project on GitLab (${metaRes.status})`,
          details: errText || "Insufficient project permissions or project not found.",
        },
        { status: metaRes.status }
      );
    }

    projectMeta = await metaRes.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    return NextResponse.json({ error: "Failed to communicate with GitLab API", details: msg }, { status: 502 });
  }

  // 4. Generate a unique cryptographically secure webhook secret per connected project
  const rawWebhookSecret = `whsec_gl_${randomBytes(24).toString("hex")}`;
  const encryptedWebhookSecret = encryptToken(rawWebhookSecret);

  // 5. Construct authoritative destination URL with dynamic customer orgSlug
  const origin =
    process.env.NEXTAUTH_URL?.split(/\r?\n/)[0]?.trim() ||
    req.nextUrl.origin ||
    "https://brandshield-ai-five.vercel.app";
  const webhookUrl = `${origin}/api/webhooks/incoming/prepublish?orgSlug=${encodeURIComponent(org.slug)}`;

  // 6. Automatically provision webhook on GitLab via REST API
  let createdHook: { id: number; url: string };
  try {
    createdHook = await createGitLabProjectWebhook(token, projectId, webhookUrl, rawWebhookSecret);
  } catch (hookErr: unknown) {
    const msg = hookErr instanceof Error ? hookErr.message : "Webhook creation failed";
    console.warn("[GitLab Setup Webhook] Automated creation failed:", msg);

    // Provide safe manual fallback instructions if permissions prevent automated webhook setup
    return NextResponse.json(
      {
        success: false,
        requiresManualSetup: true,
        error: "Automated webhook provisioning failed. You may need Maintainer or Owner role on this GitLab repository.",
        details: msg,
        fallbackInstructions: {
          webhookUrl,
          events: ["Push events", "Merge requests events"],
          sslVerification: true,
          documentationUrl: "https://docs.gitlab.com/ee/user/project/integrations/webhooks.html",
        },
      },
      { status: 403 }
    );
  }

  // 7. Store connection in database with rollback safety on GitLab if DB fails
  try {
    if (connection) {
      await db.gitLabConnection.update({
        where: { id: connection.id },
        data: {
          projectId: String(projectMeta.id),
          projectName: projectMeta.name,
          projectPath: projectMeta.path_with_namespace,
          projectUrl: projectMeta.web_url,
          projectVisibility: projectMeta.visibility,
          webhookId: createdHook.id,
          encryptedWebhookSecret,
          status: "connected",
          lastEventError: null,
        },
      });
    } else {
      await db.gitLabConnection.create({
        data: {
          orgId: user.orgId,
          userId: user.id,
          projectId: String(projectMeta.id),
          projectName: projectMeta.name,
          projectPath: projectMeta.path_with_namespace,
          projectUrl: projectMeta.web_url,
          projectVisibility: projectMeta.visibility,
          webhookId: createdHook.id,
          encryptedAccessToken: encryptToken(token),
          encryptedWebhookSecret,
          status: "connected",
        },
      });
    }

    // 8. Create or update linked WebhookEndpoint record for platform consistency
    try {
      const existingEndpoint = await db.webhookEndpoint.findFirst({
        where: { orgId: user.orgId, url: webhookUrl },
      });

      if (existingEndpoint) {
        await db.webhookEndpoint.update({
          where: { id: existingEndpoint.id },
          data: {
            secret: encryptedWebhookSecret,
            active: true,
            name: `GitLab Webhook for ${projectMeta.path_with_namespace}`,
          },
        });
      } else {
        await db.webhookEndpoint.create({
          data: {
            orgId: user.orgId,
            url: webhookUrl,
            secret: encryptedWebhookSecret,
            events: JSON.stringify(["push", "merge_request"]),
            active: true,
            name: `GitLab Webhook for ${projectMeta.path_with_namespace}`,
          },
        });
      }
    } catch (endpointErr) {
      console.warn("[GitLab Setup Webhook] Non-critical WebhookEndpoint sync notice:", endpointErr);
    }

    // 9. Record tamper-evident cryptographic audit log
    await appendAuditLog({
      orgId: user.orgId,
      submissionId: null,
      actorId: user.id,
      action: "GITLAB_WEBHOOK_CONFIGURED",
      details: {
        projectId: String(projectMeta.id),
        projectPath: projectMeta.path_with_namespace,
        webhookId: createdHook.id,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "GitLab project connected and webhook configured successfully.",
      project: {
        id: String(projectMeta.id),
        name: projectMeta.name,
        pathWithNamespace: projectMeta.path_with_namespace,
        webUrl: projectMeta.web_url,
        visibility: projectMeta.visibility,
        webhookId: createdHook.id,
      },
    });
  } catch (dbErr: unknown) {
    const dbErrMsg = dbErr instanceof Error ? dbErr.message : "Database persistence failure";
    console.error("[GitLab Setup Webhook] Database persistence failed. Attempting rollback on GitLab...", dbErrMsg);

    // Rollback: delete the webhook created on GitLab to avoid orphaned remote hooks
    try {
      await deleteGitLabProjectWebhook(token, projectId, createdHook.id);
      console.log("[GitLab Setup Webhook] Rollback successful. Remote hook deleted.");
    } catch (rollbackErr) {
      console.error("[GitLab Setup Webhook] Rollback cleanup warning:", rollbackErr);
    }

    return NextResponse.json(
      {
        error: "Failed to save webhook connection to database. The remote webhook was rolled back.",
        details: dbErrMsg,
      },
      { status: 500 }
    );
  }
}
