import { contrastRatio, readableOn } from "../src/lib/brandshield/shared.ts";
import { computeWcagMatrix } from "../src/lib/brandshield/server/wcag.ts";
import { deltaE } from "../src/lib/brandshield/server/kmeans.ts";
import { chunkDocumentPages, cosineSimilarity } from "../src/lib/brandshield/server/vector-rag.ts";

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

console.log("\n==================================================");
console.log(`VERIFICATION SUMMARY: ${testsPassed} passed, ${testsFailed} failed`);
console.log("==================================================");

if (testsFailed > 0) {
  process.exit(1);
}

