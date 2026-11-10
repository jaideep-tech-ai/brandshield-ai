import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const configured = Boolean(
    process.env.GITLAB_CLIENT_ID?.trim() && process.env.GITLAB_CLIENT_SECRET?.trim()
  );
  const patAvailable = Boolean(process.env.GITLAB_ACCESS_TOKEN?.trim());

  try {
    const connection = await db.gitLabConnection.findFirst({
      where: { orgId: user.orgId },
      select: {
        id: true,
        status: true,
        gitlabUserId: true,
        gitlabUsername: true,
        projectId: true,
        projectName: true,
        projectPath: true,
        projectUrl: true,
        projectVisibility: true,
        webhookId: true,
        encryptedWebhookSecret: true,
        lastEventAt: true,
        lastEventStatus: true,
        lastEventError: true,
        lastAuditId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!connection) {
      return NextResponse.json({
        configured,
        patAvailable,
        connected: false,
        status: "disconnected",
        gitlabUsername: null,
        projectId: null,
        projectName: null,
        projectPath: null,
        projectUrl: null,
        projectVisibility: null,
        webhookConfigured: false,
        lastEventAt: null,
        lastEventStatus: null,
        lastEventError: null,
        lastAuditId: null,
      });
    }

    const isConnected = connection.status === "connected" && Boolean(connection.projectId);

    return NextResponse.json({
      configured,
      patAvailable,
      connected: isConnected,
      status: connection.status,
      gitlabUsername: connection.gitlabUsername,
      projectId: connection.projectId,
      projectName: connection.projectName,
      projectPath: connection.projectPath,
      projectUrl: connection.projectUrl,
      projectVisibility: connection.projectVisibility,
      webhookId: connection.webhookId,
      webhookConfigured: Boolean(connection.webhookId && connection.encryptedWebhookSecret),
      lastEventAt: connection.lastEventAt ? connection.lastEventAt.toISOString() : null,
      lastEventStatus: connection.lastEventStatus,
      lastEventError: connection.lastEventError,
      lastAuditId: connection.lastAuditId,
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    console.error("[GitLab Status API] Error checking status:", msg);
    return NextResponse.json({ error: "Failed to retrieve status", details: msg }, { status: 500 });
  }
}

