import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { validateSsrfSafeUrl } from "./ssrf";

export interface GitLabCommit {
  id: string;
  message: string;
  title: string;
  timestamp?: string;
  url?: string;
  author?: {
    name: string;
    email: string;
  };
  added?: string[];
  modified?: string[];
  removed?: string[];
}

export interface GitLabProject {
  id: number | string;
  name: string;
  description?: string;
  web_url: string;
  path_with_namespace: string;
}

export interface GitLabPushPayload {
  object_kind: "push";
  event_name?: string;
  before?: string;
  after?: string;
  ref: string;
  checkout_sha?: string;
  project_id?: number | string;
  project: GitLabProject;
  commits?: GitLabCommit[];
  total_commits_count?: number;
  user_name?: string;
  user_email?: string;
}

export interface GitLabMergeRequestPayload {
  object_kind: "merge_request";
  event_type?: string;
  project: GitLabProject;
  user?: {
    name: string;
    username: string;
  };
  object_attributes: {
    id: number;
    target_branch: string;
    source_branch: string;
    source_project_id: number;
    target_project_id: number;
    title: string;
    description?: string;
    state: string; // "opened" | "merged" | "closed"
    action?: string; // "open" | "update" | "merge"
    url?: string;
    last_commit?: GitLabCommit;
  };
}

export interface NormalizedGitLabEvent {
  eventType: "push" | "merge_request";
  projectId: string;
  projectPath: string;
  projectUrl: string;
  ref: string;
  branch: string;
  commitSha: string;
  authorName: string;
  authorEmail: string;
  summary: string;
  contentToAudit: string;
  filesChanged: string[];
}

// ── Replay Protection Registry for GitLab Webhook Nonces / Signatures ──
const consumedGitLabSignatures = new Set<string>();

export function markGitLabSignatureConsumed(sig: string): void {
  consumedGitLabSignatures.add(sig);
  const timer = setTimeout(() => {
    consumedGitLabSignatures.delete(sig);
  }, 15 * 60 * 1000); // 15-minute replay defense window
  if (timer.unref) timer.unref();
}

export function isGitLabSignatureConsumed(sig: string): boolean {
  return consumedGitLabSignatures.has(sig);
}

/**
 * Timing-safe token comparison against configured GitLab secret token.
 * Prevents timing side-channel attacks on secret comparison.
 */
export function verifyGitLabWebhookToken(
  headerToken: string | null | undefined,
  expectedSecret: string | null | undefined
): boolean {
  if (!headerToken || !expectedSecret) return false;
  const cleanHeader = headerToken.trim();
  const cleanExpected = expectedSecret.trim();
  if (cleanHeader.length !== cleanExpected.length) return false;

  try {
    const bufA = Buffer.from(cleanHeader, "utf8");
    const bufB = Buffer.from(cleanExpected, "utf8");
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Verifies HMAC-SHA256 signatures on GitLab webhook payloads with timestamp drift
 * and replay attack defense.
 * Supported header formats:
 * - `t={timestamp},v1={signature}` (enterprise standard)
 * - `sha256={signature}`
 * - Raw hex HMAC signature
 */
export function verifyGitLabHmacSignature(
  header: string | null | undefined,
  rawBody: string,
  secret: string,
  toleranceSeconds = 300
): { valid: boolean; reason?: string } {
  if (!header || !secret) {
    return { valid: false, reason: "Missing signature header or secret." };
  }

  try {
    let timestamp: number | null = null;
    let signatureHex = "";

    if (header.includes("t=") && header.includes("v1=")) {
      const parts = header.split(",");
      const tPart = parts.find((p) => p.startsWith("t="));
      const v1Part = parts.find((p) => p.startsWith("v1="));
      if (!tPart || !v1Part) {
        return { valid: false, reason: "Malformed t=,v1= signature header." };
      }
      timestamp = parseInt(tPart.slice(2), 10);
      signatureHex = v1Part.slice(3).trim();
    } else if (header.startsWith("sha256=")) {
      signatureHex = header.slice(7).trim();
    } else {
      signatureHex = header.trim();
    }

    if (timestamp !== null) {
      if (isNaN(timestamp)) {
        return { valid: false, reason: "Invalid timestamp in signature header." };
      }
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - timestamp) > toleranceSeconds) {
        return { valid: false, reason: "Webhook timestamp expired (replay defense)." };
      }
    }

    // Replay check
    if (isGitLabSignatureConsumed(signatureHex)) {
      return { valid: false, reason: "Webhook signature has already been consumed (replay attack blocked)." };
    }

    const payloadToSign = timestamp !== null ? `${timestamp}.${rawBody}` : rawBody;
    const expected = createHmac("sha256", secret).update(payloadToSign).digest("hex");

    const bufA = Buffer.from(signatureHex, "utf8");
    const bufB = Buffer.from(expected, "utf8");

    if (bufA.length !== bufB.length || !timingSafeEqual(bufA, bufB)) {
      return { valid: false, reason: "HMAC signature mismatch." };
    }

    markGitLabSignatureConsumed(signatureHex);
    return { valid: true };
  } catch (err) {
    return { valid: false, reason: err instanceof Error ? err.message : "Verification error" };
  }
}

/**
 * Verifies that a GitLab project and its secret belong to the targeted organization.
 * Prevents cross-tenant impersonation where an unauthenticated caller sends an arbitrary orgSlug.
 */
export async function verifyGitLabProjectMapping(
  orgIdentifier: string,
  secretTokenOrHmac: string | null | undefined,
  rawBody: string
): Promise<{
  verified: boolean;
  org?: { id: string; name: string; slug: string };
  reason?: string;
}> {
  const org = await db.organization.findFirst({
    where: {
      OR: [{ slug: orgIdentifier }, { id: orgIdentifier }],
    },
    include: {
      webhooks: { where: { active: true } },
    },
  });

  if (!org) {
    return { verified: false, reason: "Organization not found." };
  }

  // Check against global environment variable if configured
  const globalSecret = process.env.GITLAB_WEBHOOK_SECRET?.trim();
  let hasValidSecret = false;

  if (secretTokenOrHmac) {
    // 1. Check if token matches global secret via timing-safe check or HMAC
    if (globalSecret) {
      if (
        verifyGitLabWebhookToken(secretTokenOrHmac, globalSecret) ||
        verifyGitLabHmacSignature(secretTokenOrHmac, rawBody, globalSecret).valid
      ) {
        hasValidSecret = true;
      }
    }

    // 2. Check if token matches any registered WebhookEndpoint secret belonging to this organization
    if (!hasValidSecret && org.webhooks.length > 0) {
      for (const wh of org.webhooks) {
        if (
          verifyGitLabWebhookToken(secretTokenOrHmac, wh.secret) ||
          verifyGitLabHmacSignature(secretTokenOrHmac, rawBody, wh.secret).valid
        ) {
          hasValidSecret = true;
          break;
        }
      }
    }
  }

  // If the organization has configured webhook endpoints or a global secret exists,
  // we require a valid token to verify project-to-organization ownership.
  if ((org.webhooks.length > 0 || globalSecret) && !hasValidSecret) {
    return {
      verified: false,
      reason: "GitLab secret token or HMAC signature verification failed for this organization.",
    };
  }

  return {
    verified: true,
    org: { id: org.id, name: org.name, slug: org.slug },
  };
}

/**
 * Inspects a GitLab webhook request payload and extracts commit metadata,
 * changed content, and project coordinates into a normalized event.
 */
export function parseGitLabWebhookPayload(rawPayload: Record<string, unknown>): NormalizedGitLabEvent | null {
  if (!rawPayload || typeof rawPayload !== "object") return null;

  const kind = (rawPayload.object_kind as string) || "";
  const project = (rawPayload.project as GitLabProject) || {};
  const projectPath = project.path_with_namespace || "jaideep-tech-ai/brandshield-ai-webhooks";
  const projectId = String(project.id || rawPayload.project_id || projectPath);
  const projectUrl = project.web_url || `https://gitlab.com/${projectPath}`;

  if (kind === "push") {
    const p = rawPayload as unknown as GitLabPushPayload;
    const ref = p.ref || "refs/heads/main";
    const branch = ref.replace(/^refs\/heads\//, "");
    const commits = Array.isArray(p.commits) ? p.commits : [];
    const commitSha = p.checkout_sha || p.after || commits[commits.length - 1]?.id || "unknown_sha";
    const authorName = p.user_name || commits[0]?.author?.name || "GitLab User";
    const authorEmail = p.user_email || commits[0]?.author?.email || "";

    const commitTexts = commits
      .map((c) => `${c.title || ""} ${c.message || ""}`.trim())
      .filter(Boolean)
      .join("\n");

    const filesChanged = Array.from(
      new Set(commits.flatMap((c) => [...(c.added || []), ...(c.modified || [])]))
    );

    return {
      eventType: "push",
      projectId,
      projectPath,
      projectUrl,
      ref,
      branch,
      commitSha,
      authorName,
      authorEmail,
      summary: `GitLab Push to ${branch} (${commits.length} commit${commits.length === 1 ? "" : "s"})`,
      contentToAudit: commitTexts,
      filesChanged,
    };
  }

  if (kind === "merge_request") {
    const mr = rawPayload as unknown as GitLabMergeRequestPayload;
    const attrs = mr.object_attributes || {};
    const branch = attrs.source_branch || "feature";
    const ref = `refs/heads/${branch}`;
    const commitSha = attrs.last_commit?.id || "mr_head_sha";
    const authorName = mr.user?.name || attrs.last_commit?.author?.name || "GitLab User";
    const authorEmail = attrs.last_commit?.author?.email || "";

    const mrText = `${attrs.title || ""}\n${attrs.description || ""}\n${attrs.last_commit?.message || ""}`.trim();

    return {
      eventType: "merge_request",
      projectId,
      projectPath,
      projectUrl,
      ref,
      branch,
      commitSha,
      authorName,
      authorEmail,
      summary: `GitLab MR #${attrs.id}: ${attrs.title || "Merge Request"}`,
      contentToAudit: mrText,
      filesChanged: [],
    };
  }

  return null;
}

const AUDITABLE_EXTENSIONS = new Set([
  ".md",
  ".mdx",
  ".txt",
  ".html",
  ".json",
  ".yaml",
  ".yml",
  ".csv",
  ".tsx",
  ".jsx",
  ".ts",
  ".js",
  ".vue",
]);

/**
 * Fetches actual changed file contents directly from the GitLab Repository Files API.
 * Protected by SSRF validation, size caps (max 256KB per file), and max file limits (up to 5 files).
 */
export async function fetchGitLabChangedFiles(
  projectIdOrPath: string | number,
  commitSha: string,
  filesChanged: string[],
  token?: string
): Promise<{ path: string; content: string }[]> {
  const gitlabToken =
    token ||
    process.env.GITLAB_ACCESS_TOKEN?.split(/\r?\n/)[0]?.trim() ||
    process.env.GITLAB_TOKEN?.split(/\r?\n/)[0]?.trim();

  if (!gitlabToken || !filesChanged || filesChanged.length === 0) {
    return [];
  }

  const candidateFiles = filesChanged.filter((filePath) => {
    const lower = filePath.toLowerCase();
    const isExcluded =
      lower.includes("package-lock.json") ||
      lower.includes("bun.lock") ||
      lower.includes("yarn.lock") ||
      lower.includes("node_modules/");
    if (isExcluded) return false;
    return Array.from(AUDITABLE_EXTENSIONS).some((ext) => lower.endsWith(ext));
  });

  const filesToFetch = candidateFiles.slice(0, 5); // Limit to top 5 auditable files
  const results: { path: string; content: string }[] = [];

  for (const filePath of filesToFetch) {
    try {
      const encodedProject = encodeURIComponent(String(projectIdOrPath));
      const encodedFile = encodeURIComponent(filePath);
      const url = `https://gitlab.com/api/v4/projects/${encodedProject}/repository/files/${encodedFile}/raw?ref=${encodeURIComponent(
        commitSha
      )}`;

      const ssrfCheck = await validateSsrfSafeUrl(url);
      if (!ssrfCheck.valid) {
        console.warn(`[GitLab Files] SSRF blocked file fetch for ${filePath}: ${ssrfCheck.reason}`);
        continue;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000); // 4-second timeout per file

      const res = await fetch(url, {
        headers: {
          "PRIVATE-TOKEN": gitlabToken,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const text = await res.text();
        // Cap text size at 256KB to avoid memory exhaustion
        results.push({
          path: filePath,
          content: text.slice(0, 256 * 1024),
        });
      }
    } catch (err) {
      console.warn(`[GitLab Files] Failed to fetch file ${filePath}:`, err instanceof Error ? err.message : err);
    }
  }

  return results;
}

export type GitLabCommitStatusState = "pending" | "running" | "success" | "failed" | "canceled";

export interface GitLabCommitStatusOptions {
  projectIdOrPath: string | number;
  commitSha: string;
  state: GitLabCommitStatusState;
  name?: string; // default: "brandshield/governance"
  description: string;
  targetUrl?: string;
  token?: string;
}

/**
 * Updates a GitLab commit status via the official GitLab Commit Status REST API.
 * POST /projects/:id/statuses/:sha
 * Supported official states: "pending" | "running" | "success" | "failed" | "canceled"
 * This call is fully awaited and logged to prevent serverless function termination drops.
 */
export async function updateGitLabCommitStatus(
  options: GitLabCommitStatusOptions
): Promise<{ success: boolean; status?: number; error?: string }> {
  const token =
    options.token ||
    process.env.GITLAB_ACCESS_TOKEN?.split(/\r?\n/)[0]?.trim() ||
    process.env.GITLAB_TOKEN?.split(/\r?\n/)[0]?.trim();

  if (!token) {
    return { success: false, error: "Missing GITLAB_ACCESS_TOKEN environment variable" };
  }

  // Support numeric ID or URL-encoded path (e.g. jaideep-tech-ai%2Fbrandshield-ai-webhooks)
  const encodedProject = encodeURIComponent(String(options.projectIdOrPath));
  const url = `https://gitlab.com/api/v4/projects/${encodedProject}/statuses/${options.commitSha}`;

  const ssrfCheck = await validateSsrfSafeUrl(url);
  if (!ssrfCheck.valid) {
    console.warn(`[GitLab Status] SSRF blocked status update: ${ssrfCheck.reason}`);
    return { success: false, error: ssrfCheck.reason };
  }

  const body = {
    state: options.state,
    name: options.name || "brandshield/governance",
    description: options.description.slice(0, 255), // GitLab API max description length
    target_url: options.targetUrl || "https://brandshield-ai-five.vercel.app",
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5-second timeout

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PRIVATE-TOKEN": token,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[GitLab Status] API returned ${res.status}: ${errText}`);
      return { success: false, status: res.status, error: errText };
    }

    return { success: true, status: res.status };
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : "Network error";
    console.error("[GitLab Status] Failed to update commit status:", msg);
    return { success: false, error: msg };
  }
}
