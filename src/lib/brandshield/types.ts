// ─── BrandShield AI — Shared Type Contracts ──────────────────────────────────

export type Role = "creator" | "reviewer" | "contractor" | "admin";
export type SubmissionStatus = "draft" | "in_review" | "changes_requested" | "approved";
export type Severity = "critical" | "warning" | "minor";
export type FindingCategory = "claim" | "tone" | "visual" | "style" | "trademark";
export type FindingStatus = "open" | "resolved" | "overridden";
export type Tier = "starter" | "growth" | "enterprise";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string | null;
  avatarColor: string;
  orgId: string;
  orgName: string;
  orgSlug: string;
  zeroDataRetention: boolean;
}

export interface GuidelineDoc {
  id: string;
  title: string;
  docType: string;
  content: string;
  sourceName: string | null;
  status: string;
  chunkCount: number;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisualToken {
  id: string;
  tokenType: "color" | "typography" | "logo" | string;
  name: string;
  value: string;
  secondary: string | null;
  usageNotes: string | null;
  createdAt: string;
}

export interface Finding {
  id: string;
  submissionId: string;
  severity: Severity;
  category: FindingCategory;
  flaggedText: string;
  ruleCitation: string;
  sourceDoc: string;
  rationale: string;
  suggestion: string | null;
  suggestedHex: string | null;
  stage: "deterministic" | "ai" | "vision" | string;
  status: FindingStatus;
  overrideNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface Inspection {
  id: string;
  submissionId: string;
  stageA: StageAResult;
  stageB: StageBResult;
  durationMs: number;
  complianceScore: number;
  createdAt: string;
}

export interface StageAResult {
  durationMs: number;
  bannedTerms: { term: string; index: number; excerpt: string }[];
  trademarkIssues: { brand: string; expectedGlyph: string; index: number; excerpt: string }[];
  claimCandidates: string[];
  hexCodesFound: string[];
  styleIssues: { type: string; excerpt: string; detail: string }[];
  checks: { name: string; passed: boolean; count: number; ms: number }[];
}

export interface StageBResult {
  durationMs: number;
  tone: {
    score: number;
    voiceSummary: string;
    driftFlags: { phrase: string; reason: string; suggestion: string }[];
  } | null;
  claimVerdicts: {
    claim: string;
    verdict: "SUPPORTED" | "UNSUPPORTED" | "UNVERIFIABLE";
    citation: string;
    sourceDoc: string;
    rationale: string;
    suggestion: string;
  }[];
  vision: {
    dominantColors: string[];
    offBrandColors: string[];
    contrastIssues: { foreground: string; background: string; ratio: number; requirement: string }[];
    logoPresent: boolean | null;
    ocrText: string;
    summary: string;
  } | null;
}

export interface Revision {
  id: string;
  submissionId: string;
  version: number;
  content: string;
  changeSummary: string | null;
  authorId: string;
  authorName?: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  orgId: string;
  submissionId: string | null;
  actorId: string;
  actorName?: string;
  action: string;
  details: Record<string, unknown>;
  contentHash: string;
  prevHash: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  orgId: string;
  authorId: string;
  authorName?: string;
  authorRole?: Role;
  department: string | null;
  title: string;
  contentType: "text" | "banner" | string;
  content: string;
  imageData: string | null;
  imagePalette: string[];
  status: SubmissionStatus;
  complianceScore: number | null;
  scanCount: number;
  currentVersion: number;
  creatorNote: string | null;
  findings?: Finding[];
  revisions?: Revision[];
  inspections?: Inspection[];
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionInfo {
  tier: Tier;
  status: string;
  scanLimit: number;
  scansUsed: number;
  seats: number;
  priceCents: number;
  currentPeriodEnd: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  avatarColor: string;
}

export interface AnalyticsPayload {
  totals: {
    submissions: number;
    scans: number;
    findings: number;
    openFindings: number;
    approved: number;
    avgCompliance: number;
    avgResolutionHours: number;
  };
  severityBreakdown: { severity: Severity; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
  topViolatedRules: { rule: string; sourceDoc: string; count: number; category: string }[];
  departmentScores: { department: string; avgScore: number; submissions: number }[];
  scanTrend: { date: string; scans: number; findings: number }[];
  statusDistribution: { status: SubmissionStatus; count: number }[];
  ambiguousPolicies: {
    rule: string;
    sourceDoc: string;
    triggers: number;
    overrideRate: number;
    openRate: number;
    frictionScore: number;
    verdict: string;
  }[];
}

// ─── API Envelope ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
  upgradeTier?: Tier;
}

export const SEVERITY_META: Record<Severity, { label: string; color: string; bg: string; border: string; text: string; dot: string }> = {
  critical: {
    label: "Critical Claim Mismatch",
    color: "#DC2626",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-600",
  },
  warning: {
    label: "Warning — Tone / Visual Drift",
    color: "#D97706",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  minor: {
    label: "Minor Style",
    color: "#0F766E",
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-700",
    dot: "bg-teal-600",
  },
};

export const CATEGORY_META: Record<FindingCategory, { label: string; icon: string }> = {
  claim: { label: "Factual Claim", icon: "ShieldAlert" },
  tone: { label: "Tone of Voice", icon: "Mic" },
  visual: { label: "Visual / WCAG", icon: "Palette" },
  style: { label: "Style Mechanics", icon: "Type" },
  trademark: { label: "Trademark", icon: "Copyright" },
};

export const STATUS_META: Record<SubmissionStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
  in_review: { label: "In Review", className: "bg-amber-50 text-amber-700 border-amber-200" },
  changes_requested: { label: "Changes Requested", className: "bg-orange-50 text-orange-700 border-orange-200" },
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export const TIER_META: Record<Tier, { name: string; price: number; blurb: string; features: string[]; scanLimit: number }> = {
  starter: {
    name: "Starter — Agency Sandbox",
    price: 49,
    blurb: "Self-service pre-flight sandbox for external agencies testing copy against client-approved guidelines.",
    features: ["50 pre-flight scans / month", "Deterministic + tone checks", "Single client workspace", "Banned-term & trademark validator", "Community support"],
    scanLimit: 50,
  },
  growth: {
    name: "Growth — Team Governance",
    price: 199,
    blurb: "Unlimited multi-modal audits with RAG claim verification and a role-based review board.",
    features: ["Unlimited text & banner audits", "RAG claim verification w/ citations", "Role-based review board", "One-click tone-preserving rewrites", "WCAG 2.1 visual inspector", "Priority support"],
    scanLimit: -1,
  },
  enterprise: {
    name: "Enterprise — Custom Shield",
    price: 499,
    blurb: "Custom vector knowledge bases, cryptographic audit exports, SSO, and bi-directional analytics.",
    features: ["Everything in Growth", "Custom vector knowledge bases", "SHA-256 cryptographic audit exports", "SSO / OAuth + MFA enforcement", "Bi-directional rule-friction analytics", "Zero-data-retention guarantee", "Dedicated success manager"],
    scanLimit: -1,
  },
};
