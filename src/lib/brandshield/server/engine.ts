import { createHash } from "crypto";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import type { Finding, StageAResult, StageBResult } from "../types";
import { contrastRatio, isNeutralColor, colorDistance, readableOn } from "../shared";

// ─── Text utilities ──────────────────────────────────────────────────────────

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s®™%$.]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

const STOP_WORDS = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "is", "are", "was", "be", "by", "at", "as", "it", "this", "that", "our", "we", "you", "your"]);

// ─── Stage 1 Ingestion: chunking + keyword indexing ──────────────────────────

export interface ChunkOut {
  chunkIndex: number;
  text: string;
  ruleTag: string | null;
  keywords: string;
}

export function chunkDocument(content: string, targetSize = 480): ChunkOut[] {
  const lines = content.split("\n");
  const chunks: ChunkOut[] = [];
  let buffer: string[] = [];
  let ruleTag: string | null = null;
  let size = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    const text = buffer.join("\n").trim();
    if (text.length > 0) {
      chunks.push({
        chunkIndex: chunks.length,
        text,
        ruleTag,
        keywords: tokenize(text).join(" "),
      });
    }
    buffer = [];
    size = 0;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    // Detect explicit rule tags like "RULE CLAIM-01:" or "VOICE-02 —" or "TM-1."
    const tagMatch = trimmed.match(/^(?:RULE\s+)?([A-Z]{2,6}-\d{1,3})\b/);
    if (tagMatch) ruleTag = tagMatch[1];
    if (/^#{1,3}\s/.test(trimmed) || /^([A-Z][A-Z\s&/-]{4,})$/.test(trimmed)) {
      // heading → start a new chunk
      flush();
      const headingTag = tagMatch?.[1] ?? ruleTag;
      buffer = [trimmed];
      ruleTag = headingTag;
      size = trimmed.length;
      continue;
    }
    if (size + trimmed.length > targetSize) flush();
    buffer.push(trimmed);
    size += trimmed.length + 1;
  }
  flush();
  return chunks;
}

// ─── Stage A: Deterministic Pre-Filter (<100ms) ──────────────────────────────

const CLAIM_PATTERNS = [
  /\b\d+(?:\.\d+)?\s?x\b/i, // 10x
  /\b\d+(?:\.\d+)?\s?%/,
  /\b\d+(?:\.\d+)?\s?(?:ROI|users|merchants|countries|currencies|languages|business days|hours|minutes|seconds|days)\b/i,
  /\b(?:guarantee|guaranteed|guarantees|guaranteeing)\b/i,
  /\b(?:doubles?|triples?|halves?)\b/i,
  /\b(?:up to|as much as|over|more than|at least|only)\s+\d/i,
  /\b(?:fastest|best|cheapest|first|number one|#1|leading)\b/i,
  /\b\d{4}\b/, // years / dates
];

const HEX_PATTERN = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;

export interface DeterministicInput {
  bannedTerms: string[];
  trademarks: { brand: string; glyph: string }[];
}

export function runDeterministicStage(content: string, input: DeterministicInput): StageAResult {
  const t0 = performance.now();
  const bannedTerms: StageAResult["bannedTerms"] = [];
  const trademarkIssues: StageAResult["trademarkIssues"] = [];
  const styleIssues: StageAResult["styleIssues"] = [];

  // 1. Banned term match (word-boundary regex, case-insensitive)
  const c0 = performance.now();
  for (const term of input.bannedTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      bannedTerms.push({
        term,
        index: m.index,
        excerpt: content.slice(Math.max(0, m.index - 30), m.index + term.length + 30).trim(),
      });
      if (bannedTerms.length >= 20) break;
    }
    if (bannedTerms.length >= 20) break;
  }
  const bannedMs = performance.now() - c0;

  // 2. Trademark glyph validation
  const t1 = performance.now();
  for (const { brand, glyph } of input.trademarks) {
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // find occurrences of the brand WITHOUT the required glyph right after
    const re = new RegExp(`${escaped}(?!\\s?${glyph === "®" ? "®" : "™"})`, "gi");
    let m: RegExpExecArray | null;
    let flagged = 0;
    while ((m = re.exec(content)) !== null) {
      // skip if part of a longer word
      const before = content[m.index - 1];
      const after = content[m.index + brand.length];
      if (before && /\w/.test(before)) continue;
      if (after && /\w/.test(after)) continue;
      trademarkIssues.push({
        brand,
        expectedGlyph: glyph,
        index: m.index,
        excerpt: content.slice(Math.max(0, m.index - 25), m.index + brand.length + 25).trim(),
      });
      if (++flagged >= 4) break;
    }
  }
  const tmMs = performance.now() - t1;

  // 3. Claim candidate extraction (for RAG stage)
  const t2 = performance.now();
  const sentences = content.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 8);
  const claimCandidates: string[] = [];
  for (const s of sentences) {
    if (CLAIM_PATTERNS.some((p) => p.test(s)) && !claimCandidates.includes(s)) {
      claimCandidates.push(s);
    }
  }
  const claimMs = performance.now() - t2;

  // 4. Hex code discovery
  const t3 = performance.now();
  const hexCodesFound = [...new Set((content.match(HEX_PATTERN) ?? []).map((h) => h.toUpperCase()))];
  const hexMs = performance.now() - t3;

  // 5. Style mechanics
  const t4 = performance.now();
  const exclamations = content.match(/!{2,}/g);
  if (exclamations) {
    styleIssues.push({ type: "excessive-punctuation", excerpt: exclamations[0], detail: "Repeated exclamation marks read as hype; brand voice prefers confident, measured statements." });
  }
  const allCaps = content.match(/\b[A-Z]{4,}\b/g);
  if (allCaps && allCaps.length >= 2) {
    styleIssues.push({ type: "all-caps", excerpt: [...new Set(allCaps)].slice(0, 3).join(", "), detail: "All-caps shouting conflicts with the friendly-expert voice. Use bold or emphasis instead." });
  }
  const doubleSpaces = content.match(/\S {2,}\S/g);
  if (doubleSpaces && doubleSpaces.length) {
    styleIssues.push({ type: "double-space", excerpt: doubleSpaces[0], detail: "Double spaces detected between words." });
  }
  const styleMs = performance.now() - t4;

  const checks = [
    { name: "Banned terms", passed: bannedTerms.length === 0, count: bannedTerms.length, ms: +bannedMs.toFixed(2) },
    { name: "Trademark glyphs", passed: trademarkIssues.length === 0, count: trademarkIssues.length, ms: +tmMs.toFixed(2) },
    { name: "Claim candidates", passed: true, count: claimCandidates.length, ms: +claimMs.toFixed(2) },
    { name: "Hex discovery", passed: true, count: hexCodesFound.length, ms: +hexMs.toFixed(2) },
    { name: "Style mechanics", passed: styleIssues.length === 0, count: styleIssues.length, ms: +styleMs.toFixed(2) },
  ];

  return {
    durationMs: +(performance.now() - t0).toFixed(1),
    bannedTerms,
    trademarkIssues,
    claimCandidates,
    hexCodesFound,
    styleIssues,
    checks,
  };
}

// ─── Sparse lexical retrieval (BM25-lite) ────────────────────────────────────

interface ChunkRow {
  id: string;
  text: string;
  ruleTag: string | null;
  keywords: string;
  document: { title: string; docType: string };
}

export function retrieveChunks(query: string, chunks: ChunkRow[], k = 3): ChunkRow[] {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];
  const df = new Map<string, number>();
  for (const token of new Set(qTokens)) {
    let count = 0;
    for (const c of chunks) if (c.keywords.includes(token)) count++;
    df.set(token, count);
  }
  const scored = chunks.map((c) => {
    const cTokens = c.keywords.split(" ");
    const tf = new Map<string, number>();
    for (const t of cTokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const qt of qTokens) {
      const f = tf.get(qt) ?? 0;
      if (f === 0) continue;
      const idf = Math.log(1 + chunks.length / (1 + (df.get(qt) ?? 0)));
      score += idf * (f / (f + 1.2));
    }
    return { chunk: c, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.chunk);
}

// ─── LLM helpers (strict structured output with graceful fallback) ───────────

async function getZAI() {
  return ZAI.create();
}

function extractJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const start = Math.min(...["[", "{"].map((c) => { const i = raw.indexOf(c); return i === -1 ? Infinity : i; }));
    if (start === Infinity) return null;
    const end = Math.max(raw.lastIndexOf("]"), raw.lastIndexOf("}"));
    if (end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1)) as T;
    } catch {
      return null;
    }
  }
}

export interface ClaimVerdict {
  claim: string;
  verdict: "SUPPORTED" | "UNSUPPORTED" | "UNVERIFIABLE";
  citation: string;
  sourceDoc: string;
  rationale: string;
  suggestion: string;
}

export async function aiVerifyClaims(
  claims: string[],
  chunks: ChunkRow[],
  orgName: string
): Promise<ClaimVerdict[]> {
  if (claims.length === 0) return [];
  // Reciprocal-rank-fusion-ish: retrieve per claim, merge context
  const contextMap = new Map<string, { text: string; doc: string; tag: string | null; rank: number }>();
  claims.forEach((claim, ci) => {
    const hits = retrieveChunks(claim, chunks, 3);
    hits.forEach((h, ri) => {
      const key = h.id;
      const rrf = 1 / (60 + ci * 0 + ri + 1);
      const prev = contextMap.get(key);
      if (prev) prev.rank += rrf;
      else contextMap.set(key, { text: h.text, doc: h.document.title, tag: h.ruleTag, rank: rrf });
    });
  });
  const context = [...contextMap.values()]
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 10)
    .map((c, i) => `[${i + 1}] (${c.doc}${c.tag ? ` · rule ${c.tag}` : ""})\n${c.text}`)
    .join("\n\n");

  const system = `You are BrandShield's claim-verification engine for ${orgName}. You cross-reference marketing claims against VERIFIED corporate facts. Be strict: marketing hype that adds unverified numbers, superlatives, or guarantees is UNSUPPORTED unless a fact explicitly backs it. Respond with ONLY a valid JSON array, no markdown fences.`;

  const user = `VERIFIED FACTS (from approved knowledge base):
${context || "(no matching facts found in the knowledge base)"}

CLAIMS TO VERIFY:
${claims.map((c, i) => `${i + 1}. ${c}`).join("\n")}

For EACH claim return an object in this exact JSON schema:
{"claim":"<verbatim claim>","verdict":"SUPPORTED"|"UNSUPPORTED"|"UNVERIFIABLE","citation":"<verbatim quote from facts, or empty string>","sourceDoc":"<document name from the facts, or 'Not found'>","rationale":"<plain-language rationale, max 40 words>","suggestion":"<if UNSUPPORTED: a compliant rewrite preserving the creator's intent and energy; else empty string>"}

Return the JSON array only.`;

  try {
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: system },
        { role: "user", content: user },
      ],
      thinking: { type: "disabled" },
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = extractJson<ClaimVerdict[]>(raw);
    if (Array.isArray(parsed)) {
      return claims.map((claim, i) => {
        const match = parsed.find((p) => p && typeof p.claim === "string" && (p.claim === claim || p.claim.includes(claim.slice(0, 40)) || claim.includes(p.claim)));
        return (
          match ?? {
            claim,
            verdict: "UNVERIFIABLE" as const,
            citation: "",
            sourceDoc: "Not found",
            rationale: "The verifier could not produce a grounded verdict for this claim.",
            suggestion: "",
          }
        );
      });
    }
  } catch (e) {
    console.error("aiVerifyClaims failed:", e);
  }
  // Graceful degradation: heuristic fallback so the pipeline never hard-fails
  return claims.map((claim) => ({
    claim,
    verdict: "UNVERIFIABLE" as const,
    citation: "",
    sourceDoc: "Not found",
    rationale: "Automated verification was unavailable; route to manual review.",
    suggestion: "",
  }));
}

export interface ToneResult {
  score: number;
  voiceSummary: string;
  driftFlags: { phrase: string; reason: string; suggestion: string }[];
}

export async function aiToneAnalysis(content: string, voiceChunks: ChunkRow[]): Promise<ToneResult> {
  const voice = voiceChunks.slice(0, 6).map((c) => c.text).join("\n");
  const system = `You are BrandShield's voice-coherence analyst. Score how well the text matches the brand voice, and flag drift. Respond with ONLY valid JSON, no markdown fences.`;
  const user = `BRAND VOICE GUIDELINES:
${voice || "Friendly-expert, confident but not hypey, plain language, no slang, no legalese."}

TEXT TO ANALYZE:
"""
${content.slice(0, 4000)}
"""

Return this exact JSON schema:
{"score":<integer 0-100>,"voiceSummary":"<one sentence assessment>","driftFlags":[{"phrase":"<verbatim phrase>","reason":"<why it drifts from the voice, max 25 words>","suggestion":"<tone-preserving rewrite>"}]}

Include at most 3 driftFlags (empty array if the voice is on-brand).`;

  try {
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: system },
        { role: "user", content: user },
      ],
      thinking: { type: "disabled" },
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = extractJson<ToneResult>(raw);
    if (parsed && typeof parsed.score === "number" && Array.isArray(parsed.driftFlags)) {
      return {
        score: Math.max(0, Math.min(100, Math.round(parsed.score))),
        voiceSummary: String(parsed.voiceSummary ?? "Tone assessed."),
        driftFlags: parsed.driftFlags.slice(0, 3).map((f) => ({
          phrase: String(f.phrase ?? ""),
          reason: String(f.reason ?? ""),
          suggestion: String(f.suggestion ?? ""),
        })),
      };
    }
  } catch (e) {
    console.error("aiToneAnalysis failed:", e);
  }
  return {
    score: 78,
    voiceSummary: "Tone analysis was unavailable; a neutral placeholder score was applied.",
    driftFlags: [],
  };
}

// ─── Vision inspection (VLM + deterministic WCAG math) ───────────────────────

export interface VisionResult {
  dominantColors: string[];
  offBrandColors: string[];
  contrastIssues: { foreground: string; background: string; ratio: number; requirement: string }[];
  logoPresent: boolean | null;
  ocrText: string;
  summary: string;
}

export async function visionInspect(
  imageData: string,
  clientPalette: string[],
  approvedColors: { hex: string; name: string }[],
  logoName: string | null
): Promise<VisionResult> {
  const issues: VisionResult["contrastIssues"] = [];
  const offBrand: string[] = [];
  const dominant = clientPalette.slice(0, 8);

  // Deterministic WCAG math on extracted palette
  if (clientPalette.length >= 2) {
    const background = clientPalette[0];
    for (const fg of clientPalette.slice(1, 6)) {
      const ratio = contrastRatio(fg, background);
      if (ratio < 4.5) {
        issues.push({
          foreground: fg,
          background,
          ratio: +ratio.toFixed(2),
          requirement: "WCAG 2.1 AA requires ≥ 4.5:1 for normal text",
        });
      }
    }
  }
  for (const hex of dominant) {
    if (approvedColors.length && !isNeutralColor(hex)) {
      const nearest = approvedColors
        .map((a) => ({ a, d: colorDistance(hex, a.hex) }))
        .sort((x, y) => x.d - y.d)[0];
      if (nearest && nearest.d > 90) offBrand.push(hex);
    }
  }
  // Suggest nearest approved hex for each off-brand color
  const suggestionsMap = new Map(offBrand.map((hex) => {
    const nearest = approvedColors
      .map((a) => ({ a, d: colorDistance(hex, a.hex) }))
      .sort((x, y) => x.d - y.d)[0];
    return [hex, nearest?.a.hex ?? readableOn(hex)];
  }));
  void suggestionsMap;

  let logoPresent: boolean | null = null;
  let ocrText = "";
  let summary = "Deterministic palette + WCAG contrast analysis completed.";

  // VLM pass for OCR + logo presence (best-effort)
  try {
    const zai = await getZAI();
    const visionBody = {
      messages: [
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: `You are BrandShield's visual brand inspector. Approved brand colors: ${approvedColors.map((c) => `${c.name} ${c.hex}`).join(", ") || "none registered"}. ${logoName ? `The official logo is the "${logoName}" mark.` : ""} Analyze this promotional banner and respond with ONLY valid JSON: {"ocrText":"<all visible text>","logoPresent":true|false|null,"summary":"<2 sentence visual compliance summary, mention color deviations, readability, and logo if determinable>"}`,
            },
            { type: "image_url" as const, image_url: { url: imageData } },
          ],
        },
      ],
      thinking: { type: "disabled" as const },
    };
    const completion = await zai.chat.completions.createVision(visionBody as Parameters<typeof zai.chat.completions.createVision>[0]);
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = extractJson<{ ocrText?: string; logoPresent?: boolean | null; summary?: string }>(raw);
    if (parsed) {
      ocrText = String(parsed.ocrText ?? "");
      logoPresent = typeof parsed.logoPresent === "boolean" ? parsed.logoPresent : null;
      summary = String(parsed.summary ?? summary);
    }
  } catch (e) {
    console.error("visionInspect VLM failed:", e);
    summary += " Vision-model OCR was unavailable; contrast and palette checks ran locally.";
  }

  return { dominantColors: dominant, offBrandColors: offBrand, contrastIssues: issues, logoPresent, ocrText, summary };
}

// ─── Full pipeline orchestration ─────────────────────────────────────────────

export function complianceScore(findings: Pick<Finding, "severity">[]): number {
  let score = 100;
  for (const f of findings) {
    if (f.severity === "critical") score -= 25;
    else if (f.severity === "warning") score -= 10;
    else score -= 3;
  }
  return Math.max(0, score);
}

export async function runPreFlightInspection(submission: {
  id: string;
  orgId: string;
  contentType: string;
  content: string;
  imageData: string | null;
  imagePalette: string | null;
}): Promise<{ inspectionId: string; score: number; findingsCount: number }> {
  const t0 = performance.now();

  // Load org knowledge
  const [docs, tokens] = await Promise.all([
    db.guidelineDocument.findMany({ where: { orgId: submission.orgId }, include: { chunks: true } }),
    db.visualToken.findMany({ where: { orgId: submission.orgId } }),
  ]);
  const allChunks: ChunkRow[] = docs.flatMap((d) =>
    d.chunks.map((c) => ({ id: c.id, text: c.text, ruleTag: c.ruleTag, keywords: c.keywords, document: { title: d.title, docType: d.docType } }))
  );

  const bannedTerms = docs
    .filter((d) => d.docType === "banned_words")
    .flatMap((d) => d.content.split(/[\n,;]/).map((t) => t.trim()).filter(Boolean));
  const trademarks = docs
    .filter((d) => d.docType === "trademark")
    .flatMap((d) =>
      d.content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .flatMap((line) => {
          // Matches brand|® pairs anywhere in a rule line, e.g. "RULE TM-01: NimbusPay|® — The master brand…"
          const out: { brand: string; glyph: string }[] = [];
          const re = /([A-Za-z][A-Za-z0-9 ]{1,40}?)\s*\|\s*(®|™)/g;
          let m: RegExpExecArray | null;
          while ((m = re.exec(line)) !== null) {
            const brand = m[1].trim();
            if (brand.length >= 2) out.push({ brand, glyph: m[2] });
          }
          return out;
        })
    );

  // ── Stage A: deterministic pre-filter
  const stageA = runDeterministicStage(submission.content, { bannedTerms, trademarks });

  // ── Stage B: RAG + tone + vision
  const isBanner = submission.contentType === "banner";
  const [claimVerdicts, tone, vision] = await Promise.all([
    submission.content ? aiVerifyClaims(stageA.claimCandidates.slice(0, 6), allChunks, "the organization") : Promise.resolve([]),
    submission.content ? aiToneAnalysis(submission.content, allChunks.filter((c) => c.document.docType === "tone" || c.document.docType === "guideline")) : Promise.resolve(null),
    isBanner && submission.imageData
      ? visionInspect(
          submission.imageData,
          (() => { try { return JSON.parse(submission.imagePalette ?? "[]") as string[]; } catch { return []; } })(),
          tokens.filter((t) => t.tokenType === "color").map((t) => ({ hex: t.value, name: t.name })),
          tokens.find((t) => t.tokenType === "logo")?.name ?? null
        )
      : Promise.resolve(null),
  ]);

  // ── Convert to findings
  type FindingSeed = Omit<Finding, "id" | "submissionId" | "status" | "overrideNote" | "resolvedAt" | "createdAt">;
  const seeds: FindingSeed[] = [];

  for (const b of stageA.bannedTerms) {
    seeds.push({
      severity: "warning",
      category: "style",
      flaggedText: b.term,
      ruleCitation: "Banned & Restricted Terms — term is prohibited in all external copy",
      sourceDoc: "Banned & Restricted Terms",
      rationale: `"${b.term}" appears in the restricted vocabulary list and risks deceptive-marketing scrutiny.`,
      suggestion: null,
      suggestedHex: null,
      stage: "deterministic",
    });
  }
  for (const tm of stageA.trademarkIssues) {
    seeds.push({
      severity: "warning",
      category: "trademark",
      flaggedText: tm.brand,
      ruleCitation: `Trademark rules — "${tm.brand}" must always carry the ${tm.expectedGlyph} glyph`,
      sourceDoc: "Trademark & Naming Rules",
      rationale: `The brand name "${tm.brand}" is missing its required ${tm.expectedGlyph} registration mark in this usage.`,
      suggestion: `${tm.brand}${tm.expectedGlyph}`,
      suggestedHex: null,
      stage: "deterministic",
    });
  }
  for (const s of stageA.styleIssues) {
    seeds.push({
      severity: "minor",
      category: "style",
      flaggedText: s.excerpt,
      ruleCitation: "Voice & Tone Playbook — mechanics & punctuation",
      sourceDoc: "Voice & Tone Playbook",
      rationale: s.detail,
      suggestion: null,
      suggestedHex: null,
      stage: "deterministic",
    });
  }
  for (const v of claimVerdicts) {
    if (v.verdict === "SUPPORTED") continue;
    const unsupported = v.verdict === "UNSUPPORTED";
    seeds.push({
      severity: unsupported ? "critical" : "warning",
      category: "claim",
      flaggedText: v.claim,
      ruleCitation: v.citation || "No matching verified fact was found in the ground-truth repository",
      sourceDoc: v.sourceDoc || "Not found",
      rationale: v.rationale,
      suggestion: v.suggestion || null,
      suggestedHex: null,
      stage: "ai",
    });
  }
  if (tone) {
    for (const d of tone.driftFlags) {
      seeds.push({
        severity: "warning",
        category: "tone",
        flaggedText: d.phrase,
        ruleCitation: "Voice & Tone Playbook — persona voice descriptors",
        sourceDoc: "Voice & Tone Playbook",
        rationale: d.reason,
        suggestion: d.suggestion,
        suggestedHex: null,
        stage: "ai",
      });
    }
  }
  if (vision) {
    for (const c of vision.contrastIssues) {
      seeds.push({
        severity: "critical",
        category: "visual",
        flaggedText: `Text ${c.foreground} on ${c.background}`,
        ruleCitation: `WCAG 2.1 AA — contrast ratio must be ≥ 4.5:1 (measured ${c.ratio}:1)`,
        sourceDoc: "Accessibility & Visual Tokens",
        rationale: `Foreground ${c.foreground} on background ${c.background} yields only ${c.ratio}:1, below the 4.5:1 AA threshold.`,
        suggestion: `Use ${readableOn(c.background)} text on ${c.background} for guaranteed AA compliance.`,
        suggestedHex: readableOn(c.background),
        stage: "vision",
      });
    }
    for (const hex of vision.offBrandColors) {
      const approved = tokens.filter((t) => t.tokenType === "color").map((t) => ({ hex: t.value, name: t.name }));
      const nearest = approved.map((a) => ({ a, d: colorDistance(hex, a.hex) })).sort((x, y) => x.d - y.d)[0];
      seeds.push({
        severity: "warning",
        category: "visual",
        flaggedText: hex,
        ruleCitation: "Visual Token Registry — only approved hex values may appear in creative assets",
        sourceDoc: "Visual Token Registry",
        rationale: `${hex} is not part of the approved palette. Nearest official token is ${nearest?.a.hex ?? "n/a"} (${nearest?.a.name ?? "unknown"}).`,
        suggestion: `Replace ${hex} with ${nearest?.a.hex ?? "#0F766E"}`,
        suggestedHex: nearest?.a.hex ?? "#0F766E",
        stage: "vision",
      });
    }
  }

  const score = complianceScore(seeds);
  const durationMs = +(performance.now() - t0).toFixed(0);

  // Persist
  await db.finding.deleteMany({ where: { submissionId: submission.id, status: "open" } });
  await db.finding.createMany({ data: seeds.map((s) => ({ ...s, submissionId: submission.id })) });
  const inspection = await db.inspection.create({
    data: {
      submissionId: submission.id,
      stageA: JSON.stringify(stageA),
      stageB: JSON.stringify({ durationMs, tone, claimVerdicts, vision }),
      durationMs,
      complianceScore: score,
    },
  });
  await db.submission.update({
    where: { id: submission.id },
    data: {
      scanCount: { increment: 1 },
      complianceScore: score,
    },
  });

  return { inspectionId: inspection.id, score, findingsCount: seeds.length };
}

// ─── One-click remediation rewrite ───────────────────────────────────────────

export async function generateRewrite(finding: {
  flaggedText: string;
  rationale: string;
  ruleCitation: string;
  category: string;
}, fullText: string): Promise<string> {
  const system = "You are BrandShield's intent-preserving copy corrector. Fix ONLY the compliance violation while keeping the creator's voice, rhythm, and marketing energy. Respond with ONLY the corrected phrase or sentence — no quotes, no explanation.";
  const user = `Brand rule violated: ${finding.ruleCitation}
Why it was flagged: ${finding.rationale}
Flagged text: """${finding.flaggedText}"""
Surrounding copy for context:
"""
${fullText.slice(0, 1500)}
"""
Return the corrected version of the flagged text.`;
  try {
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: system },
        { role: "user", content: user },
      ],
      thinking: { type: "disabled" },
    });
    const out = completion.choices[0]?.message?.content?.trim();
    if (out) return out.replace(/^["']|["']$/g, "");
  } catch (e) {
    console.error("generateRewrite failed:", e);
  }
  return finding.flaggedText;
}

// ─── Cryptographic audit chain ───────────────────────────────────────────────

export async function appendAuditLog(entry: {
  orgId: string;
  submissionId: string | null;
  actorId: string;
  action: string;
  details: Record<string, unknown>;
}): Promise<{ contentHash: string; prevHash: string }> {
  const last = await db.auditLog.findFirst({
    where: { orgId: entry.orgId },
    orderBy: { createdAt: "desc" },
    select: { contentHash: true },
  });
  const prevHash = last?.contentHash ?? "GENESIS";
  const payload = JSON.stringify({
    prevHash,
    action: entry.action,
    submissionId: entry.submissionId,
    actorId: entry.actorId,
    details: entry.details,
    ts: Date.now(),
  });
  const contentHash = createHash("sha256").update(payload).digest("hex");
  await db.auditLog.create({
    data: {
      orgId: entry.orgId,
      submissionId: entry.submissionId,
      actorId: entry.actorId,
      action: entry.action,
      details: JSON.stringify(entry.details),
      contentHash,
      prevHash,
    },
  });
  return { contentHash, prevHash };
}

export function computeSignOffHash(submissionId: string, content: string, reviewerId: string, timestamp: number): string {
  return createHash("sha256").update(`${submissionId}|${content}|${reviewerId}|${timestamp}`).digest("hex");
}
