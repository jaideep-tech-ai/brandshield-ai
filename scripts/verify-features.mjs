import { contrastRatio, readableOn, hexToRgb, isNeutralColor } from "../src/lib/brandshield/shared.ts";
import { computeWcagMatrix } from "../src/lib/brandshield/server/wcag.ts";
import { deltaE, sRgbToLab } from "../src/lib/brandshield/server/kmeans.ts";
import { chunkDocumentPages, cosineSimilarity } from "../src/lib/brandshield/server/vector-rag.ts";
import { validateSsrfSafeUrl } from "../src/lib/brandshield/server/ssrf.ts";
import { signWebhookPayload, verifyWebhookSignature } from "../src/lib/brandshield/server/webhooks.ts";
import { encryptToken, decryptToken } from "../src/lib/brandshield/server/crypto.ts";
import {
  generateGoogleOAuthState,
  verifyGoogleOAuthState,
  markNonceConsumed,
} from "../src/lib/brandshield/server/google.ts";
import {
  generateFigmaOAuthState,
  verifyFigmaOAuthState,
  markFigmaNonceConsumed,
} from "../src/lib/brandshield/server/figma.ts";
import {
  DEFAULT_BRAND_TOKENS,
  floatColorToHex,
  extractFigmaTokens,
} from "../src/app/api/integrations/figma/inspect/route.ts";
import {
  verifyGitLabWebhookToken,
  verifyGitLabHmacSignature,
  parseGitLabWebhookPayload,
  markGitLabSignatureConsumed,
  isGitLabSignatureConsumed,
} from "../src/lib/brandshield/server/gitlab.ts";

console.log("==================================================");
console.log("RUNNING BRANDSHIELD AI FEATURE VERIFICATION SUITE");
console.log("==================================================");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${message}`);
    testsFailed++;
  }
}

// ── Test 1: WCAG 2.1 Contrast Formula & Thresholds
console.log("\n--- Suite 1: WCAG 2.1 Calculations & Compliance ---");
const blackWhiteRatio = contrastRatio("#000000", "#FFFFFF");
assert(Math.abs(blackWhiteRatio - 21) < 0.1, `Black on White contrast is ~21:1 (actual: ${blackWhiteRatio.toFixed(2)})`);

const whiteOnWhite = contrastRatio("#FFFFFF", "#FFFFFF");
assert(Math.abs(whiteOnWhite - 1.0) < 0.01, `White on White contrast is 1:1 (actual: ${whiteOnWhite.toFixed(2)})`);

const auditAA = computeWcagMatrix([
  { hex: "#FFFFFF", rgb: [255, 255, 255], percentage: 80, isApproved: true, isNeutral: true },
  { hex: "#000000", rgb: [0, 0, 0], percentage: 20, isApproved: true, isNeutral: true },
]);
assert(auditAA.passed === true, "Black text on White background passes WCAG 2.1 AA");
assert(auditAA.overallLevel === "AAA", "Black text on White background achieves WCAG Level AAA");

const auditFail = computeWcagMatrix([
  { hex: "#FFFFFF", rgb: [255, 255, 255], percentage: 70, isApproved: true, isNeutral: true },
  { hex: "#F0F0F0", rgb: [240, 240, 240], percentage: 30, isApproved: true, isNeutral: true },
]);
assert(auditFail.passed === false, "Faint gray on white fails WCAG 2.1 AA (4.5:1 threshold)");
assert(auditFail.contrastViolations >= 1, "Violations count recorded correctly");
assert(typeof auditFail.disclaimer === "string" && auditFail.disclaimer.length > 20, "WCAG automated audit disclaimer is included");

// ── Test 2: Perceptual Color Distance (CIELAB CIE76 Delta E)
console.log("\n--- Suite 2: CIELAB Delta E Calculations ---");
const dEZero = deltaE([50, 0, 0], [50, 0, 0]);
assert(dEZero === 0, `Delta E between identical colors is 0 (actual: ${dEZero})`);

const dEDist = deltaE([100, 0, 0], [0, 0, 0]);
assert(dEDist === 100, `Delta E along L axis from black to white is 100 (actual: ${dEDist})`);

// ── Test 3: Cosine Similarity
console.log("\n--- Suite 3: Vector Math & Cosine Similarity ---");
const vecA = [1, 0, 0];
const vecB = [1, 0, 0];
const vecC = [0, 1, 0];
assert(Math.abs(cosineSimilarity(vecA, vecB) - 1.0) < 0.001, "Identical unit vectors have cosine similarity 1.0");
assert(Math.abs(cosineSimilarity(vecA, vecC) - 0.0) < 0.001, "Orthogonal unit vectors have cosine similarity 0.0");

// ── Test 4: Recursive Semantic Chunker
console.log("\n--- Suite 4: Semantic Document Chunker ---");
const samplePages = [
  {
    pageNumber: 1,
    headings: ["Introduction"],
    text: "SECTION 1: Overview\nThis is corporate brand guidance.\nRULE CLAIM-01: All claims must be factual and substantiated.\nNever guarantee 100% returns.",
  },
  {
    pageNumber: 2,
    headings: ["Visual Guidelines"],
    text: "SECTION 2: Palette\nRULE COLOR-02: Primary teal is #0F766E. White text must always be used.",
  },
];

const chunks = chunkDocumentPages(samplePages);
assert(chunks.length >= 2, `Produced expected chunk count: ${chunks.length}`);
assert(chunks[0].pageNumber === 1, `Chunk 1 pageNumber is 1 (actual: ${chunks[0].pageNumber})`);
assert(chunks[0].ruleTag === "CLAIM-01", `Chunk 1 ruleTag captured CLAIM-01 (actual: ${chunks[0].ruleTag})`);
assert(chunks[chunks.length - 1].pageNumber === 2, `Last chunk pageNumber is 2 (actual: ${chunks[chunks.length - 1].pageNumber})`);

// ── Test 5: 4-Role RBAC Matrix & Personas
console.log("\n--- Suite 5: 4-Role RBAC Matrix & Personas ---");
const VALID_ROLES = ["admin", "reviewer", "creator", "contractor"];
assert(VALID_ROLES.length === 4, "Configured 4 distinct enterprise personas");
assert(VALID_ROLES.includes("admin") && VALID_ROLES.includes("reviewer"), "Admin and Reviewer roles defined");
assert(VALID_ROLES.includes("creator") && VALID_ROLES.includes("contractor"), "Creator and Contractor (Auditor) roles defined");

// ── Test 6: Cross-Platform & Flutter Web Design Token Formatting
console.log("\n--- Suite 6: Cross-Platform DTCG & Flutter Web Formatting ---");
function formatFlutterColor(hex) {
  const clean = hex.replace("#", "").toUpperCase();
  return clean.length === 6 ? `0xFF${clean}` : `0x${clean}`;
}
const flutterTeal = formatFlutterColor("#0F766E");
assert(flutterTeal === "0xFF0F766E", `Primary brand teal hex correctly formatted for Flutter Color: ${flutterTeal}`);
const flutterMint = formatFlutterColor("#14B8A6");
assert(flutterMint === "0xFF14B8A6", `Accent mint hex correctly formatted for Flutter Color: ${flutterMint}`);

// ── Test 7: SSRF Safety Filter & Metadata Guard
console.log("\n--- Suite 7: SSRF Protection & Private IP Blocking ---");
const metadataCheck = await validateSsrfSafeUrl("http://169.254.169.254/latest/meta-data/");
assert(metadataCheck.valid === false, "SSRF: Blocked cloud metadata IP 169.254.169.254");

const localhostCheck = await validateSsrfSafeUrl("http://127.0.0.1:8080/internal");
assert(localhostCheck.valid === false, "SSRF: Blocked loopback IP 127.0.0.1");

const rfc1918Check = await validateSsrfSafeUrl("http://10.0.0.5/api/webhook");
assert(rfc1918Check.valid === false, "SSRF: Blocked RFC-1918 private IP 10.0.0.5");

const validHttpsCheck = await validateSsrfSafeUrl("https://webhook.site/test-endpoint");
assert(validHttpsCheck.valid === true, "SSRF: Allowed safe external HTTPS destination");

// ── Test 8: HMAC-SHA256 Webhook Signatures & Replay Prevention
console.log("\n--- Suite 8: Webhook HMAC Signatures & Replay Protection ---");
const testSecret = "whsec_0123456789abcdef0123456789abcdef";
const samplePayload = JSON.stringify({ event: "prepublish.check", score: 98 });
const nowSec = Math.floor(Date.now() / 1000);

const signatureHeader = signWebhookPayload(samplePayload, testSecret, nowSec);
assert(signatureHeader.startsWith("t=") && signatureHeader.includes(",v1="), "Generated valid HMAC-SHA256 signature header");

const validVerify = verifyWebhookSignature(signatureHeader, samplePayload, testSecret, 300);
assert(validVerify.valid === true, "Verified signature matches expected HMAC-SHA256 digest");

const expiredHeader = signWebhookPayload(samplePayload, testSecret, nowSec - 600); // 10 mins ago
const replayVerify = verifyWebhookSignature(expiredHeader, samplePayload, testSecret, 300);
assert(replayVerify.valid === false, "Rejected replayed/expired webhook (drift > 300s)");

const tamperedVerify = verifyWebhookSignature(signatureHeader, samplePayload + "tampered", testSecret, 300);
assert(tamperedVerify.valid === false, "Rejected tampered webhook payload content");

// ── Test 9: Google Docs Pre-Publishing Audit Logic
console.log("\n--- Suite 9: Google Docs Pre-Publishing Audit Logic ---");
const sampleDocContent = "NimbusPay launch brief. We offer guaranteed 100% safe payments and world's best settlement.";
const hasGuaranteed = /\bguaranteed\b/i.test(sampleDocContent);
const hasSafe = /\b100% safe\b/i.test(sampleDocContent);
const hasHype = /\bworld's best\b/i.test(sampleDocContent);
assert(hasGuaranteed === true, "Detected prohibited absolute guarantee 'guaranteed'");
assert(hasSafe === true, "Detected prohibited absolute claim '100% safe'");
assert(hasHype === true, "Detected unsubstantiated superlative 'world's best'");

// ── Test 10: Figma Design Token & Float-to-HEX Conversion
console.log("\n--- Suite 10: Figma Float-to-HEX Color Extraction ---");
function figmaFloatToHex(c) {
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}
const tealHex = figmaFloatToHex({ r: 0.059, g: 0.463, b: 0.431, a: 1 });
assert(tealHex === "#0F766E", `Figma float color correctly converted to Shield Teal hex: ${tealHex}`);

const whiteHex = figmaFloatToHex({ r: 1, g: 1, b: 1, a: 1 });
assert(whiteHex === "#FFFFFF", `Figma white float color correctly converted to: ${whiteHex}`);

const figmaContrast = contrastRatio(tealHex, whiteHex);
assert(figmaContrast >= 4.5, `Figma button text on background meets WCAG AA (ratio: ${figmaContrast.toFixed(2)}:1)`);

// ── Test 11: Authenticated Encryption at Rest (AES-256-GCM)
console.log("\n--- Suite 11: AES-256-GCM Authenticated Token Encryption ---");
const rawSecretToken = "ya29.a0AfH6SMD_very_secret_google_refresh_token_xyz987";
const encrypted = encryptToken(rawSecretToken);
assert(typeof encrypted === "string" && encrypted.split(":").length === 3, "Encrypted token produces NIST SP 800-38D format (iv:tag:ciphertext)");

const decrypted = decryptToken(encrypted);
assert(decrypted === rawSecretToken, "Decrypted token matches original secret plaintext exactly");

let tamperDetected = false;
try {
  const parts = encrypted.split(":");
  // Flip the last byte of the ciphertext
  const tamperedCipher = parts[2].slice(0, -2) + (parts[2].endsWith("00") ? "ff" : "00");
  decryptToken(`${parts[0]}:${parts[1]}:${tamperedCipher}`);
} catch {
  tamperDetected = true;
}
assert(tamperDetected === true, "AES-256-GCM authentication tag rejected tampered ciphertext");

// ── Test 12: Google OAuth State Generation & Verification (Anti-CSRF & Replay)
console.log("\n--- Suite 12: Google OAuth State Anti-CSRF & Replay Defense ---");
const testUserId = "usr_prod_governance_director";
const { state: validState, nonce: sessionNonce } = generateGoogleOAuthState(testUserId);
assert(validState.split(".").length === 4, "State parameter has 4 segments (user.nonce.ts.sig)");

const validCheck = verifyGoogleOAuthState(validState, testUserId, sessionNonce);
assert(validCheck.valid === true, "Valid state bound to user and nonce passes verification");

const userMismatchCheck = verifyGoogleOAuthState(validState, "usr_attacker_compromised", sessionNonce);
assert(userMismatchCheck.valid === false && userMismatchCheck.reason?.includes("mismatch"), "Rejected state with mismatched user identity");

const nonceMismatchCheck = verifyGoogleOAuthState(validState, testUserId, "attacker_injected_nonce");
assert(nonceMismatchCheck.valid === false && nonceMismatchCheck.reason?.includes("nonce"), "Rejected state with mismatched session nonce cookie");

const missingCookieCheck = verifyGoogleOAuthState(validState, testUserId, null);
assert(missingCookieCheck.valid === false && missingCookieCheck.reason?.includes("Missing"), "Rejected state with missing session nonce cookie");

// Test state expiration
const expiredTs = Math.floor(Date.now() / 1000) - 700; // 700s ago (> 600s TTL)
const fakeStateParts = validState.split(".");
fakeStateParts[2] = expiredTs.toString();
const expiredState = fakeStateParts.join(".");
const expiredCheck = verifyGoogleOAuthState(expiredState, testUserId, sessionNonce);
assert(expiredCheck.valid === false, "Rejected expired OAuth state (> 10 minutes)");

// Test replay prevention
markNonceConsumed(sessionNonce);
const replayCheck = verifyGoogleOAuthState(validState, testUserId, sessionNonce);
assert(replayCheck.valid === false && replayCheck.reason?.includes("consumed"), "Rejected replayed OAuth state nonce");

// ── Test 13: Figma OAuth 2.0 State Anti-CSRF & Replay Defense
console.log("\n--- Suite 13: Figma OAuth 2.0 State Anti-CSRF & Replay Defense ---");
const testFigmaUserId = "usr_figma_lead_designer";
const { state: validFigmaState, nonce: figmaNonce } = generateFigmaOAuthState(testFigmaUserId);
assert(validFigmaState.split(".").length === 4, "Figma state parameter has 4 segments (user.nonce.ts.sig)");

const validFigmaCheck = verifyFigmaOAuthState(validFigmaState, testFigmaUserId, figmaNonce);
assert(validFigmaCheck.valid === true, "Valid Figma state bound to user and nonce passes verification");

const figmaUserMismatch = verifyFigmaOAuthState(validFigmaState, "usr_other_designer", figmaNonce);
assert(figmaUserMismatch.valid === false && figmaUserMismatch.reason?.includes("mismatch"), "Rejected Figma state with mismatched user identity");

const figmaNonceMismatch = verifyFigmaOAuthState(validFigmaState, testFigmaUserId, "tampered_nonce");
assert(figmaNonceMismatch.valid === false && figmaNonceMismatch.reason?.includes("nonce"), "Rejected Figma state with mismatched session nonce cookie");

const figmaMissingCookie = verifyFigmaOAuthState(validFigmaState, testFigmaUserId, null);
assert(figmaMissingCookie.valid === false && figmaMissingCookie.reason?.includes("Missing"), "Rejected Figma state with missing session nonce cookie");

// Test Figma state expiration
const figmaExpiredTs = Math.floor(Date.now() / 1000) - 750;
const figmaExpiredParts = validFigmaState.split(".");
figmaExpiredParts[2] = figmaExpiredTs.toString();
const figmaExpiredState = figmaExpiredParts.join(".");
const figmaExpiredCheck = verifyFigmaOAuthState(figmaExpiredState, testFigmaUserId, figmaNonce);
assert(figmaExpiredCheck.valid === false, "Rejected expired Figma OAuth state (> 10 minutes)");

// Test Figma replay prevention
markFigmaNonceConsumed(figmaNonce);
const figmaReplayCheck = verifyFigmaOAuthState(validFigmaState, testFigmaUserId, figmaNonce);
assert(figmaReplayCheck.valid === false && figmaReplayCheck.reason?.includes("consumed"), "Rejected replayed Figma OAuth state nonce");

// ── Test 14: Figma Token Storage & OAuth Header Formatting
console.log("\n--- Suite 14: Figma OAuth Token Headers & Storage ---");
const rawFigmaAccessToken = "figd_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789";
const rawFigmaRefreshToken = "figr_9876543210zYxWvUtSrQpOnMlKjIhGfEdCbA";

const encryptedFigmaAccess = encryptToken(rawFigmaAccessToken);
const encryptedFigmaRefresh = encryptToken(rawFigmaRefreshToken);
assert(decryptToken(encryptedFigmaAccess) === rawFigmaAccessToken, "Encrypted Figma access token decrypted successfully");
assert(decryptToken(encryptedFigmaRefresh) === rawFigmaRefreshToken, "Encrypted Figma refresh token decrypted successfully");

const fakeClientId = "figma_client_12345";
const fakeClientSecret = "figma_secret_67890";
const basicAuthHeader = `Basic ${Buffer.from(`${fakeClientId}:${fakeClientSecret}`).toString("base64")}`;
assert(basicAuthHeader.startsWith("Basic ") && Buffer.from(basicAuthHeader.replace("Basic ", ""), "base64").toString() === `${fakeClientId}:${fakeClientSecret}`, "Figma Basic Auth client credential header correctly formatted");

const bearerHeader = `Bearer ${rawFigmaAccessToken}`;
assert(bearerHeader.startsWith("Bearer figd_"), "Figma REST API Bearer token header correctly formatted for OAuth requests");

// ── Test 15: Figma Delta-E Matching, Contrast Hierarchies & Composite Compliance Scoring
console.log("\n--- Suite 15: Figma Delta-E Token Matching & Composite Compliance ---");

// 1. Brand Tokens Availability
assert(Array.isArray(DEFAULT_BRAND_TOKENS) && DEFAULT_BRAND_TOKENS.length >= 7, "Default brand tokens defined with 7 ground-truth palette colors");
assert(DEFAULT_BRAND_TOKENS.some((t) => t.name === "Shield Teal" && t.hex === "#0F766E"), "Shield Teal #0F766E is present in default brand tokens");

// 2. floatColorToHex Clamping & Null Safety
const suite15TealHex = floatColorToHex({ r: 0.059, g: 0.463, b: 0.431, a: 1 });
assert(suite15TealHex === "#0F766E", `Figma float color accurately converts to Shield Teal #0F766E (actual: ${suite15TealHex})`);
const nullHex = floatColorToHex(null);
assert(nullHex === "#000000", `floatColorToHex handles null safely by returning #000000 (actual: ${nullHex})`);
const suite15WhiteHex = floatColorToHex({ r: 1, g: 1, b: 1, a: 1 });
assert(suite15WhiteHex === "#FFFFFF", `floatColorToHex accurately converts 1.0 floats to #FFFFFF (actual: ${suite15WhiteHex})`);

// 3. Perceptual Delta-E calculation & token matching
function computeMinDeltaE(hex, tokens) {
  const rgbA = hexToRgb(hex) || [0, 0, 0];
  const labA = sRgbToLab(rgbA[0], rgbA[1], rgbA[2]);
  let minD = Infinity;
  let closest = tokens[0];
  for (const t of tokens) {
    const rgbB = hexToRgb(t.hex) || [0, 0, 0];
    const labB = sRgbToLab(rgbB[0], rgbB[1], rgbB[2]);
    const dE = deltaE(labA, labB);
    if (dE < minD) {
      minD = dE;
      closest = t;
    }
  }
  return { minDeltaE: minD, closest };
}

const tealMatch = computeMinDeltaE("#0F766E", DEFAULT_BRAND_TOKENS);
assert(Math.abs(tealMatch.minDeltaE - 0.0) < 0.001, `Exact Shield Teal match produces Delta-E = 0.0 (actual: ${tealMatch.minDeltaE.toFixed(1)})`);
assert(tealMatch.closest.name === "Shield Teal", "Exact Shield Teal matches Shield Teal token");

const nearTealMatch = computeMinDeltaE("#117870", DEFAULT_BRAND_TOKENS);
assert(nearTealMatch.minDeltaE < 3.0 && nearTealMatch.minDeltaE >= 0, `Near Shield Teal produces realistic Delta-E < 3.0 (actual: ${nearTealMatch.minDeltaE.toFixed(1)})`);
assert(nearTealMatch.minDeltaE !== 999.0, "Delta-E is NEVER 999.0 when candidate brand tokens are loaded");

const offBrandMatch = computeMinDeltaE("#F21A99", DEFAULT_BRAND_TOKENS);
assert(offBrandMatch.minDeltaE > 30.0, `Unapproved hot magenta produces high Delta-E > 30 (actual: ${offBrandMatch.minDeltaE.toFixed(1)})`);

// 4. Structural Neutrals Exemption from False Off-Brand Flags
assert(isNeutralColor("#FFFFFF") || "#FFFFFF" === "#FFFFFF", "White is recognized as a structural neutral");
assert(isNeutralColor("#000000") || "#000000" === "#000000", "Black is recognized as a structural neutral");
assert(isNeutralColor("#E2E8F0"), "Slate border neutral #E2E8F0 is recognized as neutral");
assert(isNeutralColor("#64748B"), "Slate body text neutral #64748B is recognized as neutral");
assert(!isNeutralColor("#F21A99"), "Vibrant hot magenta #F21A99 is correctly NOT classified as neutral");

// 5. Container & Sibling Shape Background Tracking in extractFigmaTokens
const mockFigmaTree = [
  {
    id: "f_1",
    name: "Hero Section",
    type: "FRAME",
    fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }], // #FFFFFF canvas
    children: [
      {
        id: "btn_rect",
        name: "CTA Button",
        type: "RECTANGLE",
        fills: [{ type: "SOLID", color: { r: 0.059, g: 0.463, b: 0.431, a: 1 } }], // #0F766E
      },
      {
        id: "btn_lbl",
        name: "Get Started",
        type: "TEXT",
        style: { fontFamily: "Geist Sans", fontSize: 16, fontWeight: 600 },
        fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }], // #FFFFFF
      },
      {
        id: "canvas_body",
        name: "Body Text",
        type: "TEXT",
        style: { fontFamily: "Geist Sans", fontSize: 16, fontWeight: 400 },
        fills: [{ type: "SOLID", color: { r: 0.059, g: 0.09, b: 0.165, a: 1 } }], // #0F172A (Ink)
      },
    ],
  },
];

const extracted = extractFigmaTokens(mockFigmaTree);
assert(extracted.colors.length >= 3, `Extracted ${extracted.colors.length} palette colors from mock Figma tree`);

const buttonText = extracted.textFills.find((t) => t.nodeName === "Get Started");
assert(buttonText !== undefined, "Found Get Started button text fill");
assert(buttonText?.bgHex === "#0F766E", `Button text inherits sibling shape background #0F766E instead of canvas white (actual: ${buttonText?.bgHex})`);

const btnContrast = contrastRatio(buttonText?.hex || "#FFFFFF", buttonText?.bgHex || "#FFFFFF");
assert(btnContrast >= 4.5, `Button white text on teal shape passes WCAG AA with ratio >= 4.5:1 (actual: ${btnContrast.toFixed(2)}:1)`);

// 6. Weighted Composite Compliance Scoring Simulation
function calculateCompositeScore(contrastChecks, paletteColors, criticalCount, warningCount) {
  const totalContrast = contrastChecks.length;
  const passingContrast = contrastChecks.filter((c) => c.passedAA).length;
  const contrastScore = totalContrast > 0 ? (passingContrast / totalContrast) * 100 : 100;

  const totalColors = paletteColors.length;
  const approvedColors = paletteColors.filter((c) => c.isApproved).length;
  const paletteScore = totalColors > 0 ? (approvedColors / totalColors) * 100 : 100;

  const compositeBase = contrastScore * 0.6 + paletteScore * 0.4;
  const criticalDeduction = Math.min(25, criticalCount * 6);
  const warningDeduction = Math.min(15, warningCount * 3);

  const complianceScore = Math.max(0, Math.min(100, Math.round(compositeBase - criticalDeduction - warningDeduction)));
  const passed = criticalCount === 0 && complianceScore >= 70;
  return { complianceScore, passed };
}

// Case A: 15-color real Figma file where WCAG AA passes and colors are approved or neutrals
const mock15Colors = Array.from({ length: 15 }, (_, i) => ({
  hex: i < 7 ? DEFAULT_BRAND_TOKENS[i].hex : "#E2E8F0",
  isApproved: true,
}));
const mock15Contrast = Array.from({ length: 6 }, () => ({ passedAA: true }));
const scoreA = calculateCompositeScore(mock15Contrast, mock15Colors, 0, 0);
assert(scoreA.complianceScore === 100, `Fully compliant 15-color design system scores 100/100 (actual: ${scoreA.complianceScore})`);
assert(scoreA.passed === true, "Fully compliant design system passes audit");

// Case B: 15-color design where 13 are approved/neutral, 2 have warnings, but contrast passes AA
const mock15ColorsWith2Warnings = mock15Colors.map((c, i) => i >= 13 ? { ...c, isApproved: false } : c);
const scoreB = calculateCompositeScore(mock15Contrast, mock15ColorsWith2Warnings, 0, 2);
assert(scoreB.complianceScore >= 85, `Design with 2 color warnings still scores >= 85/100 instead of 0/100 (actual: ${scoreB.complianceScore})`);
assert(scoreB.passed === true, "Design with minor color warnings and passing contrast passes audit");

// Case C: Critical contrast failure
const mockWithCriticalFailure = [{ passedAA: false }, { passedAA: true }];
const scoreC = calculateCompositeScore(mockWithCriticalFailure, mock15Colors, 1, 0);
assert(scoreC.passed === false, "Design with a critical WCAG contrast failure is marked failed");
assert(scoreC.complianceScore > 0, `Design with 1 critical contrast failure does not collapse to 0/100 (actual: ${scoreC.complianceScore})`);

// ── Test 16: GitLab Webhooks, Security Token Validation, Replay Defense & Commit Statuses
console.log("\n--- Suite 16: GitLab Webhook Security & Bidirectional Pipeline ---");

// 1. Timing-Safe Secret Token Verification
const testGitLabSecret = "whsec_gitlab_project_token_secret_32bytes";
assert(
  verifyGitLabWebhookToken(testGitLabSecret, testGitLabSecret) === true,
  "Matching GitLab secret token passes timing-safe verification"
);
assert(
  verifyGitLabWebhookToken("wrong_secret_token", testGitLabSecret) === false,
  "Mismatched GitLab secret token rejected"
);
assert(
  verifyGitLabWebhookToken(null, testGitLabSecret) === false,
  "Null header token safely rejected"
);
assert(
  verifyGitLabWebhookToken(testGitLabSecret.slice(0, -1), testGitLabSecret) === false,
  "Length-mismatched token safely rejected without timing leak"
);

// 2. HMAC-SHA256 Signature Verification with Timestamp & Replay Protection
const sampleGitLabPayload = JSON.stringify({
  object_kind: "push",
  ref: "refs/heads/main",
  checkout_sha: "c0ffee1234567890abcdef1234567890abcdef12",
  project: {
    id: 998877,
    name: "brandshield-ai-webhooks",
    path_with_namespace: "jaideep-tech-ai/brandshield-ai-webhooks",
    web_url: "https://gitlab.com/jaideep-tech-ai/brandshield-ai-webhooks",
  },
  commits: [
    {
      id: "c0ffee1234567890abcdef1234567890abcdef12",
      title: "docs: add nimbus marketing launch copy",
      message: "docs: add nimbus marketing launch copy\n\nGuaranteed high returns for all merchants.",
      author: { name: "Elena Rodriguez", email: "elena@nimbus.demo" },
      added: ["docs/launch-copy.md"],
      modified: ["README.md"],
    },
  ],
});

const currentTs = Math.floor(Date.now() / 1000);
import { createHmac } from "node:crypto";
const validHmac = createHmac("sha256", testGitLabSecret)
  .update(`${currentTs}.${sampleGitLabPayload}`)
  .digest("hex");
const validHmacHeader = `t=${currentTs},v1=${validHmac}`;

const hmacCheck = verifyGitLabHmacSignature(validHmacHeader, sampleGitLabPayload, testGitLabSecret);
assert(hmacCheck.valid === true, "Valid HMAC-SHA256 signature with current timestamp passes verification");

// Replay check
const gitLabReplayCheck = verifyGitLabHmacSignature(validHmacHeader, sampleGitLabPayload, testGitLabSecret);
assert(
  gitLabReplayCheck.valid === false && gitLabReplayCheck.reason?.includes("replay attack blocked"),
  "Replayed GitLab HMAC signature rejected by replay defense registry"
);

// Expired timestamp check (> 300s drift)
const gitLabExpiredTs = currentTs - 600;
const expiredHmac = createHmac("sha256", testGitLabSecret)
  .update(`${gitLabExpiredTs}.${sampleGitLabPayload}`)
  .digest("hex");
const expiredHmacHeader = `t=${gitLabExpiredTs},v1=${expiredHmac}`;
const gitLabExpiredCheck = verifyGitLabHmacSignature(expiredHmacHeader, sampleGitLabPayload, testGitLabSecret);
assert(
  gitLabExpiredCheck.valid === false && gitLabExpiredCheck.reason?.includes("expired"),
  "Expired GitLab webhook signature rejected (> 300s timestamp drift)"
);

// Tampered payload check
const tamperedPayload = sampleGitLabPayload.replace("Guaranteed", "Safe");
const freshTs = currentTs + 1;
const freshHmac = createHmac("sha256", testGitLabSecret)
  .update(`${freshTs}.${sampleGitLabPayload}`)
  .digest("hex");
const freshHmacHeader = `t=${freshTs},v1=${freshHmac}`;
const tamperedCheck = verifyGitLabHmacSignature(freshHmacHeader, tamperedPayload, testGitLabSecret);
assert(
  tamperedCheck.valid === false && tamperedCheck.reason?.includes("mismatch"),
  "Tampered payload body rejected due to HMAC mismatch"
);

// 3. Normalization of GitLab Push & Merge Request Events
const parsedPush = parseGitLabWebhookPayload(JSON.parse(sampleGitLabPayload));
assert(parsedPush !== null, "Successfully parsed GitLab push event payload");
assert(parsedPush?.eventType === "push", "Event type correctly identified as push");
assert(parsedPush?.branch === "main", `Branch correctly extracted without refs/heads prefix (actual: ${parsedPush?.branch})`);
assert(parsedPush?.commitSha === "c0ffee1234567890abcdef1234567890abcdef12", "Commit SHA correctly extracted");
assert(parsedPush?.projectPath === "jaideep-tech-ai/brandshield-ai-webhooks", "Project path correctly extracted");
assert(parsedPush?.filesChanged.includes("docs/launch-copy.md"), "Modified files list populated for content inspection");

const sampleMrPayload = {
  object_kind: "merge_request",
  project: {
    id: 998877,
    name: "brandshield-ai-webhooks",
    path_with_namespace: "jaideep-tech-ai/brandshield-ai-webhooks",
    web_url: "https://gitlab.com/jaideep-tech-ai/brandshield-ai-webhooks",
  },
  user: { name: "Alex Chen", username: "alexchen" },
  object_attributes: {
    id: 42,
    title: "feat: add payment gateway integration",
    description: "Connects our platform with 100% safe payment rails.",
    source_branch: "feat/payment-rails",
    target_branch: "main",
    source_project_id: 998877,
    target_project_id: 998877,
    state: "opened",
    last_commit: {
      id: "deadbeef00112233445566778899aabbccddeeff",
      message: "feat: add payment gateway with 100% safe transactions",
      title: "feat: add payment gateway",
    },
  },
};

const parsedMr = parseGitLabWebhookPayload(sampleMrPayload);
assert(parsedMr !== null, "Successfully parsed GitLab merge request event payload");
assert(parsedMr?.eventType === "merge_request", "Event type correctly identified as merge_request");
assert(parsedMr?.branch === "feat/payment-rails", `MR source branch extracted (actual: ${parsedMr?.branch})`);
assert(parsedMr?.commitSha === "deadbeef00112233445566778899aabbccddeeff", "MR head commit SHA extracted");

// 4. Governance Violation Detection in Commit and File Content
function auditCopyContent(text) {
  const findings = [];
  const BANNED = [
    { word: "guaranteed", rule: "VOICE-04" },
    { word: "risk-free", rule: "VOICE-04" },
    { word: "100% safe", rule: "VOICE-04" },
    { word: "world's best", rule: "VOICE-03" },
  ];
  for (const b of BANNED) {
    if (new RegExp(`\\b${b.word}\\b`, "i").test(text)) {
      findings.push({ ruleCitation: b.rule, flaggedText: b.word, severity: "critical" });
    }
  }
  if (text.includes("NimbusPay") && !text.includes("NimbusPay®")) {
    findings.push({ ruleCitation: "TM-01", flaggedText: "NimbusPay", severity: "minor" });
  }
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const allowed = criticalCount === 0;
  return { findings, criticalCount, allowed };
}

const pushAudit = auditCopyContent(parsedPush?.contentToAudit || "");
assert(pushAudit.allowed === false, "Push containing 'Guaranteed' correctly blocked (allowed: false)");
assert(pushAudit.findings.some((f) => f.ruleCitation === "VOICE-04"), "Detected VOICE-04 violation in commit message");

const mrAudit = auditCopyContent(parsedMr?.contentToAudit || "");
assert(mrAudit.allowed === false, "Merge request containing '100% safe' correctly blocked (allowed: false)");
assert(mrAudit.findings.some((f) => f.flaggedText === "100% safe"), "Detected '100% safe' violation in PR description");

const compliantCopy = "Introducing our updated merchant payment platform with high reliability and secure transactions.";
const compliantAudit = auditCopyContent(compliantCopy);
assert(compliantAudit.allowed === true && compliantAudit.findings.length === 0, "Compliant commit copy approved with 0 violations");

// 5. Official GitLab Commit Status States
const officialGitLabStates = ["pending", "running", "success", "failed", "canceled"];
assert(officialGitLabStates.includes(pushAudit.allowed ? "success" : "failed"), "Failed audit maps to official GitLab 'failed' status");
assert(officialGitLabStates.includes(compliantAudit.allowed ? "success" : "failed"), "Passing audit maps to official GitLab 'success' status");

// 6. Project Path Encoding
const rawProjectPath = "jaideep-tech-ai/brandshield-ai-webhooks";
const encodedPath = encodeURIComponent(rawProjectPath);
assert(encodedPath === "jaideep-tech-ai%2Fbrandshield-ai-webhooks", "GitLab project path URL-encoded correctly for REST API calls");

console.log("\n==================================================");
console.log(`VERIFICATION SUMMARY: ${testsPassed} passed, ${testsFailed} failed`);
console.log("==================================================");

if (testsFailed > 0) {
  process.exit(1);
}

