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
    const gitlabEvent = req.headers.get("x-gitlab-event");
    const gitlabToken = req.headers.get("x-gitlab-token");
    const gitlabSignature =
      req.headers.get("x-gitlab-signature") ||
      req.headers.get("x-brandshield-signature") ||
      req.headers.get("x-hub-signature-256");

    const isGitLab = Boolean(
      gitlabEvent ||
        payload.object_kind === "push" ||
        payload.object_kind === "merge_request"
    );

    let orgId: string;
    let assetName = "Pre-publishing Content Payload";
    let textToScan = "";
    let headingsCount = 0;
    let parsedGitLab: NormalizedGitLabEvent | null = null;
    let fetchedFiles: { path: string; content: string }[] = [];

    if (isGitLab) {
      // Security: Do not trust orgSlug from query parameters without verifying project-to-organization mapping
      const orgIdentifier =
        req.nextUrl.searchParams.get("orgSlug") ||
        req.nextUrl.searchParams.get("orgId") ||
        (payload.orgSlug as string) ||
        (payload.orgId as string) ||
        process.env.GITLAB_ORG_SLUG ||
        "nimbus-labs";

      const projectMapping = await verifyGitLabProjectMapping(
        orgIdentifier,
        gitlabToken || gitlabSignature,
        rawBody
      );

      if (!projectMapping.verified || !projectMapping.org) {
        return NextResponse.json(
          {
            error: `Unauthorized GitLab Webhook: ${projectMapping.reason || "Project not mapped to organization"}`,
          },
          { status: 401 }
        );
      }

      orgId = projectMapping.org.id;
      parsedGitLab = parseGitLabWebhookPayload(payload);

      if (!parsedGitLab) {
        return NextResponse.json(
          { error: "Unsupported or malformed GitLab webhook event." },
          { status: 400 }
        );
      }

      assetName = parsedGitLab.summary;

      // Inspect actual changed file contents:
      // 1. Check if files were supplied directly in request payload (e.g. from CI script)
      if (Array.isArray(payload.files)) {
        fetchedFiles = (payload.files as { path?: string; content?: string }[])
          .filter((f) => f && typeof f.path === "string" && typeof f.content === "string")
          .map((f) => ({ path: f.path as string, content: f.content as string }));
      }

      // 2. If not in body, fetch changed files from GitLab Repository API
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
      // ── Standard Custom Webhook (Backward-Compatible) ──
      const orgIdentifier = (payload.orgSlug as string) || (payload.orgId as string);
      if (!orgIdentifier) {
        return NextResponse.json(
          { error: "Missing organization identifier (orgSlug or orgId)." },
          { status: 400 }
        );
      }

      const org = await db.organization.findFirst({
        where: {
          OR: [{ slug: orgIdentifier }, { id: orgIdentifier }],
        },
        include: {
          webhooks: { where: { active: true } },
        },
      });

      if (!org) {
        return NextResponse.json({ error: "Organization not found." }, { status: 404 });
      }

      orgId = org.id;

      // If webhook signing is configured for this organization, verify the signature header
      const signatureHeader = req.headers.get("x-brandshield-signature");
      if (org.webhooks.length > 0 && signatureHeader) {
        const anyValid = org.webhooks.some((wh) =>
          verifyWebhookSignature(signatureHeader, rawBody, wh.secret).valid
        );
        if (!anyValid) {
          return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 401 });
        }
      }

      const content = (payload.content as string) || "";
      const headings = Array.isArray(payload.headings) ? (payload.headings as string[]) : [];
      headingsCount = headings.length;
      assetName = (payload.assetName as string) || "Pre-publishing Content Payload";
      textToScan = `${content} ${headings.join(" ")}`.trim();
    }

    const findings: {
      category: string;
      severity: "critical" | "warning" | "minor";
      ruleCitation: string;
      flaggedText: string;
      suggestion: string;
    }[] = [];

    // 1. Check for banned marketing terms
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

    // 2. Check for headline / title punctuation violations
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

    // 3. Check for trademarks
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

    // Log the pre-publishing asset audit
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

    // ── Outbound GitLab Commit Status Update ──
    let gitlabStatusResult: { success: boolean; status?: number; error?: string } | null = null;

    if (
      isGitLab &&
      parsedGitLab &&
      parsedGitLab.commitSha &&
      parsedGitLab.commitSha !== "unknown_sha" &&
      parsedGitLab.commitSha !== "mr_head_sha"
    ) {
      const origin =
        process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : req.nextUrl.origin || "https://brandshield-ai-five.vercel.app";

      const targetUrl = `${origin}/?tab=webhooks&auditId=${assetAudit.id}`;

      // Await directly to guarantee execution before serverless response finishes
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
