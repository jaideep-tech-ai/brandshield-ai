import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

export interface WorkflowStage {
  id: number;
  key: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  completed: boolean;
  current: boolean;
  count: number;
  detail: string;
  detailHi: string;
  targetView: string;
}

export async function GET() {
  try {
    const user = await requireUser();
    const orgId = user.orgId;

    const [
      guidelineCount,
      tokenCount,
      gitlabConn,
      googleConn,
      figmaConn,
      webhookCount,
      submissionCount,
      inspectionCount,
      assetAuditCount,
      findingCount,
      resolvedFindingCount,
      approvedSubmissionCount,
      auditLogCount,
    ] = await Promise.all([
      db.guidelineDocument.count({ where: { orgId } }),
      db.visualToken.count({ where: { orgId } }),
      db.gitLabConnection.count({ where: { orgId } }),
      db.googleOAuthConnection.count({ where: { orgId } }),
      db.figmaOAuthConnection.count({ where: { orgId } }),
      db.webhookEndpoint.count({ where: { orgId } }),
      db.submission.count({ where: { orgId } }),
      db.inspection.count({ where: { submission: { orgId } } }),
      db.assetAudit.count({ where: { orgId } }),
      db.finding.count({ where: { submission: { orgId } } }),
      db.finding.count({ where: { submission: { orgId }, status: { in: ["resolved", "overridden"] } } }),
      db.submission.count({ where: { orgId, status: "approved" } }),
      db.auditLog.count({ where: { orgId } }),
    ]);

    const activeIntegrations = (gitlabConn > 0 ? 1 : 0) + (googleConn > 0 ? 1 : 0) + (figmaConn > 0 ? 1 : 0) + (webhookCount > 0 ? 1 : 0);
    const totalAudits = inspectionCount + assetAuditCount;

    const stage1Completed = guidelineCount > 0 || tokenCount > 0;
    const stage2Completed = activeIntegrations > 0;
    const stage3Completed = submissionCount > 0;
    const stage4Completed = totalAudits > 0;
    const stage5Completed = findingCount > 0;
    const stage6Completed = resolvedFindingCount > 0 || approvedSubmissionCount > 0;
    const stage7Completed = auditLogCount > 0 && (approvedSubmissionCount > 0 || totalAudits > 0);

    const stagesRaw = [
      {
        id: 1,
        key: "guidelines",
        name: "Workspace & Guidelines",
        nameHi: "कार्यस्थान और दिशानिर्देश",
        description: "Brand voice, product facts, trademark rules & visual tokens",
        descriptionHi: "ब्रांड आवाज़, उत्पाद तथ्य, ट्रेडमार्क नियम और दृश्य टोकन",
        completed: stage1Completed,
        count: guidelineCount + tokenCount,
        detail: `${guidelineCount} docs, ${tokenCount} tokens`,
        detailHi: `${guidelineCount} दस्तावेज़, ${tokenCount} टोकन`,
        targetView: "knowledge",
      },
      {
        id: 2,
        key: "integrations",
        name: "Customer Onboarding & Integrations",
        nameHi: "ग्राहक ऑनबोर्डिंग और एकीकरण",
        description: "Connect GitLab OAuth, Google Docs, Figma & CI Webhooks",
        descriptionHi: "GitLab OAuth, Google Docs, Figma और CI वेबहुक कनेक्ट करें",
        completed: stage2Completed,
        count: activeIntegrations,
        detail: activeIntegrations > 0 ? `${activeIntegrations} connected` : "Not connected",
        detailHi: activeIntegrations > 0 ? `${activeIntegrations} कनेक्टेड` : "कनेक्ट नहीं है",
        targetView: "integrations",
      },
      {
        id: 3,
        key: "assets",
        name: "Creative Asset Intake",
        nameHi: "रचनात्मक सामग्री प्राप्ति",
        description: "Submit copy, banners, campaigns, or ingest via API/Webhooks",
        descriptionHi: "कॉपी, बैनर, अभियान सबमिट करें या API/वेबहुक से प्राप्त करें",
        completed: stage3Completed,
        count: submissionCount,
        detail: `${submissionCount} assets`,
        detailHi: `${submissionCount} सामग्रियां`,
        targetView: "scanner",
      },
      {
        id: 4,
        key: "audit",
        name: "Automated Brand Audit",
        nameHi: "स्वचालित ब्रांड ऑडिट",
        description: "Deterministic rules, claims fact-checking & vision inspection",
        descriptionHi: "नियम जांच, दावा तथ्य-सत्यापन और विज़न निरीक्षण",
        completed: stage4Completed,
        count: totalAudits,
        detail: `${totalAudits} audits run`,
        detailHi: `${totalAudits} ऑडिट पूर्ण`,
        targetView: "scanner",
      },
      {
        id: 5,
        key: "findings",
        name: "Governance Findings & Triage",
        nameHi: "शासन निष्कर्ष और समीक्षा",
        description: "Inspect flagged text, citations, severity & remediation suggestions",
        descriptionHi: "चिह्नित टेक्स्ट, उद्धरण, गंभीरता और सुधार सुझाव देखें",
        completed: stage5Completed,
        count: findingCount,
        detail: `${findingCount} findings`,
        detailHi: `${findingCount} निष्कर्ष`,
        targetView: "findings",
      },
      {
        id: 6,
        key: "remediation",
        name: "Remediation & Approval",
        nameHi: "सुधार और अनुमोदन",
        description: "Resolve findings, rewrite copy, review diffs & approve assets",
        descriptionHi: "निष्कर्ष सुधारें, कॉपी पुनः लिखें, अंतर देखें और अनुमोदित करें",
        completed: stage6Completed,
        count: resolvedFindingCount + approvedSubmissionCount,
        detail: `${resolvedFindingCount} resolved, ${approvedSubmissionCount} approved`,
        detailHi: `${resolvedFindingCount} हल किए, ${approvedSubmissionCount} अनुमोदित`,
        targetView: "approvals",
      },
      {
        id: 7,
        key: "governance",
        name: "Analytics & Cryptographic Log",
        nameHi: "एनालिटिक्स और क्रिप्टोग्राफिक लॉग",
        description: "Immutable SHA-256 audit hash-chain & brand governance analytics",
        descriptionHi: "अपरिवर्तनीय SHA-256 ऑडिट हैश-चेन और ब्रांड शासन एनालिटिक्स",
        completed: stage7Completed,
        count: auditLogCount,
        detail: `${auditLogCount} chain records`,
        detailHi: `${auditLogCount} चेन रिकॉर्ड`,
        targetView: "analytics",
      },
    ];

    // Find the current active stage (first incomplete, or last if all complete)
    let currentFound = false;
    const stages: WorkflowStage[] = stagesRaw.map((s) => {
      let isCurrent = false;
      if (!s.completed && !currentFound) {
        isCurrent = true;
        currentFound = true;
      }
      return { ...s, current: isCurrent };
    });
    if (!currentFound && stages.length > 0) {
      stages[stages.length - 1].current = true;
    }

    const completedCount = stages.filter((s) => s.completed).length;
    const totalStages = stages.length;
    const percentage = Math.round((completedCount / totalStages) * 100);

    return NextResponse.json({
      stages,
      completedCount,
      totalStages,
      percentage,
      orgName: user.orgName,
    });
  } catch (e) {
    return jsonError(e);
  }
}
