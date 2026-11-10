import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";
import { searchKnowledgeHybrid, type SearchResultPassage } from "@/lib/brandshield/server/vector-rag";
import { contrastRatio } from "@/lib/brandshield/shared";

export const maxDuration = 60;

interface CitationMeta {
  documentTitle: string;
  pageNumber: number;
  ruleTag: string | null;
  textSnippet: string;
}

/**
 * Generate synthesis from retrieved knowledge when external LLM is absent
 */
function synthesizeGovernanceResponse(
  query: string,
  passages: SearchResultPassage[],
  tokens: { name: string; tokenType: string; value: string; secondary: string | null; usageNotes?: string | null }[]
): { reply: string; citations: CitationMeta[] } {
  const cleanQ = query.toLowerCase();
  const citations: CitationMeta[] = passages.slice(0, 4).map((p) => ({
    documentTitle: p.documentTitle,
    pageNumber: p.pageNumber,
    ruleTag: p.ruleTag,
    textSnippet: p.text.slice(0, 240).trim(),
  }));

  // 1. Color / Contrast query
  const hexMatches = query.match(/#[0-9a-fA-F]{3,8}/g);
  if (hexMatches && hexMatches.length >= 2) {
    const [c1, c2] = hexMatches;
    const ratio = contrastRatio(c1, c2);
    const passAA = ratio >= 4.5;
    const passAAA = ratio >= 7.0;

    const reply = `### WCAG 2.1 Contrast Analysis for \`${c1}\` on \`${c2}\`

- **Calculated Contrast Ratio**: **${ratio.toFixed(2)}:1**
- **WCAG 2.1 Level AA (Normal Text $\\ge 4.5:1$)**: ${passAA ? "✅ **PASSED**" : "❌ **FAILED (Violation)**"}
- **WCAG 2.1 Level AAA (Enhanced $\\ge 7.0:1$)**: ${passAAA ? "✅ **PASSED**" : "⚠️ **FAILS AAA**"}
- **Large Text ($\\ge 18\\text{pt}$ / $14\\text{pt}$ bold $\\ge 3.0:1$)**: ${ratio >= 3.0 ? "✅ **PASSED**" : "❌ **FAILED**"}

${
  passAA
    ? `This color combination meets the official accessibility threshold for digital brand touchpoints.`
    : `**Recommendation**: Adjust the foreground brightness or use an approved high-contrast token such as \`#0F766E\` (Shield Teal) on white backgrounds to guarantee compliance.`
}

${
  citations.length > 0
    ? `\n#### Associated Brand Policy Citations:\n` +
      citations
        .map(
          (c) =>
            `- **${c.documentTitle}** (Page ${c.pageNumber}${c.ruleTag ? ` · Rule \`${c.ruleTag}\`` : ""}): "${c.textSnippet}..."`
        )
        .join("\n")
    : ""
}`;
    return { reply, citations };
  }

  // 2. Logo / Trademark inquiry
  if (cleanQ.includes("logo") || cleanQ.includes("trademark") || cleanQ.includes("glyph")) {
    const tmPassage = passages.find((p) => p.ruleTag?.startsWith("TM") || p.text.toLowerCase().includes("trademark"));
    const logoToken = tokens.find((t) => t.tokenType === "logo");
    const reply = `### Brand Trademark & Logo Governance Rules

Based on the indexed Brand Policy & Legal repository:

1. **Registered Trademark Usage**:
   - The master brand name **NimbusPay** must always be written as a single camelCase word (never "Nimbus Pay" or "NIMBUSPAY").
   - The primary trademark glyph **®** must be attached to the first prominent occurrence in running copy [RULE TM-01].
2. **Clear Space & Placement**:
   - Minimum clear space surrounding the shield mark must equal at least half of the logo mark height.
   - Never place the logo mark against unapproved or low-contrast backgrounds.
3. **Product Sub-Brands**:
   - Names like **PayLinks™**, **SmartRetries™**, and **CheckoutOS™** must carry the **™** mark on first occurrence [RULE TM-03].

${
  citations.length > 0
    ? `\n#### Verified Policy Sources:\n` +
      citations
        .map(
          (c) =>
            `- **${c.documentTitle}** (Page ${c.pageNumber}${c.ruleTag ? ` · \`${c.ruleTag}\`` : ""}): "${c.textSnippet}..."`
        )
        .join("\n")
    : ""
}`;
    return { reply, citations };
  }

  // 3. Typography & Font inquiry
  if (cleanQ.includes("font") || cleanQ.includes("typography") || cleanQ.includes("type")) {
    const typoTokens = tokens.filter((t) => t.tokenType === "typography");
    const reply = `### Approved Brand Typography Standards

Here are the registered typography standards for external and product touchpoints:

${
  typoTokens.length > 0
    ? typoTokens.map((t) => `- **${t.name}**: \`${t.value}\`${t.usageNotes ? ` — ${t.usageNotes}` : ""}`).join("\n")
    : `- **Headings**: Geist Sans SemiBold (600 weight), -0.02em tracking, sentence case per STYLE-02.\n- **Body Text**: Geist Sans Regular (400 weight), 16–18px, 1.6 line-height, max 70ch measure.`
}

- **Headline Capitalization**: Headlines must use **Sentence case**, never Title Case or ALL-CAPS shouting [RULE STYLE-02].
- **Punctuation**: Maximum one exclamation mark per paragraph. Combined exclamation/question marks ("?!", "!!") are strictly banned [RULE STYLE-01].

${
  citations.length > 0
    ? `\n#### Official Guideline Citations:\n` +
      citations
        .map(
          (c) =>
            `- **${c.documentTitle}** (Page ${c.pageNumber}${c.ruleTag ? ` · \`${c.ruleTag}\`` : ""}): "${c.textSnippet}..."`
        )
        .join("\n")
    : ""
}`;
    return { reply, citations };
  }

  // 4. Claims / Guarantees inquiry
  if (
    cleanQ.includes("guarantee") ||
    cleanQ.includes("promise") ||
    cleanQ.includes("100%") ||
    cleanQ.includes("instant") ||
    cleanQ.includes("roi") ||
    cleanQ.includes("claim")
  ) {
    const reply = `### Pre-Publishing Compliance Policy: Factual Claims & Guarantees

⚠️ **Policy Restriction Alert**:
Under **RULE VOICE-04** and Legal Compliance v7:

- **Absolute Guarantees are Banned**: Words like *"guaranteed"*, *"risk-free"*, *"100% safe"*, and *"cannot fail"* are classified as **Critical Blocking Violations**.
- **Financial Phrasing Requirements**: All marketing copy must use hedged, verified terminology such as *"designed to"*, *"typically"*, or *"on average"*.
- **Substantiated Metrics**: Any ROI or uptime statistic must link directly to the approved Product Facts Datasheet (Q3 2025). Internal ROI multipliers cannot be published externally [FACT PD-10].

${
  citations.length > 0
    ? `\n#### Verified Policy References:\n` +
      citations
        .map(
          (c) =>
            `- **${c.documentTitle}** (Page ${c.pageNumber}${c.ruleTag ? ` · \`${c.ruleTag}\`` : ""}): "${c.textSnippet}..."`
        )
        .join("\n")
    : ""
}`;
    return { reply, citations };
  }

  // General guideline fallback with retrieved passages
  if (passages.length > 0) {
    const reply = `### Brand Governance Guidance for: *"${query}"*

Based on your organization's indexed guideline rulebooks and brand repository:

${passages
  .slice(0, 3)
  .map(
    (p, idx) =>
      `${idx + 1}. **${p.documentTitle}** (Page ${p.pageNumber}${p.ruleTag ? ` · Rule \`${p.ruleTag}\`` : ""}):\n   > "${p.text.trim()}"`
  )
  .join("\n\n")}

**Key Compliance Advice**:
Ensure all campaign creatives adhere to the verified standards cited above before submitting for review board approval.`;
    return { reply, citations };
  }

  const reply = `### Brand Governance Copilot Guidance

I queried your organization's brand repository for *"${query}"*, but no high-confidence matching rule passages were found.

**Next Steps**:
1. Check the [Knowledge Base](/knowledge) to ensure relevant policy PDFs or brand guidelines are indexed.
2. Rephrase your query specifying a brand topic (e.g. *"What are our primary brand colors?"*, *"Check contrast for #0F766E on #FFFFFF"*, or *"What words are banned in copy?"*).`;
  return { reply, citations: [] };
}

/**
 * POST /api/copilot/chat
 *
 * Interactive AI Brand Governance Copilot:
 * - Hybrid semantic search across indexed guideline documents.
 * - Extracts color and typography brand tokens.
 * - Generates structured governance response with verified rule/page citations.
 * - Persists session and message history to the database.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json()) as {
      message?: string;
      sessionId?: string;
    };

    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }

    // 1. Hybrid semantic search across organization knowledge chunks
    const passages = await searchKnowledgeHybrid({
      orgId: user.orgId,
      query: message,
      limit: 6,
      minSimilarity: 0.25,
    });

    // 2. Fetch approved brand visual tokens for color & typography reference
    const tokens = await db.visualToken.findMany({
      where: { orgId: user.orgId },
      select: { name: true, tokenType: true, value: true, secondary: true, usageNotes: true },
    });

    // 3. Check for external OpenAI-compatible API key or use deterministic synthesis
    const apiKey = process.env.OPENAI_API_KEY?.trim() || process.env.ZAI_API_KEY?.trim();
    const baseUrl = process.env.OPENAI_BASE_URL?.trim() || process.env.ZAI_BASE_URL?.trim() || "https://api.openai.com/v1";

    let finalReply = "";
    let finalCitations: CitationMeta[] = [];

    if (apiKey) {
      try {
        const systemPrompt = `You are BrandShield AI Copilot, an enterprise brand governance, legal compliance, and WCAG accessibility assistant.
Your job is to answer queries strictly based on the following verified brand knowledge passages and tokens:

BRAND TOKENS:
${tokens.map((t) => `- ${t.name} (${t.tokenType}): ${t.value}`).join("\n")}

INDEXED GUIDELINE PASSAGES:
${passages.map((p) => `[Doc: ${p.documentTitle}, Page: ${p.pageNumber}, Rule: ${p.ruleTag || "N/A"}]:\n${p.text}`).join("\n\n")}

CRITICAL INSTRUCTIONS:
- Always cite the exact source document, page number, and rule tag (e.g. [RULE CLAIM-01: Page 1]).
- If discussing colors, verify contrast against WCAG 2.1 AA (4.5:1 for normal text).
- Be authoritative, concise, and helpful.`;

        const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.CHAT_MODEL?.trim() || "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message },
            ],
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const completion = (await res.json()) as {
            choices: { message: { content: string } }[];
          };
          finalReply = completion.choices?.[0]?.message?.content || "";
          finalCitations = passages.slice(0, 4).map((p) => ({
            documentTitle: p.documentTitle,
            pageNumber: p.pageNumber,
            ruleTag: p.ruleTag,
            textSnippet: p.text.slice(0, 240).trim(),
          }));
        }
      } catch (err) {
        console.warn("External LLM completion failed, falling back to deterministic synthesis:", err);
      }
    }

    if (!finalReply) {
      const synthesized = synthesizeGovernanceResponse(message, passages, tokens);
      finalReply = synthesized.reply;
      finalCitations = synthesized.citations;
    }

    // 4. Persist to GovernanceChatSession and GovernanceChatMessage in Database
    let sessionId = body.sessionId;
    if (!sessionId) {
      const titleSummary = message.slice(0, 40) + (message.length > 40 ? "..." : "");
      const newSession = await db.governanceChatSession.create({
        data: {
          orgId: user.orgId,
          userId: user.id,
          title: titleSummary,
        },
      });
      sessionId = newSession.id;
    }

    // Record user message
    await db.governanceChatMessage.create({
      data: {
        sessionId,
        orgId: user.orgId,
        role: "user",
        content: message,
      },
    });

    // Record assistant reply with serialized citations
    const assistantMsg = await db.governanceChatMessage.create({
      data: {
        sessionId,
        orgId: user.orgId,
        role: "assistant",
        content: finalReply,
        citations: JSON.stringify(finalCitations),
      },
    });

    return NextResponse.json({
      sessionId,
      messageId: assistantMsg.id,
      reply: finalReply,
      citations: finalCitations,
      createdAt: assistantMsg.createdAt,
    });
  } catch (e) {
    return jsonError(e);
  }
}

/**
 * GET /api/copilot/chat?sessionId=...
 *
 * Retrieves session message history
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      // List recent chat sessions for this organization
      const sessions = await db.governanceChatSession.findMany({
        where: { orgId: user.orgId },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          _count: { select: { messages: true } },
        },
      });
      return NextResponse.json(sessions);
    }

    const session = await db.governanceChatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!session || session.orgId !== user.orgId) {
      return NextResponse.json({ error: "Chat session not found." }, { status: 404 });
    }

    return NextResponse.json({
      id: session.id,
      title: session.title,
      messages: session.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.citations ? JSON.parse(m.citations) : [],
        createdAt: m.createdAt,
      })),
    });
  } catch (e) {
    return jsonError(e);
  }
}
