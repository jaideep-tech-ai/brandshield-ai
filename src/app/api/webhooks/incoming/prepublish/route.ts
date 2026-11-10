import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/brandshield/server/json";
import { verifyWebhookSignature } from "@/lib/brandshield/server/webhooks";
import {
  parseGitLabWebhookPayload,
  verifyGitLabProjectMapping,
  fetchGitLabChangedFiles,
  updateGitLabCommitStatus,
  type NormalizedGitLabEvent,
} from "@/lib/brandshield/server/gitlab";

/**
 * Robustly extracts the organization identifier (slug or id) from all possible sources:
 * 1. Payload body fields (`orgSlug`, `orgId`)
 * 2. Next.js `req.nextUrl.searchParams`
 * 3. Native `new URL(req.url).searchParams`
 * 4. Raw URL string regex (protects against reverse-proxy URLSearchParams stripping)
 */
export function extractOrgIdentifier(
  req: { url: string; nextUrl?: { searchParams: URLSearchParams } },
  payload?: Record<string, unknown>
): string | null {
  // 1. Explicit body payload properties
  if (payload && typeof payload.orgSlug === "string" && payload.orgSlug.trim()) {
    return payload.orgSlug.trim();
  }
  if (payload && typeof payload.orgId === "string" && payload.orgId.trim()) {
    return payload.orgId.trim();
  }

  // 2. NextRequest nextUrl searchParams
  try {
    const slug = req.nextUrl?.searchParams?.get("orgSlug")?.trim();
    if (slug) return slug;
    const id = req.nextUrl?.searchParams?.get("orgId")?.trim();
    if (id) return id;
  } catch {
    // ignore
  }

  // 3. Native URL parsing of req.url
  try {
    const parsed = new URL(req.url, "https://brandshield-ai-five.vercel.app");
    const slug = parsed.searchParams.get("orgSlug")?.trim();
    if (slug) return slug;
    const id = parsed.searchParams.get("orgId")?.trim();
    if (id) return id;
  } catch {
    // ignore
  }

  // 4. Raw URL string regex fallback (ensures query params are parsed even if headers/proxy altered URL object)
  try {
    const slugMatch = req.url.match(/[?&]orgSlug=([^&#]+)/i);
    if (slugMatch && slugMatch[1]) {
      return decodeURIComponent(slugMatch[1]).trim();
    }
    const idMatch = req.url.match(/[?&]orgId=([^&#]+)/i);
    if (idMatch && idMatch[1]) {
      return decodeURIComponent(idMatch[1]).trim();
    }
  } catch {
    // ignore
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ error: "Empty request body." }, { status: 400 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    // 1. Detect if this is a GitLab Webhook request
    const gitlabEvent = req.headers.get("x-gitlab-event")?.trim();
    const gitlabToken = req.headers.get("x-gitlab-token")?.trim();
    const gitlabSignature = (
      req.headers.get("x-gitlab-signature") ||
      req.headers.get("x-brandshield-signature") ||
      req.headers.get("x-hub-signature-256")
    )?.trim();

    const isGitLab = Boolean(
      gitlabEvent ||
        gitlabToken ||
        (payload &&
          typeof payload === "object" &&
          ("object_kind" in payload || "event_name" in payload || "project" in payload || "commits" in payload))
    );

    // 2. Extract organization identifier (supports both URL searchParams and payload body)
    let orgIdentifier = extractOrgIdentifier(req, payload);

    if (!orgIdentifier && isGitLab) {
      orgIdentifier = process.env.GITLAB_ORG_SLUG || "nimbus-labs";
    }

    if (!orgIdentifier) {
      return NextResponse.json(
        {
          error:
            "Missing organization identifier. Provide ?orgSlug=<slug> in the webhook URL or in the payload body.",
        },
        { status: 400 }
      );
    }

    // 3. Resolve Organization from Database
    const org = await db.organization.findFirst({
      where: {
        OR: [{ slug: orgIdentifier }, { id: orgIdentifier }],
      },
      include: {
        webhooks: { where: { active: true } },
      },
    });

    if (!org) {
      return NextResponse.json(
        { error: `Organization '${orgIdentifier}' not found.` },
        { status: 404 }
      );
    }

    const orgId = org.id;

    // 4. Authenticate & Verify Organization Ownership
    // Never trust an arbitrary orgSlug as authorization. The secret token or signature must match the organization.
    if (isGitLab) {
      const projectMapping = await verifyGitLabProjectMapping(
        orgId,
        gitlabToken || gitlabSignature,
        rawBody
      );

      if (!projectMapping.verified) {
        return NextResponse.json(
          {
            error: `Unauthorized GitLab Webhook: ${projectMapping.reason || "Project not mapped to organization"}`,
          },
          { status: 401 }
        );
      }
    } else {
      // Standard custom webhook HMAC verification if endpoints are registered
      const signatureHeader = req.headers.get("x-brandshield-signature");
      if (org.webhooks.length > 0 && signatureHeader) {
        const anyValid = org.webhooks.some((wh) =>
          verifyWebhookSignature(signatureHeader, rawBody, wh.secret).valid
        );
        if (!anyValid) {
          return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 401 });
        }
      }
    }

    // 5. Extract Content for Brand Governance Audit
    let assetName = "Pre-publishing Content Payload";
    let textToScan = "";
    let headingsCount = 0;
    let parsedGitLab: NormalizedGitLabEvent | null = null;
    let fetchedFiles: { path: string; content: string }[] = [];

    if (isGitLab) {
      parsedGitLab = parseGitLabWebhookPayload(payload);

      if (!parsedGitLab) {
        return NextResponse.json(
          { error: "Unsupported or malformed GitLab webhook event." },
          { status: 400 }
        );
      }

      assetName = parsedGitLab.summary;

      // Inspect actual changed file contents:
      // A. Check if files were supplied directly in request payload (e.g. from CI runner script)
      if (Array.isArray(payload.files)) {
        fetchedFiles = (payload.files as { path?: string; content?: string }[])
          .filter((f) => f && typeof f.path === "string" && typeof f.content === "string")
          .map((f) => ({ path: f.path as string, content: f.content as string }));
      }

      // B. If not in body, fetch changed files from GitLab Repository API
      if (fetchedFiles.length === 0 && parsedGitLab.filesChanged.length > 0) {
        fetchedFiles = await fetchGitLabChangedFiles(
          parsedGitLab.projectPath || parsedGitLab.projectId,
          parsedGitLab.commitSha,
          parsedGitLab.filesChanged
        );
      }

      const fileContentStr = fetchedFiles
        .map((f) => `--- File: ${f.path} ---\n${f.content}`)
        .join("\n\n");

      textToScan = `${parsedGitLab.contentToAudit}\n\n${fileContentStr}`.trim();
    } else {
      const content = (payload.content as string) || "";
      const headings = Array.isArray(payload.headings) ? (payload.headings as string[]) : [];
      headingsCount = headings.length;
      assetName = (payload.assetName as string) || "Pre-publishing Content Payload";
      textToScan = `${content} ${headings.join(" ")}`.trim();
    }

    // 6. Run Brand Governance Audit
    const findings: {
      category: string;
      severity: "critical" | "warning" | "minor";
      ruleCitation: string;
      flaggedText: string;
      suggestion: string;
    }[] = [];

    // Check for banned marketing terms
    const BANNED = [
      { word: "guaranteed", rule: "VOICE-04", rep: "designed to deliver" },
      { word: "risk-free", rule: "VOICE-04", rep: "hedged risk profile" },
      { word: "100% safe", rule: "VOICE-04", rep: "enterprise-grade security" },
      { word: "can't fail", rule: "VOICE-04", rep: "high reliability" },
      { word: "world's best", rule: "VOICE-03", rep: "top tier" },
    ];

    for (const b of BANNED) {
      if (new RegExp(`\\b${b.word}\\b`, "i").test(textToScan)) {
        findings.push({
          category: "claim",
          severity: "critical",
          ruleCitation: b.rule,
          flaggedText: b.word,
          suggestion: `Replace "${b.word}" with approved factual phrasing "${b.rep}".`,
        });
      }
    }

    // Check for headline / title punctuation violations
    if (payload.headings && Array.isArray(payload.headings)) {
      for (const h of payload.headings as string[]) {
        if (typeof h === "string" && (h.includes("?!") || h.includes("!!"))) {
          findings.push({
            category: "style",
            severity: "warning",
            ruleCitation: "STYLE-01",
            flaggedText: h,
            suggestion: "Banned punctuation. Do not combine '?!' or '!!'.",
          });
        }
      }
    }

    // Check for trademarks
    if (textToScan.includes("NimbusPay") && !textToScan.includes("NimbusPay®")) {
      findings.push({
        category: "trademark",
        severity: "minor",
        ruleCitation: "TM-01",
        flaggedText: "NimbusPay",
        suggestion: "Master brand 'NimbusPay' must carry the ® mark on first prominent occurrence.",
      });
    }

    const violationsCount = findings.length;
    const criticalCount = findings.filter((f) => f.severity === "critical").length;
    const warningCount = findings.filter((f) => f.severity === "warning").length;
    const complianceScore = Math.max(0, 100 - criticalCount * 30 - warningCount * 10);
    const allowed = criticalCount === 0;

    // 7. Log Pre-publishing Asset Audit
    const assetAudit = await db.assetAudit.create({
      data: {
        orgId,
        assetName,
        assetType: isGitLab ? "gitlab_webhook" : "webhook",
        status: allowed ? "completed" : "failed",
        complianceScore,
        findingsCount: violationsCount,
        violationsJson: JSON.stringify(findings),
        metadataJson: JSON.stringify({
          headingsCount,
          textLength: textToScan.length,
          receivedAt: new Date().toISOString(),
          isGitLab,
          gitlabEvent: parsedGitLab?.eventType,
          commitSha: parsedGitLab?.commitSha,
          ref: parsedGitLab?.ref,
          branch: parsedGitLab?.branch,
          projectPath: parsedGitLab?.projectPath,
          filesInspected: fetchedFiles.map((f) => f.path),
        }),
      },
    });

    // 8. Outbound GitLab Commit Status Update (Awaited to avoid serverless termination)
    let gitlabStatusResult: { success: boolean; status?: number; error?: string } | null = null;

    if (
      isGitLab &&
      parsedGitLab &&
      parsedGitLab.commitSha &&
      parsedGitLab.commitSha !== "unknown_sha" &&
      parsedGitLab.commitSha !== "mr_head_sha" &&
      parsedGitLab.commitSha !== "gitlab_test_sha"
    ) {
      const origin =
        process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : req.nextUrl?.origin || "https://brandshield-ai-five.vercel.app";

      const targetUrl = `${origin}/?tab=webhooks&auditId=${assetAudit.id}`;

      gitlabStatusResult = await updateGitLabCommitStatus({
        projectIdOrPath: parsedGitLab.projectPath || parsedGitLab.projectId,
        commitSha: parsedGitLab.commitSha,
        state: allowed ? "success" : "failed",
        name: "brandshield/governance",
        description: allowed
          ? `Compliance: ${complianceScore}/100 · Brand governance passed`
          : `BLOCKED: ${criticalCount} critical brand violation${criticalCount === 1 ? "" : "s"} detected`,
        targetUrl,
      });

      // Update audit record with status delivery result
      await db.assetAudit.update({
        where: { id: assetAudit.id },
        data: {
          metadataJson: JSON.stringify({
            headingsCount,
            textLength: textToScan.length,
            receivedAt: new Date().toISOString(),
            isGitLab: true,
            gitlabEvent: parsedGitLab.eventType,
            commitSha: parsedGitLab.commitSha,
            ref: parsedGitLab.ref,
            branch: parsedGitLab.branch,
            projectPath: parsedGitLab.projectPath,
            filesInspected: fetchedFiles.map((f) => f.path),
            gitlabStatusDelivered: gitlabStatusResult.success,
            gitlabStatusError: gitlabStatusResult.error,
          }),
        },
      });
    }

    return NextResponse.json({
      verdict: {
        allowed,
        status: allowed ? "PASSED" : "BLOCKED",
        complianceScore,
        violationsCount,
        auditId: assetAudit.id,
      },
      gitlab: isGitLab
        ? {
            event: parsedGitLab?.eventType,
            commitSha: parsedGitLab?.commitSha,
            branch: parsedGitLab?.branch,
            filesInspected: fetchedFiles.length,
            statusUpdated: gitlabStatusResult?.success ?? false,
            statusError: gitlabStatusResult?.error,
          }
        : undefined,
      findings,
    });
  } catch (e) {
    return jsonError(e);
  }
}
