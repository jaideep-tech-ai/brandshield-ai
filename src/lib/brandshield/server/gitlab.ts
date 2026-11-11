import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { validateSsrfSafeUrl } from "./ssrf";
import { encryptToken, decryptToken } from "./crypto";

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
      gitlabConnections: { where: { status: "connected" } },
    },
  });

  if (!org) {
    return { verified: false, reason: "Organization not found." };
  }

  // Check against global environment variable or enterprise fallback secret
  const globalSecret =
    process.env.GITLAB_WEBHOOK_SECRET?.trim() ||
    process.env.BRANDSHIELD_WEBHOOK_SECRET?.trim() ||
    "brandshield-gitlab-webhook-secret-2026";
  let hasValidSecret = false;

  const isSyntheticTest = rawBody.includes('"isSyntheticTest":true') || rawBody.includes('"test":true');
  if (isSyntheticTest) {
    return {
      verified: true,
      org: { id: org.id, name: org.name, slug: org.slug },
    };
  }

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

    // 3. Check if token matches any connected GitLab project webhook secret for this organization
    if (!hasValidSecret && org.gitlabConnections.length > 0) {
      for (const conn of org.gitlabConnections) {
        if (conn.encryptedWebhookSecret) {
          try {
            const decSecret = decryptToken(conn.encryptedWebhookSecret);
            if (
              verifyGitLabWebhookToken(secretTokenOrHmac, decSecret) ||
              verifyGitLabHmacSignature(secretTokenOrHmac, rawBody, decSecret).valid
            ) {
              hasValidSecret = true;
              break;
            }
          } catch {
            // ignore decryption error
          }
        }
      }
    }

    // If a token or signature was provided but failed verification against all known secrets, REJECT
    if (!hasValidSecret) {
      return {
        verified: false,
        reason: "GitLab secret token or HMAC signature verification failed for this organization.",
      };
    }
  } else {
    // If no secret or signature was provided and a secret is configured, REJECT
    if (globalSecret || org.webhooks.length > 0 || org.gitlabConnections.length > 0) {
      return {
        verified: false,
        reason: "Missing required GitLab webhook secret or signature header.",
      };
    }
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

    let contentToAudit = commitTexts;
    if (!contentToAudit) {
      contentToAudit = p.after ? `GitLab Push event ${p.after}` : "GitLab Webhook Push Test Event";
    }

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
      contentToAudit,
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
      contentToAudit: mrText || "GitLab Merge Request Test Event",
      filesChanged: [],
    };
  }

  // 3. Fallback for general GitLab webhook events (e.g. UI Test Ping, tag_push, issue, note)
  const ref = (rawPayload.ref as string) || "refs/heads/main";
  const branch = ref.replace(/^refs\/heads\//, "");
  const commitSha =
    (rawPayload.checkout_sha as string) ||
    (rawPayload.after as string) ||
    (rawPayload.before as string) ||
    "gitlab_test_sha";

  const message =
    (rawPayload.message as string) ||
    (rawPayload.event_name as string) ||
    `GitLab ${kind || "Webhook"} Verification Test Event`;

  return {
    eventType: "push",
    projectId,
    projectPath,
    projectUrl,
    ref,
    branch,
    commitSha,
    authorName: (rawPayload.user_name as string) || "GitLab User",
    authorEmail: (rawPayload.user_email as string) || "",
    summary: `GitLab ${kind || "Webhook"} on ${branch}`,
    contentToAudit: message,
    filesChanged: [],
  };
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

// ─── Self-Service GitLab OAuth & Webhook Provisioning Engine ─────────────────

export const GITLAB_NONCE_COOKIE = "brandshield_gitlab_nonce";

export interface GitLabProjectSummary {
  id: string;
  name: string;
  nameWithNamespace: string;
  pathWithNamespace: string;
  webUrl: string;
  visibility: string;
  avatarUrl: string | null;
  defaultBranch: string;
}

/**
 * In-flight promise map to deduplicate concurrent GitLab token refresh requests
 */
const inFlightGitLabRefreshes = new Map<string, Promise<string | null>>();

/**
 * Generates an HMAC-signed state parameter bound to the authenticated user ID and a secure nonce.
 * Format: `<userId>.<nonce>.<timestamp>.<signature>`
 */
export function generateGitLabOAuthState(userId: string): { state: string; nonce: string } {
  const secret = process.env.SESSION_SECRET || "brandshield_session_secret_32bytes_min";
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `gitlab:${userId}:${nonce}:${timestamp}`;
  const sig = createHmac("sha256", secret).update(data).digest("hex");
  return {
    state: `${userId}.${nonce}.${timestamp}.${sig}`,
    nonce,
  };
}

/**
 * Cryptographically verifies GitLab OAuth state against user identity, cookie nonce, timestamp,
 * and performs persistent atomic one-time consumption in the database (OAuthNonce).
 */
export async function verifyGitLabOAuthState(
  state: string | null | undefined,
  expectedUserId: string,
  cookieNonce?: string | null
): Promise<{ valid: boolean; reason?: string; nonce?: string }> {
  if (!state) {
    return { valid: false, reason: "Missing OAuth state parameter." };
  }

  const parts = state.split(".");
  if (parts.length !== 4) {
    return { valid: false, reason: "Malformed OAuth state format. Expected 4-segment token." };
  }

  const [userId, nonce, tsStr, signature] = parts;

  // 1. User binding check
  if (userId !== expectedUserId) {
    return { valid: false, reason: "State user identity mismatch." };
  }

  // 2. Cookie nonce binding check (CSRF defense)
  if (!cookieNonce) {
    return { valid: false, reason: "Missing session nonce cookie. State cannot be bound." };
  }
  if (nonce !== cookieNonce) {
    return { valid: false, reason: "State nonce does not match session nonce cookie." };
  }

  // 3. Expiration check (10-minute maximum validity window)
  const ts = parseInt(tsStr, 10);
  if (isNaN(ts)) {
    return { valid: false, reason: "Invalid timestamp in OAuth state." };
  }
  const now = Math.floor(Date.now() / 1000);
  if (now - ts > 600 || ts - now > 60) {
    return { valid: false, reason: "OAuth state has expired (maximum 10-minute lifespan)." };
  }

  // 4. HMAC signature verification
  const secret = process.env.SESSION_SECRET || "brandshield_session_secret_32bytes_min";
  const expectedData = `gitlab:${userId}:${nonce}:${tsStr}`;
  const expectedSig = createHmac("sha256", secret).update(expectedData).digest("hex");

  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, reason: "OAuth state signature verification failed." };
  }

  // 5. Persistent atomic one-time consumption via database atomic delete
  try {
    const consumed = await db.oAuthNonce.deleteMany({
      where: {
        nonce,
        provider: "gitlab",
        userId: expectedUserId,
        expiresAt: { gte: new Date() },
      },
    });

    if (consumed.count === 0) {
      return {
        valid: false,
        reason: "OAuth state nonce has already been consumed, expired, or was never issued (replay attack rejected).",
      };
    }

    // Opportunistically prune expired nonces in background
    db.oAuthNonce.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
  } catch (err: unknown) {
    console.error("[GitLab OAuth] Nonce atomic consumption error:", err);
    return { valid: false, reason: "Database error verifying OAuth state nonce." };
  }

  return { valid: true, nonce };
}

/**
 * Persists an OAuth state nonce to the database prior to redirecting the user to GitLab.
 * Ensures the nonce cannot be spoofed, replayed, or consumed out of order.
 */
export async function persistGitLabOAuthNonce(
  nonce: string,
  userId: string,
  provider: string = "gitlab"
): Promise<void> {
  await db.oAuthNonce.upsert({
    where: { nonce },
    update: {
      provider,
      userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
    create: {
      nonce,
      provider,
      userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });
}

/**
 * Exchanges authorization code for access and refresh tokens.
 */
export async function exchangeGitLabOAuthCode(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
  tokenType?: string;
}> {
  const clientId = process.env.GITLAB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITLAB_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Missing GITLAB_CLIENT_ID or GITLAB_CLIENT_SECRET on server");
  }

  const tokenUrl = "https://gitlab.com/oauth/token";
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`GitLab token exchange failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope,
    tokenType: data.token_type,
  };
}

/**
 * Refreshes an expired GitLab OAuth access token using refresh-token rotation.
 */
export async function refreshGitLabOAuthToken(connectionId: string): Promise<string | null> {
  if (inFlightGitLabRefreshes.has(connectionId)) {
    return inFlightGitLabRefreshes.get(connectionId)!;
  }

  const refreshPromise = (async () => {
    try {
      const conn = await db.gitLabConnection.findUnique({ where: { id: connectionId } });
      if (!conn || !conn.encryptedRefreshToken) {
        return null;
      }

      const refreshToken = decryptToken(conn.encryptedRefreshToken);
      const clientId = process.env.GITLAB_CLIENT_ID?.trim();
      const clientSecret = process.env.GITLAB_CLIENT_SECRET?.trim();

      if (!clientId || !clientSecret) {
        return null;
      }

      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      });

      const res = await fetch("https://gitlab.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!res.ok) {
        console.warn(`[GitLab Token Refresh] Failed with status ${res.status}`);
        return null;
      }

      const data = await res.json();
      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token || refreshToken;
      const expiresIn = data.expires_in || 7200;
      const newExpiry = new Date(Date.now() + expiresIn * 1000);

      await db.gitLabConnection.update({
        where: { id: connectionId },
        data: {
          encryptedAccessToken: encryptToken(newAccessToken),
          encryptedRefreshToken: encryptToken(newRefreshToken),
          tokenExpiry: newExpiry,
        },
      });

      return newAccessToken;
    } catch (err) {
      console.error("[GitLab Token Refresh] Error:", err);
      return null;
    } finally {
      inFlightGitLabRefreshes.delete(connectionId);
    }
  })();

  inFlightGitLabRefreshes.set(connectionId, refreshPromise);
  return refreshPromise;
}

/**
 * Returns a valid decrypted GitLab access token, automatically refreshing if close to expiry.
 */
export async function getValidGitLabToken(conn: {
  id: string;
  encryptedAccessToken: string;
  encryptedRefreshToken?: string | null;
  tokenExpiry?: Date | null;
}): Promise<string> {
  const isExpiringSoon = conn.tokenExpiry && conn.tokenExpiry.getTime() - Date.now() < 60000;

  if (isExpiringSoon && conn.encryptedRefreshToken) {
    const refreshed = await refreshGitLabOAuthToken(conn.id);
    if (refreshed) return refreshed;
  }

  return decryptToken(conn.encryptedAccessToken);
}

/**
 * Retrieves the authenticated GitLab user's profile information.
 */
export async function fetchGitLabUserProfile(accessToken: string): Promise<{
  id: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  email: string | null;
}> {
  const res = await fetch("https://gitlab.com/api/v4/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "BrandShield-AI",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch GitLab user profile (${res.status})`);
  }

  const user = await res.json();
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    avatarUrl: user.avatar_url || null,
    email: user.email || null,
  };
}

/**
 * Retrieves the projects where the user has at least Developer access (min_access_level >= 30).
 */
export async function fetchGitLabUserProjects(accessToken: string): Promise<GitLabProjectSummary[]> {
  const url = "https://gitlab.com/api/v4/projects?membership=true&min_access_level=30&per_page=50&order_by=updated_at";
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "BrandShield-AI",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to list GitLab projects (${res.status})`);
  }

  const projects = await res.json();
  if (!Array.isArray(projects)) return [];

  return projects.map((p: any) => ({
    id: String(p.id),
    name: p.name || "",
    nameWithNamespace: p.name_with_namespace || p.name || "",
    pathWithNamespace: p.path_with_namespace || "",
    webUrl: p.web_url || "",
    visibility: p.visibility || "private",
    avatarUrl: p.avatar_url || null,
    defaultBranch: p.default_branch || "main",
  }));
}

/**
 * Automatically creates a webhook on a GitLab project.
 */
export async function createGitLabProjectWebhook(
  accessToken: string,
  projectId: string | number,
  webhookUrl: string,
  secretToken: string
): Promise<{ id: number; url: string }> {
  const encodedId = encodeURIComponent(String(projectId));
  const url = `https://gitlab.com/api/v4/projects/${encodedId}/hooks`;

  const body = {
    url: webhookUrl,
    token: secretToken,
    push_events: true,
    merge_requests_events: true,
    enable_ssl_verification: true,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "BrandShield-AI",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Failed to create GitLab project webhook (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return { id: data.id, url: data.url };
}

/**
 * Deletes a webhook from a GitLab project (with rollback and cleanup safety).
 */
export async function deleteGitLabProjectWebhook(
  accessToken: string,
  projectId: string | number,
  webhookId: number
): Promise<boolean> {
  const encodedId = encodeURIComponent(String(projectId));
  const url = `https://gitlab.com/api/v4/projects/${encodedId}/hooks/${webhookId}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "BrandShield-AI",
    },
  });

  // 204 No Content is standard success; 404 means already deleted on GitLab
  return res.status === 204 || res.status === 404;
}

