import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { db } from "@/lib/db";
import {
  getValidGitLabToken,
  fetchGitLabUserProjects,
  GitLabProjectSummary,
} from "@/lib/brandshield/server/gitlab";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const connection = await db.gitLabConnection.findFirst({
    where: { orgId: user.orgId },
  });

  let token: string | null = null;

  if (connection && connection.encryptedAccessToken) {
    try {
      token = await getValidGitLabToken(connection);
    } catch (err) {
      console.error("[GitLab Projects API] Token decryption/refresh error:", err);
    }
  }

  // Fallback to server GITLAB_ACCESS_TOKEN if configured and OAuth token is not present
  if (!token && process.env.GITLAB_ACCESS_TOKEN?.trim()) {
    token = process.env.GITLAB_ACCESS_TOKEN.trim();
  }

  if (!token) {
    return NextResponse.json(
      {
        error: "No active GitLab authorization found.",
        message: "Please click 'Connect GitLab' to authorize access to your repositories.",
      },
      { status: 400 }
    );
  }

  try {
    const rawProjects = await fetchGitLabUserProjects(token);

    const searchQuery = req.nextUrl.searchParams.get("search")?.toLowerCase().trim();
    let projects: GitLabProjectSummary[] = rawProjects;

    if (searchQuery) {
      projects = rawProjects.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery) ||
          p.pathWithNamespace.toLowerCase().includes(searchQuery) ||
          p.nameWithNamespace.toLowerCase().includes(searchQuery)
      );
    }

    return NextResponse.json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch projects";
    console.error("[GitLab Projects API] Error fetching repositories:", msg);

    if (msg.includes("401") && connection) {
      await db.gitLabConnection.update({
        where: { id: connection.id },
        data: { status: "failed", lastEventError: "OAuth token revoked or expired" },
      });
      return NextResponse.json(
        {
          error: "GitLab authorization expired or revoked.",
          message: "Please reconnect your GitLab account.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: "Failed to list projects", details: msg }, { status: 500 });
  }
}

