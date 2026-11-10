import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";

interface GoogleDocStructuralElement {
  paragraph?: {
    elements?: Array<{
      textRun?: {
        content?: string;
      };
    }>;
    paragraphStyle?: {
      namedStyleType?: string;
    };
  };
}

interface GoogleDocResponse {
  title?: string;
  body?: {
    content?: GoogleDocStructuralElement[];
  };
}

/**
 * Extracts plain text and heading hierarchy from Google Docs API JSON structure
 */
function extractDocContent(doc: GoogleDocResponse): {
  fullText: string;
  headings: { level: string; text: string }[];
  paragraphs: string[];
} {
  const headings: { level: string; text: string }[] = [];
  const paragraphs: string[] = [];
  let fullText = "";

  const elements = doc.body?.content || [];
  for (const elem of elements) {
    if (elem.paragraph) {
      let paraText = "";
      for (const el of elem.paragraph.elements || []) {
        if (el.textRun?.content) {
          paraText += el.textRun.content;
        }
      }

      const cleanText = paraText.trim();
      if (!cleanText) continue;

      const style = elem.paragraph.paragraphStyle?.namedStyleType || "NORMAL_TEXT";
      if (style.startsWith("HEADING_") || style === "TITLE" || style === "SUBTITLE") {
        headings.push({ level: style, text: cleanText });
      } else {
        paragraphs.push(cleanText);
      }

      fullText += `${cleanText}\n`;
    }
  }

  return { fullText, headings, paragraphs };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json()) as {
      documentUrl?: string;
      documentId?: string;
      manualContent?: string;
      sampleKey?: string;
    };

    let docId = body.documentId?.trim();
    if (body.documentUrl) {
      const match = body.documentUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) docId = match[1];
    }

    const gdocToken = req.cookies.get("brandshield_gdoc_token")?.value;

    let docTitle = "Google Docs Pre-Publishing Audit";
    let extractedText = body.manualContent || "";
    let headings: { level: string; text: string }[] = [];
    let paragraphs: string[] = [];

    // 1. If Google Docs API token is available and docId is provided, attempt live fetch
    if (docId && gdocToken) {
      try {
        const docRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
          headers: { Authorization: `Bearer ${gdocToken}` },
        });

        if (docRes.ok) {
          const docData = (await docRes.json()) as GoogleDocResponse;
          docTitle = docData.title || `Document ${docId}`;
          const extracted = extractDocContent(docData);
          extractedText = extracted.fullText;
          headings = extracted.headings;
          paragraphs = extracted.paragraphs;
        }
      } catch (err) {
        console.warn("[GoogleDocsInspect] Live fetch error, falling back to content analysis:", err);
      }
    }

    // 2. Sample document fallback for demonstration or unlinked accounts
    if (!extractedText.trim()) {
      if (body.sampleKey === "q3_campaign" || !docId) {
        docTitle = "NimbusPay Q3 Merchant Growth Campaign Brief";
        headings = [
          { level: "TITLE", text: "NimbusPay Q3 Growth Launch Brief" },
          { level: "HEADING_1", text: "Why Choose NimbusPay?!" },
          { level: "HEADING_2", text: "Guaranteed 100% Risk-Free Merchant Settlement" },
        ];
        paragraphs = [
          "NimbusPay is the world's best payment orchestration platform for global merchants.",
          "Our revolutionary PayLinks allow merchants to receive funds instantly with zero risk.",
          "We offer guaranteed settlement times that can't fail regardless of banking holidays.",
        ];
        extractedText = `${headings.map((h) => h.text).join("\n")}\n\n${paragraphs.join("\n")}`;
      }
    }

    // 3. Perform Brand Governance & WCAG checks on extracted document content
    const findings: {
      category: "claim" | "tone" | "style" | "trademark";
      severity: "critical" | "warning" | "minor";
      ruleCitation: string;
      flaggedText: string;
      context: string;
      suggestion: string;
    }[] = [];

    // Banned absolute financial claims (RULE VOICE-04)
    const BANNED_CLAIMS = [
      { term: "guaranteed", rule: "VOICE-04", rewrite: "designed to provide predictable" },
      { term: "risk-free", rule: "VOICE-04", rewrite: "with robust risk management" },
      { term: "100% safe", rule: "VOICE-04", rewrite: "SOC 2 Type II certified and PCI DSS compliant" },
      { term: "can't fail", rule: "VOICE-04", rewrite: "highly resilient" },
      { term: "zero risk", rule: "VOICE-04", rewrite: "hedged risk profile" },
    ];

    for (const b of BANNED_CLAIMS) {
      const regex = new RegExp(`\\b${b.term}\\b`, "gi");
      let match;
      while ((match = regex.exec(extractedText)) !== null) {
        const start = Math.max(0, match.index - 30);
        const end = Math.min(extractedText.length, match.index + b.term.length + 30);
        findings.push({
          category: "claim",
          severity: "critical",
          ruleCitation: b.rule,
          flaggedText: match[0],
          context: `...${extractedText.slice(start, end).replace(/\n/g, " ")}...`,
          suggestion: `Replace absolute guarantee "${match[0]}" with factual phrasing: "${b.rewrite}".`,
        });
      }
    }

    // Superlatives and hype adjectives (RULE VOICE-03)
    const HYPE = [
      { term: "world's best", rule: "VOICE-03", rewrite: "independently audited high-performance" },
      { term: "revolutionary", rule: "VOICE-03", rewrite: "modernized" },
      { term: "unbeatable", rule: "VOICE-03", rewrite: "competitive" },
    ];

    for (const h of HYPE) {
      const regex = new RegExp(`\\b${h.term}\\b`, "gi");
      let match;
      while ((match = regex.exec(extractedText)) !== null) {
        findings.push({
          category: "tone",
          severity: "warning",
          ruleCitation: h.rule,
          flaggedText: match[0],
          context: match[0],
          suggestion: `Remove unsubstantiated superlative "${match[0]}". Use verified metrics or "${h.rewrite}".`,
        });
      }
    }

    // Heading punctuation (RULE STYLE-01) & Capitalization (STYLE-02)
    for (const h of headings) {
      if (h.text.includes("?!") || h.text.includes("!!")) {
        findings.push({
          category: "style",
          severity: "warning",
          ruleCitation: "STYLE-01",
          flaggedText: h.text,
          context: `Heading: "${h.text}"`,
          suggestion: `Punctuation violation. Remove combined punctuation ("?!", "!!") from headings.`,
        });
      }
    }

    // Trademark naming rules (RULE TM-01 & TM-03)
    if (extractedText.includes("NimbusPay") && !extractedText.includes("NimbusPay®")) {
      findings.push({
        category: "trademark",
        severity: "minor",
        ruleCitation: "TM-01",
        flaggedText: "NimbusPay",
        context: "First prominent occurrence in marketing copy",
        suggestion: "Add registered trademark glyph: 'NimbusPay®' on first occurrence in document.",
      });
    }

    if (extractedText.includes("PayLinks") && !extractedText.includes("PayLinks™")) {
      findings.push({
        category: "trademark",
        severity: "minor",
        ruleCitation: "TM-03",
        flaggedText: "PayLinks",
        context: "Product naming",
        suggestion: "Product sub-brand 'PayLinks™' requires the ™ glyph.",
      });
    }

    const criticalViolations = findings.filter((f) => f.severity === "critical").length;
    const warningViolations = findings.filter((f) => f.severity === "warning").length;
    const complianceScore = Math.max(0, 100 - criticalViolations * 25 - warningViolations * 10 - findings.length * 3);
    const passed = criticalViolations === 0 && complianceScore >= 75;

    // Persist to AssetAudit
    const audit = await db.assetAudit.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        assetName: docTitle,
        assetType: "google_docs",
        status: passed ? "completed" : "failed",
        complianceScore,
        findingsCount: findings.length,
        violationsJson: JSON.stringify(findings),
        metadataJson: JSON.stringify({
          documentId: docId || "sample-doc",
          headingsCount: headings.length,
          paragraphsCount: paragraphs.length,
          inspectedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      document: {
        title: docTitle,
        documentId: docId,
        headingsCount: headings.length,
        paragraphsCount: paragraphs.length,
        headings,
      },
      audit: {
        id: audit.id,
        passed,
        complianceScore,
        criticalCount: criticalViolations,
        warningCount: warningViolations,
        findingsCount: findings.length,
      },
      findings,
    });
  } catch (e) {
    return jsonError(e);
  }
}

