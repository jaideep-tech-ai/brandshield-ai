import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { db } from "@/lib/db";
import { appendAuditLog } from "@/lib/brandshield/server/engine";
import {
  getValidGitLabToken,
  deleteGitLabProjectWebhook,
  GITLAB_NONCE_COOKIE,
} from "@/lib/brandshield/server/gitlab";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const connection = await db.gitLabConnection.findFirst({
    where: { orgId: user.orgId },
  });

  if (!connection) {
    return NextResponse.json({
      success: true,
      message: "No active GitLab connection found to disconnect.",
    });
  }

  let remoteWebhookDeleted = false;
  let remoteCleanupWarning: string | null = null;

  // Attempt to delete remote webhook on GitLab if webhookId exists
  if (connection.projectId && connection.webhookId) {
    try {
      let token: string | null = null;
      if (connection.encryptedAccessToken) {
        try {
          token = await getValidGitLabToken(connection);
        } catch (tokErr) {
          console.warn("[GitLab Disconnect] Token decryption warning:", tokErr);
        }
      }
      if (!token && process.env.GITLAB_ACCESS_TOKEN?.trim()) {
        token = process.env.GITLAB_ACCESS_TOKEN.trim();
      }

      if (token) {
        remoteWebhookDeleted = await deleteGitLabProjectWebhook(
          token,
          connection.projectId,
          connection.webhookId
        );
      }
    } catch (cleanupErr: unknown) {
      remoteCleanupWarning = cleanupErr instanceof Error ? cleanupErr.message : "Remote cleanup error";
      console.warn("[GitLab Disconnect] Remote webhook deletion warning:", remoteCleanupWarning);
    }
  }

  try {
    // Reset connection state to disconnected and clear project/webhook binding
    await db.gitLabConnection.update({
      where: { id: connection.id },
      data: {
        status: "disconnected",
        webhookId: null,
        projectId: null,
        projectName: null,
        projectPath: null,
        projectUrl: null,
        projectVisibility: null,
        encryptedWebhookSecret: null,
        lastEventStatus: null,
        lastEventError: null,
      },
    });

    // Deactivate any matching WebhookEndpoint records
    await db.webhookEndpoint.updateMany({
      where: {
        orgId: user.orgId,
        name: { contains: "GitLab" },
      },
      data: { active: false },
    });

    // Record tamper-evident cryptographic audit log
    await appendAuditLog({
      orgId: user.orgId,
      submissionId: null,
      actorId: user.id,
      action: "INTEGRATION_DISCONNECT_GITLAB",
      details: {
        provider: "gitlab",
        projectId: connection.projectId,
        projectPath: connection.projectPath,
        webhookId: connection.webhookId,
        remoteWebhookDeleted,
        remoteCleanupWarning,
        timestamp: new Date().toISOString(),
      },
    });

    const res = NextResponse.json({
      success: true,
      message: "GitLab integration disconnected successfully.",
      remoteWebhookDeleted,
      remoteCleanupWarning,
    });

    res.cookies.delete(GITLAB_NONCE_COOKIE);
    return res;
  } catch (dbErr: unknown) {
    const msg = dbErr instanceof Error ? dbErr.message : "Database error";
    console.error("[GitLab Disconnect] Database update failed:", msg);
    return NextResponse.json(
      { error: "Failed to update connection status", details: msg },
      { status: 500 }
    );
  }
}
