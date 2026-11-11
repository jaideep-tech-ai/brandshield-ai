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

  // 2. Navigation / "How do I" assistance
  if (cleanQ.includes("how do i") || cleanQ.includes("how to") || cleanQ.includes("kaise") || cleanQ.includes("कैसे")) {
    if (cleanQ.includes("upload") || cleanQ.includes("image") || cleanQ.includes("banner") || cleanQ.includes("अपलोड")) {
      const reply = isHindi
        ? `### ब्रांडशील्ड AI में चित्र या बैनर अपलोड करने के चरण:

1. शीर्ष नेविगेशन में **Pre-Flight Scanner** (या **Findings**) पेज पर जाएँ।
2. **Upload Creative Banner** बटन पर क्लिक करें या समर्थित फ़ाइल (PNG, JPG, WEBP, SVG - अधिकतम 5MB) ड्रैग और ड्रॉप करें।
3. अपलोड होते ही डिटरमिनिस्टिक नियम और मल्टीमॉडल विज़न इंजन स्वचालित रूप से रंग पैलेट और कंट्रास्ट की जाँच करते हैं।
4. यदि कोई फ़ाइंडिंग मिलती है, तो आप **Upload Fixed Image** बटन से सुधारा हुआ बैनर सीधे अपडेट कर सकते हैं।`
        : `### Step-by-Step: Uploading an Image or Creative Banner:

1. Navigate to the **Pre-Flight Scanner** (or **Findings**) view from the navigation menu.
2. Click **Upload Creative Banner** or drag-and-drop a supported image file (PNG, JPG, WEBP, SVG - max 5MB).
3. The automated engine immediately extracts dominant colors, calculates WCAG 2.1 contrast ratios, and inspects logo marks.
4. If contrast or color issues arise, use the **Upload Fixed Image** button directly in the Findings view to replace it.`;
      return { reply, citations };
    }

    if (cleanQ.includes("gitlab") || cleanQ.includes("git") || cleanQ.includes("गिटलैब")) {
      const reply = isHindi
        ? `### GitLab एकीकरण कनेक्ट करने के चरण:

1. बाएँ मेनू से **Integrations & Extensions** पर जाएँ।
2. **GitLab Self-Service Onboarding** कार्ड ढूंढें और **Connect GitLab** पर क्लिक करें।
3. GitLab पर ऑथराइज़ करें (सुरक्षित OAuth और एंटी-CSRF नॉनस सत्यापन)।
4. अपनी रिपॉज़िटरी चुनें — ब्रांडशील्ड AI स्वचालित रूप से वेबहुक को पुश और मर्ज अनुरोधों हेतु कॉन्फ़िगर कर देगा।`
        : `### Step-by-Step: Connecting GitLab Integration:

1. Open **Integrations & Extensions** from the navigation.
2. Locate the **GitLab Self-Service Customer Onboarding** card and click **Connect GitLab**.
3. Authorize via GitLab OAuth (protected by server-side anti-CSRF nonce validation).
4. Select your target project from the accessible repositories list.
5. The system automatically provisions the webhook with a cryptographically unique secret.`;
      return { reply, citations };
    }

    if (cleanQ.includes("approve") || cleanQ.includes("approval") || cleanQ.includes("अनुमोदन")) {
      const reply = isHindi
        ? `### संपत्ति अनुमोदन प्रक्रिया:

1. **क्रिएटर के लिए**: सभी गंभीर (Critical) फ़ाइंडिंग्स को हल करें या औचित्य दें, फिर **Submit for Review** पर क्लिक करें।
2. **समीक्षक/एडमिन के लिए**: **Approval Board** पर जाएँ, वर्ज़न 1 और वर्ज़न 2 की साइड-बाय-साइड तुलना करें, और **Approve** या **Request Changes** चुनें।
3. प्रत्येक अनुमोदन SHA-256 अपरिवर्तनीय ऑडिट शृंखला में दर्ज होता है।`
        : `### Step-by-Step: Asset Approval Workflow:

1. **For Creators**: Resolve all critical findings or record justified overrides in the **Findings** view, then click **Submit for Review**.
2. **For Reviewers & Admins**: Open the **Approval Board**, review side-by-side text and banner diffs, then click **Approve Release** or **Request Changes**.
3. Every decision is cryptographically chained into the immutable SHA-256 audit trail.`;
      return { reply, citations };
    }
  }

  // 3. Logo / Trademark inquiry
  if (cleanQ.includes("logo") || cleanQ.includes("trademark") || cleanQ.includes("glyph") || cleanQ.includes("ट्रेडमार्क")) {
    const reply = isHindi
      ? `### ब्रांड ट्रेडमार्क और लोगो शासन नियम

सत्यापित ब्रांड नीति रिपॉज़िटरी के अनुसार:

1. **पंजीकृत ट्रेडमार्क का उपयोग**:
   - मास्टर ब्रांड नाम **NimbusPay** हमेशा एकल camelCase शब्द के रूप में लिखा जाना चाहिए (कभी "Nimbus Pay" या "NIMBUSPAY" नहीं)।
   - प्राथमिक ट्रेडमार्क ग्लिफ़ **®** चलने वाली कॉपी में पहले प्रमुख उपयोग पर जुड़ा होना चाहिए [RULE TM-01]।
2. **स्पष्ट स्थान और प्लेसमेंट**:
   - शील्ड लोगो मार्क के चारों ओर न्यूनतम स्पष्ट स्थान कम से कम आधे लोगो मार्क की ऊंचाई के बराबर होना चाहिए।
   - लोगो को कभी भी अप्रूव्ड या कम-कंट्रास्ट वाले बैकग्राउंड पर न रखें।
3. **उत्पाद उप-ब्रांड**:
   - **PayLinks™**, **SmartRetries™**, और **CheckoutOS™** जैसे नामों में पहले उपयोग पर **™** चिह्न होना चाहिए [RULE TM-03]।`
      : `### Brand Trademark & Logo Governance Rules

Based on the indexed Brand Policy & Legal repository:

1. **Registered Trademark Usage**:
   - The master brand name **NimbusPay** must always be written as a single camelCase word (never "Nimbus Pay" or "NIMBUSPAY").
   - The primary trademark glyph **®** must be attached to the first prominent occurrence in running copy [RULE TM-01].
2. **Clear Space & Placement**:
   - Minimum clear space surrounding the shield mark must equal at least half of the logo mark height.
   - Never place the logo mark against unapproved or low-contrast backgrounds.
3. **Product Sub-Brands**:
   - Names like **PayLinks™**, **SmartRetries™**, and **CheckoutOS™** must carry the **™** mark on first occurrence [RULE TM-03].`;

    return { reply, citations };
  }

  // 4. Default synthesized response using passages and tokens
  const tokenSummary = tokens.map((t) => `- **${t.name}** (\`${t.value}\`): ${t.usageNotes || t.tokenType}`).join("\n");
  const passageSummary = passages
    .slice(0, 3)
    .map((p) => `- **${p.documentTitle}** (Page ${p.pageNumber}${p.ruleTag ? ` · \`${p.ruleTag}\`` : ""}): "${p.text.slice(0, 200).trim()}..."`)
    .join("\n");

  const reply = isHindi
    ? `### ब्रांड शासन विश्लेषण (${userRole.toUpperCase()} संदर्भ)

आपकी क्वेरी के आधार पर ब्रांड दिशानिर्देशों और नीति रिपॉज़िटरी से निकाला गया सत्यापन:

${passageSummary ? `#### संबंधित दिशानिर्देश उद्धरण:\n${passageSummary}\n` : ""}
${tokenSummary ? `#### अधिकृत ब्रांड टोकन:\n${tokenSummary}\n` : ""}

**सिफारिश**: सामग्री को प्रकाशित करने से पहले प्री-फ़्लाइट स्कैनर में चलाएँ ताकि यह सुनिश्चित हो सके कि कोई अप्रमाणित दावा या ट्रेडमार्क उल्लंघन मौजूद नहीं है।`
    : `### Brand Governance Guidance (${userRole.toUpperCase()} Context)

Based on your query and the verified brand guidelines repository:

${passageSummary ? `#### Associated Policy Citations:\n${passageSummary}\n` : ""}
${tokenSummary ? `#### Approved Visual Tokens:\n${tokenSummary}\n` : ""}

**Governance Summary**: Ensure all promotional claims trace to approved product datasheets (e.g. FACT PD-09) and that color combinations strictly adhere to WCAG 2.1 AA thresholds before submitting for formal reviewer approval.`;

  return { reply, citations };
}

// ─── POST /api/copilot/chat ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json()) as {
      message?: string;
      sessionId?: string;
      lang?: string;
      stream?: boolean;
    };

    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }

    const lang = body.lang || "en";

    // 1. Hybrid semantic RAG search across organization knowledge chunks
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

    // 3. Fetch past conversation history if sessionId is provided
    let conversationHistory: { role: "user" | "assistant"; content: string }[] = [];
    if (body.sessionId) {
      const pastMessages = await db.governanceChatMessage.findMany({
        where: { sessionId: body.sessionId },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { role: true, content: true },
      });
      conversationHistory = pastMessages.reverse().map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
    }

    // 4. Resolve multi-provider AI credentials (prioritizing Google Gemini)
    let apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
    let baseUrl = process.env.GEMINI_API_KEY?.trim()
      ? "https://generativelanguage.googleapis.com/v1beta/openai"
      : process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";
    let model = process.env.GEMINI_API_KEY?.trim()
      ? process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest"
      : process.env.CHAT_MODEL?.trim() || "gpt-4o-mini";

    if (!apiKey && process.env.GROQ_API_KEY?.trim()) {
      apiKey = process.env.GROQ_API_KEY.trim();
      baseUrl = "https://api.groq.com/openai/v1";
      model = "llama-3.3-70b-versatile";
    } else if (!apiKey && process.env.ZAI_API_KEY?.trim()) {
      apiKey = process.env.ZAI_API_KEY.trim();
      baseUrl = process.env.ZAI_BASE_URL?.trim() || "https://api.openai.com/v1";
    }

    let finalReply = "";
    let finalCitations: CitationMeta[] = [];

    // Role-specific guidance injection
    const roleInstructions: Record<string, string> = {
      admin: "You are speaking with the Brand Director / Super Admin. Focus on organization-wide governance, compliance health, integration status, and team management.",
      reviewer: "You are speaking with a Compliance Officer. Focus on policy violations, WCAG standards, findings analysis, evidence verification, and defensible sign-offs.",
      creator: "You are speaking with a Content Creator. Focus on creative asset improvements, brand voice & tone, one-click rewrites, and draft submissions.",
      contractor: "You are speaking with an Agency Contractor / Auditor in the Client Sandbox. Focus on read-only policy clarifications, pre-check guidance, and compliance verification.",
    };

    if (apiKey) {
      try {
        const systemPrompt = `You are BrandShield AI Copilot, an enterprise brand governance, legal compliance, and WCAG accessibility assistant.
Target User: ${user.name} (Role: ${user.role}, Organization: ${user.orgName}).
${roleInstructions[user.role] || roleInstructions.creator}

VERIFIED BRAND TOKENS:
${tokens.map((t) => `- ${t.name} (${t.tokenType}): ${t.value}`).join("\n")}

INDEXED GUIDELINE PASSAGES:
${passages.map((p) => `[Doc: ${p.documentTitle}, Page: ${p.pageNumber}, Rule: ${p.ruleTag || "N/A"}]:\n${p.text}`).join("\n\n")}

CRITICAL INSTRUCTIONS:
- Cite exact source documents, page numbers, and rule tags (e.g. [RULE CLAIM-01: Page 1]).
- If discussing colors, verify contrast against WCAG 2.1 AA (4.5:1 for normal text) and AAA (7.0:1).
- Provide clear numbered steps and identify the specific application page when asked how to perform actions.
- Never claim an action is completed unless the user performs it in the application.
- Never expose internal API keys, tokens, or other organizations' data.
- Respond in ${lang === "hi" ? "Hindi (Devanagari)" : "English"} naturally unless requested otherwise.`;

        const messagesPayload = [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: message },
        ];

        const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: messagesPayload,
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const completion = (await res.json()) as {
            choices: { message: { content: string } }[];
          };
          finalReply = completion.choices?.[0]?.message?.content || "";
        } else if (baseUrl.includes("generativelanguage.googleapis.com")) {
          // Robust fallback to native Gemini generateContent endpoint
          try {
            const nativeRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    {
                      role: "user",
                      parts: [
                        {
                          text: `${systemPrompt}\n\nUser Question:\n${message}`,
                        },
                      ],
                    },
                  ],
                  generationConfig: { temperature: 0.2 },
                }),
              }
            );
            if (nativeRes.ok) {
              const nativeData = (await nativeRes.json()) as {
                candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
              };
              finalReply = nativeData.candidates?.[0]?.content?.parts?.[0]?.text || "";
            } else {
              console.warn("[Copilot API] Native Gemini returned status:", nativeRes.status);
            }
          } catch (nativeErr) {
            console.warn("[Copilot API] Native Gemini fallback error:", nativeErr);
          }
        } else {
          console.warn("[Copilot API] External LLM returned status:", res.status);
        }

        if (finalReply) {
          finalCitations = passages.slice(0, 4).map((p) => ({
            documentTitle: p.documentTitle,
            pageNumber: p.pageNumber,
            ruleTag: p.ruleTag,
            textSnippet: p.text.slice(0, 240).trim(),
          }));
        }
      } catch (err) {
        console.warn("[Copilot API] External LLM call error, using deterministic synthesis:", err);
      }
    }

    if (!finalReply) {
      const synthesized = synthesizeGovernanceResponse(message, passages, tokens, user.role, lang);
      finalReply = synthesized.reply;
      finalCitations = synthesized.citations;
    }

    // 5. Persist to GovernanceChatSession and GovernanceChatMessage
    let sessionId = body.sessionId;
    if (sessionId) {
      const existing = await db.governanceChatSession.findUnique({ where: { id: sessionId } });
      if (!existing) {
        await db.governanceChatSession.create({
          data: {
            id: sessionId,
            orgId: user.orgId,
            userId: user.id,
            title: message.slice(0, 38) + (message.length > 38 ? "..." : ""),
          },
        });
      }
    } else {
      const titleSummary = message.slice(0, 38) + (message.length > 38 ? "..." : "");
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

    // Record assistant message
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

// ─── GET /api/copilot/chat?sessionId=... ─────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      const sessions = await db.governanceChatSession.findMany({
        where: { orgId: user.orgId, userId: user.id },
        orderBy: { updatedAt: "desc" },
        take: 20,
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

// ─── DELETE /api/copilot/chat?sessionId=... ──────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId parameter" }, { status: 400 });
    }

    const session = await db.governanceChatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.orgId !== user.orgId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Cascade deletes linked messages
    await db.governanceChatMessage.deleteMany({ where: { sessionId } });
    await db.governanceChatSession.delete({ where: { id: sessionId } });

    return NextResponse.json({ ok: true, deleted: sessionId });
  } catch (e) {
    return jsonError(e);
  }
}

// ─── PATCH /api/copilot/chat ─────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { sessionId, title } = (await req.json().catch(() => ({}))) as {
      sessionId?: string;
      title?: string;
    };

    if (!sessionId || !title?.trim()) {
      return NextResponse.json({ error: "Missing sessionId or title" }, { status: 400 });
    }

    const session = await db.governanceChatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.orgId !== user.orgId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const updated = await db.governanceChatSession.update({
      where: { id: sessionId },
      data: { title: title.trim() },
    });

    return NextResponse.json({ ok: true, session: updated });
  } catch (e) {
    return jsonError(e);
  }
}
