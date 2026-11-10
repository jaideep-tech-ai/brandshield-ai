import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/brandshield/server/json";
import { verifyWebhookSignature } from "@/lib/brandshield/server/webhooks";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ error: "Empty request body." }, { status: 400 });
    }

    let payload: {
      orgSlug?: string;
      orgId?: string;
      assetName?: string;
      content?: string;
      headings?: string[];
      colors?: string[];
    };

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const orgIdentifier = payload.orgSlug || payload.orgId;
    if (!orgIdentifier) {
      return NextResponse.json({ error: "Missing organization identifier (orgSlug or orgId)." }, { status: 400 });
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

    const textToScan = `${payload.content || ""} ${(payload.headings || []).join(" ")}`.trim();
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

    // 2. Check for headline punctuation violations
    if (payload.headings) {
      for (const h of payload.headings) {
        if (h.includes("?!") || h.includes("!!")) {
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
    const complianceScore = Math.max(0, 100 - criticalCount * 30 - (violationsCount - criticalCount) * 10);
    const allowed = criticalCount === 0;

    // Log the pre-publishing asset audit
    const assetAudit = await db.assetAudit.create({
      data: {
        orgId: org.id,
        assetName: payload.assetName || "Pre-publishing Content Payload",
        assetType: "webhook",
        status: allowed ? "completed" : "failed",
        complianceScore,
        findingsCount: violationsCount,
        violationsJson: JSON.stringify(findings),
        metadataJson: JSON.stringify({
          headingsCount: payload.headings?.length || 0,
          textLength: textToScan.length,
          receivedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      verdict: {
        allowed,
        status: allowed ? "PASSED" : "BLOCKED",
        complianceScore,
        violationsCount,
        auditId: assetAudit.id,
      },
      findings,
    });
  } catch (e) {
    return jsonError(e);
  }
}
