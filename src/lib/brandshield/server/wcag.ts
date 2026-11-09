import { contrastRatio, readableOn } from "../shared";
import type { ExtractedColorCluster, WcagMatrixItem } from "../types";

/**
 * Stage 3: WCAG 2.1 Contrast & Accessibility Evaluation Engine.
 *
 * SPECIFICATIONS:
 * - Computes relative luminance and contrast ratios between dominant palette colors.
 * - WCAG 2.1 AA Thresholds:
 *     - Normal text (< 18pt or < 14pt bold): minimum 4.5:1
 *     - Large text (>= 18pt or >= 14pt bold): minimum 3.0:1
 * - WCAG 2.1 AAA Thresholds (Enhanced):
 *     - Normal text: minimum 7.0:1
 *     - Large text: minimum 4.5:1
 *
 * DISCLAIMER / ACCESSIBILITY SCOPE:
 * Automated palette and image inspection evaluates color contrast relationships,
 * but cannot reliably identify every rendered typographic element, font weight, or
 * spatial layering. Full WCAG 2.1 compliance requires end-to-end structural and manual audits.
 */

export const WCAG_DISCLAIMER =
  "Automated visual inspection evaluates palette contrast ratios, but cannot independently verify every text layer or guarantee full WCAG 2.1 compliance.";

export interface AccessibilityAuditResult {
  wcagMatrix: WcagMatrixItem[];
  accessibilityScore: number;
  overallLevel: "AAA" | "AA" | "FAIL";
  passed: boolean;
  contrastViolations: number;
  summary: string;
  disclaimer: string;
}

export function computeWcagMatrix(palette: ExtractedColorCluster[]): AccessibilityAuditResult {
  if (palette.length === 0) {
    return {
      wcagMatrix: [],
      accessibilityScore: 100,
      overallLevel: "AA",
      passed: true,
      contrastViolations: 0,
      summary: "No dominant color clusters available to evaluate.",
      disclaimer: WCAG_DISCLAIMER,
    };
  }

  // The cluster with the highest area percentage represents the primary canvas background
  const backgroundCluster = palette[0];
  const bgHex = backgroundCluster.hex;

  // Foreground candidates: other clusters with meaningful representation (>= 1% area)
  const foregroundCandidates = palette.slice(1).filter((c) => c.percentage >= 1.0);

  // If only 1 dominant cluster was detected, benchmark standard white and dark text against it
  if (foregroundCandidates.length === 0) {
    foregroundCandidates.push(
      { hex: "#FFFFFF", rgb: [255, 255, 255], percentage: 0, isApproved: true, isNeutral: true },
      { hex: "#0F172A", rgb: [15, 23, 42], percentage: 0, isApproved: true, isNeutral: true }
    );
  }

  const matrix: WcagMatrixItem[] = [];
  let violations = 0;
  let totalTests = 0;

  for (const fg of foregroundCandidates) {
    totalTests++;
    const ratio = +contrastRatio(fg.hex, bgHex).toFixed(2);
    const normalTextAA = ratio >= 4.5;
    const largeTextAA = ratio >= 3.0;
    const normalTextAAA = ratio >= 7.0;
    const largeTextAAA = ratio >= 4.5;

    let overallStatus: "AAA" | "AA" | "FAIL" = "FAIL";
    if (normalTextAAA) overallStatus = "AAA";
    else if (normalTextAA) overallStatus = "AA";

    let remediationSuggestion: string | undefined;
    if (!normalTextAA) {
      violations++;
      const bestAlternative = readableOn(bgHex);
      remediationSuggestion = `Low contrast (${ratio}:1). Use ${bestAlternative} text on ${bgHex} for guaranteed WCAG 2.1 AA compliance (ratio ≥ 4.5:1).`;
    }

    matrix.push({
      foregroundHex: fg.hex,
      backgroundHex: bgHex,
      contrastRatio: ratio,
      normalTextAA,
      largeTextAA,
      normalTextAAA,
      largeTextAAA,
      overallStatus,
      remediationSuggestion,
    });
  }

  // Cross-pairing: evaluate secondary pairings among other prominent colors
  if (palette.length >= 3) {
    const p1 = palette[1];
    const p2 = palette[2];
    const ratio = +contrastRatio(p1.hex, p2.hex).toFixed(2);
    const normalTextAA = ratio >= 4.5;
    const largeTextAA = ratio >= 3.0;
    const normalTextAAA = ratio >= 7.0;
    const largeTextAAA = ratio >= 4.5;

    let overallStatus: "AAA" | "AA" | "FAIL" = "FAIL";
    if (normalTextAAA) overallStatus = "AAA";
    else if (normalTextAA) overallStatus = "AA";

    matrix.push({
      foregroundHex: p1.hex,
      backgroundHex: p2.hex,
      contrastRatio: ratio,
      normalTextAA,
      largeTextAA,
      normalTextAAA,
      largeTextAAA,
      overallStatus,
      remediationSuggestion: !normalTextAA ? `Secondary pair contrast is ${ratio}:1. Avoid placing ${p1.hex} directly over ${p2.hex} for text.` : undefined,
    });
  }

  // Score Calculation
  const passRate = totalTests > 0 ? (totalTests - violations) / totalTests : 1;
  const accessibilityScore = Math.max(0, Math.min(100, Math.round(passRate * 100)));

  const allPassedAA = matrix.every((m) => m.normalTextAA);
  const allPassedAAA = matrix.every((m) => m.normalTextAAA);

  let overallLevel: "AAA" | "AA" | "FAIL" = "FAIL";
  if (allPassedAAA) overallLevel = "AAA";
  else if (allPassedAA) overallLevel = "AA";

  const passed = allPassedAA;
  let summary = `Analyzed ${matrix.length} color pair(s) against background ${bgHex}. `;
  if (passed) {
    summary += `All prominent text/background color pairs meet or exceed WCAG 2.1 Level AA requirements.`;
  } else {
    summary += `${violations} contrast violation(s) detected below the 4.5:1 AA threshold.`;
  }

  return {
    wcagMatrix: matrix,
    accessibilityScore,
    overallLevel,
    passed,
    contrastViolations: violations,
    summary,
    disclaimer: WCAG_DISCLAIMER,
  };
}
