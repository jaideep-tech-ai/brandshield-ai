import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/brandshield/server/auth";
import { jsonError } from "@/lib/brandshield/server/json";
import { searchKnowledgeHybrid, type SearchResultPassage } from "@/lib/brandshield/server/vector-rag";
import { contrastRatio } from "@/lib/brandshield/shared";
import { checkRateLimit, clientIp } from "@/lib/brandshield/server/rate-limit";

export const maxDuration = 60;

interface CitationMeta {
  documentTitle: string;
  pageNumber: number;
  ruleTag: string | null;
  textSnippet: string;
}

/**
 * Intelligent deterministic & semantic RAG synthesis engine
 * Used when external LLM credentials are not configured or when offline fallback is needed.
 */
function synthesizeGovernanceResponse(
  query: string,
  passages: SearchResultPassage[],
  tokens: { name: string; tokenType: string; value: string; secondary: string | null; usageNotes?: string | null }[],
  userRole: string,
  lang: string
): { reply: string; citations: CitationMeta[] } {
  const cleanQ = query.toLowerCase();
  const isHindi = lang === "hi" || /[\u0900-\u097F]/.test(query);

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

    if (isHindi) {
      const reply = `### \`${c1}\` और \`${c2}\` के लिए WCAG 2.1 कंट्रास्ट विश्लेषण

- **गणना किया गया कंट्रास्ट अनुपात**: **${ratio.toFixed(2)}:1**
- **WCAG 2.1 लेवल AA (सामान्य टेक्स्ट $\\ge 4.5:1$)**: ${passAA ? "✅ **उत्तीर्ण (PASSED)**" : "❌ **विफल (उल्लंघन)**"}
- **WCAG 2.1 लेवल AAA (संवर्धित $\\ge 7.0:1$)**: ${passAAA ? "✅ **उत्तीर्ण (PASSED)**" : "⚠️ **AAA में विफल**"}
- **बड़ा टेक्स्ट ($\\ge 18\\text{pt}$ / $14\\text{pt}$ बोल्ड $\\ge 3.0:1$)**: ${ratio >= 3.0 ? "✅ **उत्तीर्ण**" : "❌ **विफल**"}

${
  passAA
    ? `यह रंग संयोजन डिजिटल ब्रांड टचपॉइंट्स के आधिकारिक पहुंच मानकों को पूरा करता है।`
    : `**सिफारिश**: अग्रभूमि की चमक को समायोजित करें या सफेद पृष्ठभूमि पर अनुपालन की गारंटी देने के लिए अनुमोदित उच्च-कंट्रास्ट टोकन जैसे \`#0F766E\` (शील्ड टील) का उपयोग करें।`
}

${
  citations.length > 0
    ? `\n#### संबंधित ब्रांड नीति उद्धरण:\n` +
      citations
        .map(
          (c) =>
            `- **${c.documentTitle}** (पृष्ठ ${c.pageNumber}${c.ruleTag ? ` · नियम \`${c.ruleTag}\`` : ""}): "${c.textSnippet}..."`
        )
        .join("\n")
    : ""
}`;
      return { reply, citations };
    }

    const reply = `### WCAG 2.1 Contrast Analysis for \`${c1}\` on \`${c2}\`

- **Calculated Contrast Ratio**: **${ratio.toFixed(2)}:1**
- **WCAG 2.1 Level AA (Normal Text $\\ge 4.5:1$)**: ${passAA ? "✅ **PASSED**" : "❌ **FAILED (Violation)**"}
- **WCAG 2.1 Level AAA (Enhanced $\\ge 7.0:1$)**: ${passAAA ? "✅ **PASSED**" : "⚠️ **Failed AAA Threshold**"}
- **Large Text ($\\ge 18\\text{pt}$ or $14\\text{pt}$ Bold $\\ge 3.0:1$)**: ${ratio >= 3.0 ? "✅ **PASSED**" : "❌ **FAILED**"}

${
  passAA
    ? `This color pairing meets official accessibility standards for digital brand touchpoints.`
    : `**Remediation Recommendation**: Adjust the foreground luminance or switch to approved high-contrast brand tokens like \`#0F766E\` (Shield Teal) on white backgrounds to guarantee compliance.`
}

${
  citations.length > 0
    ? `\n#### Relevant Brand Policy Citations:\n` +
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

  // 2. Prohibited Claims query
  if (
    cleanQ.includes("claim") ||
    cleanQ.includes("banned") ||
    cleanQ.includes("prohibited") ||
    cleanQ.includes("guarantee") ||
    cleanQ.includes("daawa") ||
    cleanQ.includes("प्रतिबंधित")
  ) {
    if (isHindi) {
      const reply = `### ब्रांडशील्ड एआई: निषिद्ध दावे एवं अनुपालन नियम

ब्रांड दिशानिर्देशों के अनुसार, निम्नलिखित श्रेणियों के दावे सख्त वर्जित हैं:

1. **अपरिमेय एवं निरपेक्ष दावे (Absolute Guarantees)**:
   - \`"100% सुरक्षित"\`, \`"पूर्ण गारंटी"\`, \`"शून्य जोखिम"\` जैसे शब्दों का प्रयोग निषिद्ध है (नियम \`CLAIM-01\`)।
   - **स्वीकृत विकल्प**: \`"उद्योग-अग्रणी सुरक्षा मानकों के साथ डिज़ाइन किया गया"\`।

2. **अपुष्ट अतिशयोक्ति (Unsubstantiated Superlatives)**:
   - \`"विश्व का सर्वश्रेष्ठ"\`, \`"अजेय प्रदर्शन"\` (नियम \`VOICE-02\`) बिना स्वतंत्र तीसरे पक्ष के ऑडिट के उपयोग नहीं किए जा सकते।

3. **वित्तीय एवं रिटर्न संबंधी दावे**:
   - कोई भी भविष्योन्मुखी वित्तीय रिटर्न वादा बिना अनिवार्य कानूनी अस्वीकरण (Disclaimer) के प्रकाशित नहीं किया जा सकता।

${
  citations.length > 0
    ? `\n#### आधिकारिक ब्रांड दस्तावेज़ उद्धरण:\n` +
      citations
        .map(
          (c) =>
            `- **${c.documentTitle}** (पृष्ठ ${c.pageNumber}${c.ruleTag ? ` · \`${c.ruleTag}\`` : ""}): "${c.textSnippet}..."`
        )
        .join("\n")
    : ""
}`;
      return { reply, citations };
    }

    const reply = `### BrandShield AI: Prohibited Claims & Regulatory Governance

Under official brand compliance policies, the following categories of marketing claims are strictly barred:

1. **Absolute Guarantees & Unverified Safety**:
   - Terms like \`"100% safe"\`, \`"guaranteed zero risk"\`, or \`"foolproof"\` are strictly prohibited (Rule \`CLAIM-01\`).
   - **Compliant Alternative**: \`"Engineered to industry-leading cryptographic security standards."\`

2. **Unsubstantiated Superlatives**:
   - Claims such as \`"World's #1"\` or \`"Best-in-class"\` (Rule \`VOICE-02\`) require contemporaneous third-party audit citations.

3. **Financial & Performance Projections**:
   - Forward-looking financial yields without mandatory regulatory disclaimers fail pre-publishing gate audits.

${
  citations.length > 0
    ? `\n#### Verified Policy Ground-Truth Citations:\n` +
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

  // 3. Fallback answer synthesising passages and tokens
  const tokenList = tokens.map((t) => `\`${t.name}\` (${t.value})`).join(", ") || "Shield Teal (`#0F766E`), Mint Accent (`#14B8A6`)";

  if (isHindi) {
    const reply = `### ब्रांडशील्ड एआई अनुपालन उत्तर

आपकी पूछताछ: **"${query}"**

${
  citations.length > 0
    ? `संगठन के नॉलेज बेस से प्राप्त आधिकारिक दिशानिर्देश:\n\n` +
      citations
        .map(
          (c) =>
            `> "${c.textSnippet}..."\n> — *${c.documentTitle}*, पृष्ठ ${c.pageNumber}${c.ruleTag ? ` (नियम \`${c.ruleTag}\`)` : ""}`
        )
        .join("\n\n")
    : `सक्रिय ज्ञानकोष में इस विशिष्ट विषय पर कोई सीधा दस्तावेज़ नहीं मिला। सामान्य ब्रांड मानकों के अनुसार:`
}

- **सक्रिय ब्रांड रंग टोकन**: ${tokenList}
- **अनुपालन स्तर**: डिजिटल संपत्तियों को प्रकाशित करने से पूर्व न्यूनतम **85/100** समग्र स्कोर अनिवार्य है।
- **भूमिका निर्देश (${userRole})**: सभी परिवर्तनों को ऑडिट ट्रेल में क्रिप्टोग्राफिक रूप से लॉग किया जाता है।`;
    return { reply, citations };
  }

  const reply = `### BrandShield AI Compliance Analysis

Regarding your inquiry: **"${query}"**

${
  citations.length > 0
    ? `Official policy passages retrieved from your organization's knowledge base:\n\n` +
      citations
        .map(
          (c) =>
            `> "${c.textSnippet}..."\n> — *${c.documentTitle}*, Page ${c.pageNumber}${c.ruleTag ? ` (Rule \`${c.ruleTag}\`)` : ""}`
        )
        .join("\n\n")
    : `No exact policy document matches were found in your indexed guidelines. Based on master brand specifications:`
}

- **Active Visual Tokens**: ${tokenList}
- **Compliance Baseline**: Pre-publishing releases require a composite score $\\ge 85/100$ and zero open critical violations.
- **Workflow (${userRole})**: All evaluations are timestamped and signed into the cryptographic audit ledger.`;
  return { reply, citations };
}

// ─── GET /api/chat: Retrieve Chat Sessions or Message History ──────────────────

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      const session = await db.governanceChatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!session) {
        return NextResponse.json({ error: "Chat session not found." }, { status: 404 });
      }

      if (session.orgId !== user.orgId || (session.userId !== user.id && user.role !== "admin")) {
        return NextResponse.json({ error: "Access denied to chat session." }, { status: 403 });
      }

      const formattedMessages = session.messages.map((m) => {
        let parsedCitations = undefined;
        if (m.citations) {
          try {
            parsedCitations = JSON.parse(m.citations);
          } catch {
            // ignore unparseable citations
          }
        }
        return {
          id: m.id,
          role: m.role,
          content: m.content,
          citations: parsedCitations,
          createdAt: m.createdAt.toISOString(),
        };
      });

      return NextResponse.json({
        session: {
          id: session.id,
          title: session.title,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
        },
        messages: formattedMessages,
      });
    }

    // List recent chat sessions for this user within org
    const sessions = await db.governanceChatSession.findMany({
      where: {
        orgId: user.orgId,
        ...(user.role === "admin" ? {} : { userId: user.id }),
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        messageCount: s._count.messages,
      })),
    });
  } catch (e) {
    return jsonError(e);
  }
}

// ─── POST /api/chat: Conversational AI Chat Endpoint ──────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rateLimit = checkRateLimit(`chat:${ip}`, 40, 60000);
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many chat requests. Please wait a moment before sending more messages." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSec) } }
      );
    }

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      message?: string;
      sessionId?: string;
      lang?: string;
    };

    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }

    if (message.length > 4000) {
      return NextResponse.json({ error: "Message exceeds 4,000 character limit." }, { status: 400 });
    }

    const lang = body.lang || "en";
    let activeSessionId = body.sessionId;

    // Validate or create session
    if (activeSessionId) {
      const existingSession = await db.governanceChatSession.findUnique({
        where: { id: activeSessionId },
      });
      if (!existingSession) {
        return NextResponse.json({ error: "Specified chat session does not exist." }, { status: 404 });
      }
      if (existingSession.orgId !== user.orgId || (existingSession.userId !== user.id && user.role !== "admin")) {
        return NextResponse.json({ error: "Access denied to chat session." }, { status: 403 });
      }
    } else {
      const generatedTitle =
        message.length > 40 ? `${message.slice(0, 40).trim()}...` : message;
      const newSession = await db.governanceChatSession.create({
        data: {
          orgId: user.orgId,
          userId: user.id,
          title: generatedTitle,
        },
      });
      activeSessionId = newSession.id;
    }

    // 1. Hybrid semantic RAG retrieval across organization knowledge chunks
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

    // 3. Fetch past conversation history
    let conversationHistory: { role: "user" | "assistant"; content: string }[] = [];
    const pastMessages = await db.governanceChatMessage.findMany({
      where: { sessionId: activeSessionId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { role: true, content: true },
    });
    conversationHistory = pastMessages.reverse().map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // 4. Resolve multi-provider AI credentials (prioritizing Google Gemini)
    let apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
    let baseUrl = process.env.GEMINI_API_KEY?.trim()
      ? "https://generativelanguage.googleapis.com/v1beta/openai"
      : process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";
    let model = process.env.GEMINI_API_KEY?.trim()
      ? process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash"
      : process.env.CHAT_MODEL?.trim() || "gpt-4o-mini";

    let reply = "";
    let citations: CitationMeta[] = [];
    let aiProvider = "deterministic_synthesis";

    const systemPrompt = `You are BrandShield AI, the enterprise brand governance and compliance copilot.
User Role: ${user.role} (${user.name})
Organization: ${user.orgId}
Language Preference: ${lang === "hi" ? "Hindi (हिंदी)" : "English"}

CORE RESPONSIBILITIES:
1. Provide authoritative, friendly-expert advice on brand guidelines, banned phrases, trademark usage (®/™), and WCAG 2.1 AA/AAA accessibility.
2. Ground all answers in the provided organization guidelines passages below.
3. If an answer is derived from the retrieved guideline documents, cite the document title, page number, and rule tag (e.g., "[Doc Title, p. 2, CLAIM-01]").
4. Never invent or hallucinate brand rules, guidelines, or citations not present in the reference passages.
5. For color contrast questions, compute or verify the WCAG contrast ratio (AA requires >= 4.5:1 for normal text, AAA requires >= 7.0:1).
6. Be concise, actionable, and formatted in clear GitHub Flavored Markdown.

APPROVED BRAND TOKENS:
${tokens.map((t) => `- ${t.name} (${t.tokenType}): ${t.value}${t.secondary ? ` (on ${t.secondary})` : ""}`).join("\n") || "No custom tokens defined yet."}

RETRIEVED GUIDELINE KNOWLEDGE PASSAGES:
${
  passages.length > 0
    ? passages
        .map(
          (p, i) =>
            `[Passage ${i + 1}] Document: "${p.documentTitle}", Page: ${p.pageNumber}${p.ruleTag ? `, Rule: "${p.ruleTag}"` : ""}\n${p.text}`
        )
        .join("\n\n")
    : "No relevant guideline documents found for this query."
}`;

    if (apiKey) {
      try {
        const messagesPayload = [
          { role: "system", content: systemPrompt },
          ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: message },
        ];

        const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: messagesPayload,
            temperature: 0.2,
            max_tokens: 1200,
          }),
          signal: AbortSignal.timeout(6000),
        });

        if (aiResponse.ok) {
          const aiData = (await aiResponse.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const content = aiData.choices?.[0]?.message?.content?.trim();
          if (content) {
            reply = content;
            aiProvider = process.env.GEMINI_API_KEY?.trim() ? "gemini" : "openai";
            citations = passages.slice(0, 4).map((p) => ({
              documentTitle: p.documentTitle,
              pageNumber: p.pageNumber,
              ruleTag: p.ruleTag,
              textSnippet: p.text.slice(0, 240).trim(),
            }));
          }
        } else if (baseUrl.includes("generativelanguage.googleapis.com")) {
          // Fallback to native Gemini generateContent endpoint
          try {
            const nativeContents = [
              ...conversationHistory.map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
              })),
              { role: "user", parts: [{ text: message }] },
            ];
            const nativeRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  systemInstruction: { parts: [{ text: systemPrompt }] },
                  contents: nativeContents,
                  generationConfig: { temperature: 0.2 },
                }),
                signal: AbortSignal.timeout(6000),
              }
            );
            if (nativeRes.ok) {
              const nativeData = (await nativeRes.json()) as {
                candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
              };
              const nativeContent = nativeData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
              if (nativeContent) {
                reply = nativeContent;
                aiProvider = "gemini";
                citations = passages.slice(0, 4).map((p) => ({
                  documentTitle: p.documentTitle,
                  pageNumber: p.pageNumber,
                  ruleTag: p.ruleTag,
                  textSnippet: p.text.slice(0, 240).trim(),
                }));
              }
            }
          } catch {
            // ignore and proceed to deterministic synthesis
          }
        } else {
          console.warn(`[ChatAPI] External AI provider error (${aiResponse.status}). Falling back to deterministic synthesis.`);
        }
      } catch (err) {
        console.warn("[ChatAPI] External AI call timed out or failed:", err);
      }
    }

    // Deterministic fallback if external provider failed or returned empty
    if (!reply) {
      const syn = synthesizeGovernanceResponse(message, passages, tokens, user.role, lang);
      reply = syn.reply;
      citations = syn.citations;
      aiProvider = "deterministic_fallback";
    }

    // Persist conversation to database
    await db.governanceChatMessage.create({
      data: {
        sessionId: activeSessionId,
        orgId: user.orgId,
        role: "user",
        content: message,
      },
    });

    const assistantMsg = await db.governanceChatMessage.create({
      data: {
        sessionId: activeSessionId,
        orgId: user.orgId,
        role: "assistant",
        content: reply,
        citations: JSON.stringify(citations),
      },
    });

    await db.governanceChatSession.update({
      where: { id: activeSessionId },
      data: { updatedAt: new Date() },
    });

    const hasVector = passages.some((p) => p.matchType === "vector" || p.matchType === "hybrid");

    return NextResponse.json({
      sessionId: activeSessionId,
      messageId: assistantMsg.id,
      reply,
      citations,
      searchMode: hasVector ? "hybrid_vector" : "lexical_fallback",
      vectorActive: hasVector,
      provider: aiProvider,
    });
  } catch (e) {
    return jsonError(e);
  }
}

// ─── DELETE /api/chat: Delete Chat Session ─────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
    }

    const session = await db.governanceChatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Chat session not found." }, { status: 404 });
    }

    if (session.orgId !== user.orgId || (session.userId !== user.id && user.role !== "admin")) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    await db.governanceChatSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true, message: "Chat session deleted successfully." });
  } catch (e) {
    return jsonError(e);
  }
}

// ─── PATCH /api/chat: Rename Chat Session ──────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      sessionId?: string;
      title?: string;
    };

    if (!body.sessionId || !body.title?.trim()) {
      return NextResponse.json({ error: "sessionId and title are required." }, { status: 400 });
    }

    const session = await db.governanceChatSession.findUnique({
      where: { id: body.sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Chat session not found." }, { status: 404 });
    }

    if (session.orgId !== user.orgId || (session.userId !== user.id && user.role !== "admin")) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const updated = await db.governanceChatSession.update({
      where: { id: body.sessionId },
      data: { title: body.title.trim().slice(0, 100) },
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (e) {
    return jsonError(e);
  }
}
