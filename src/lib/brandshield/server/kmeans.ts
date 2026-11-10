import sharp from "sharp";
import { isNeutralColor } from "../shared";
import type { ExtractedColorCluster, ColorFindingItem } from "../types";

/**
 * Stage 2: Image Processing & Multi-Modal K-Means Clustering Engine.
 *
 * ARCHITECTURAL DESIGN:
 * - Image decoding, format validation, and decompression-bomb protection are
 *   executed using C-backed Sharp (libvips).
 * - Dominant color clustering is executed via an exact K-Means++ algorithm with
 *   Lloyd's iterations in perceptually uniform CIELAB (D65 illuminant) space.
 *   (Note: Per architectural rules, Sharp performs image preprocessing/resizing;
 *   actual K-Means clustering is performed on the extracted pixel vectors.)
 * - Colors are compared against approved organizational brand tokens using
 *   CIE76 Delta-E (ΔE) perceptual difference.
 */

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
  channels: number;
}

export interface ApprovedBrandToken {
  name: string;
  hex: string;
}

export interface KmeansAnalysisResult {
  metadata: ImageMetadata;
  palette: ExtractedColorCluster[];
  colorFindings: ColorFindingItem[];
  durationMs: number;
}

// ─── Format & Signature Sniffing ─────────────────────────────────────────────

const VALID_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export function validateImageBuffer(buffer: Buffer): { format: string } {
  if (!buffer || buffer.byteLength < 8) {
    throw new Error("Invalid image payload: buffer is empty or truncated.");
  }
  // Max size limit: 10 MB
  if (buffer.byteLength > 10 * 1024 * 1024) {
    throw new Error("File size exceeds the 10 MB limit.");
  }

  // Sniff magic bytes
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { format: "png" };
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { format: "jpeg" };
  }
  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { format: "webp" };
  }

  throw new Error("Unsupported image format. Allowed formats: PNG, JPG, JPEG, WebP.");
}

// ─── Color Space Conversions (sRGB <-> CIELAB with D65 Illuminant) ───────────

export function sRgbToLab(r: number, g: number, b: number): [number, number, number] {
  // 1. Linearize sRGB components
  const [lr, lg, lb] = [r / 255, g / 255, b / 255].map((v) =>
    v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );

  // 2. Convert to CIEXYZ (D65 standard observer)
  const x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375;
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175;
  const z = lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041;

  // 3. Normalize for D65 reference white [95.047, 100.0, 108.883]
  const xn = x / 0.95047;
  const yn = y / 1.0;
  const zn = z / 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(xn);
  const fy = f(yn);
  const fz = f(zn);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return [L, a, bVal];
}

function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) clean = clean.split("").map((c) => c + c).join("");
  if (clean.length === 8) clean = clean.slice(0, 6);
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Perceptual color difference (CIE76 Delta E in CIELAB space). */
export function deltaE(labA: [number, number, number], labB: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(labA[0] - labB[0], 2) +
    Math.pow(labA[1] - labB[1], 2) +
    Math.pow(labA[2] - labB[2], 2)
  );
}

// ─── K-Means++ Clustering on Pixel Vectors ──────────────────────────────────

interface PixelPoint {
  rgb: [number, number, number];
  lab: [number, number, number];
}

export function extractKMeansPalette(
  pixels: PixelPoint[],
  k = 5,
  maxIterations = 25
): { hex: string; rgb: [number, number, number]; percentage: number }[] {
  const n = pixels.length;
  if (n === 0) return [];
  const targetK = Math.min(k, n);

  // 1. K-Means++ Initialization (distance-squared proportional sampling)
  const centroids: PixelPoint[] = [];
  const firstIdx = Math.floor(Math.random() * n);
  centroids.push(pixels[firstIdx]);

  while (centroids.length < targetK) {
    const distances: number[] = new Array(n);
    let sumDistSq = 0;

    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      for (const c of centroids) {
        const d = deltaE(pixels[i].lab, c.lab);
        if (d < minDist) minDist = d;
      }
      const distSq = minDist * minDist;
      distances[i] = distSq;
      sumDistSq += distSq;
    }

    let randomVal = Math.random() * sumDistSq;
    let chosenIdx = 0;
    for (let i = 0; i < n; i++) {
      randomVal -= distances[i];
      if (randomVal <= 0) {
        chosenIdx = i;
        break;
      }
    }
    centroids.push(pixels[chosenIdx]);
  }

  // 2. Lloyd's Iterations
  const assignments = new Int32Array(n);
  let currentCentroids = centroids.map((c) => ({
    rgb: [...c.rgb] as [number, number, number],
    lab: [...c.lab] as [number, number, number],
  }));

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    // Assignment step
    for (let i = 0; i < n; i++) {
      let closestIdx = 0;
      let minD = Infinity;
      for (let c = 0; c < targetK; c++) {
        const d = deltaE(pixels[i].lab, currentCentroids[c].lab);
        if (d < minD) {
          minD = d;
          closestIdx = c;
        }
      }
      if (assignments[i] !== closestIdx) {
        assignments[i] = closestIdx;
        changed = true;
      }
    }

    if (!changed && iter > 0) break;

    // Update step
    const counts = new Array<number>(targetK).fill(0);
    const sumRgb = Array.from({ length: targetK }, () => [0, 0, 0]);

    for (let i = 0; i < n; i++) {
      const cluster = assignments[i];
      counts[cluster]++;
      sumRgb[cluster][0] += pixels[i].rgb[0];
      sumRgb[cluster][1] += pixels[i].rgb[1];
      sumRgb[cluster][2] += pixels[i].rgb[2];
    }

    let maxDelta = 0;
    for (let c = 0; c < targetK; c++) {
      if (counts[c] === 0) continue;
      const newR = sumRgb[c][0] / counts[c];
      const newG = sumRgb[c][1] / counts[c];
      const newB = sumRgb[c][2] / counts[c];
      const newLab = sRgbToLab(newR, newG, newB);
      const d = deltaE(currentCentroids[c].lab, newLab);
      if (d > maxDelta) maxDelta = d;
      currentCentroids[c] = { rgb: [newR, newG, newB], lab: newLab };
    }

    if (maxDelta < 0.2) break;
  }

  // 3. Frequency & Weighting
  const clusterCounts = new Array<number>(targetK).fill(0);
  for (let i = 0; i < n; i++) {
    clusterCounts[assignments[i]]++;
  }

  const results = currentCentroids
    .map((c, i) => {
      const percentage = +((clusterCounts[i] / n) * 100).toFixed(1);
      const hex = rgbToHex(c.rgb[0], c.rgb[1], c.rgb[2]);
      return {
        hex,
        rgb: [Math.round(c.rgb[0]), Math.round(c.rgb[1]), Math.round(c.rgb[2])] as [number, number, number],
        percentage,
      };
    })
    .filter((c) => c.percentage > 0.5)
    .sort((a, b) => b.percentage - a.percentage);

  return results;
}

// ─── High-Level Server Image Analyzer ────────────────────────────────────────

export async function processImageForColorClusters(
  inputBuffer: Buffer,
  approvedTokens: ApprovedBrandToken[] = [],
  k = 5
): Promise<KmeansAnalysisResult> {
  const t0 = performance.now();

  // 1. Fast format signature validation
  validateImageBuffer(inputBuffer);

  // 2. Decode & inspect metadata with Sharp
  // Decompression-bomb guard: limit input pixels to 16.7M (4096 x 4096)
  const image = sharp(inputBuffer, { limitInputPixels: 16777216 });
  const meta = await image.metadata();

  if (!meta.width || !meta.height) {
    throw new Error("Could not decode image dimensions or corrupted header.");
  }

  const width = meta.width;
  const height = meta.height;
  const format = meta.format ?? "unknown";
  const channels = meta.channels ?? 3;

  // 3. Downsample to bounding box (max 400x400) for fast O(N) pixel clustering
  const { data: rawBuffer, info } = await image
    .resize(400, 400, { fit: "inside", withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelCount = info.width * info.height;
  const pixels: PixelPoint[] = new Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 3;
    const r = rawBuffer[offset];
    const g = rawBuffer[offset + 1];
    const b = rawBuffer[offset + 2];
    pixels[i] = {
      rgb: [r, g, b],
      lab: sRgbToLab(r, g, b),
    };
  }

  // 4. Execute K-Means++ clustering (default 5 clusters)
  const rawClusters = extractKMeansPalette(pixels, Math.max(3, Math.min(10, k)));

  // 5. Compare against Approved Brand Tokens using CIELAB Delta E
  const approvedLabMap = approvedTokens.map((t) => ({
    token: t,
    lab: sRgbToLab(...hexToRgb(t.hex)),
  }));

  const palette: ExtractedColorCluster[] = [];
  const colorFindings: ColorFindingItem[] = [];

  for (const cluster of rawClusters) {
    const clusterLab = sRgbToLab(...cluster.rgb);
    const neutral = isNeutralColor(cluster.hex);

    let nearestToken: { name: string; hex: string; deltaE: number } | undefined;
    let minDelta = Infinity;

    for (const { token, lab } of approvedLabMap) {
      const d = deltaE(clusterLab, lab);
      if (d < minDelta) {
        minDelta = d;
        nearestToken = { name: token.name, hex: token.hex, deltaE: +d.toFixed(1) };
      }
    }

    // A color is approved if:
    // a) No brand tokens are registered, or
    // b) It is very close to an approved brand token (ΔE <= 6.0), or
    // c) It is a natural neutral (white/gray/black).
    const isMatch = approvedTokens.length === 0 || minDelta <= 6.0 || neutral;
    const isOffBrand = !isMatch && !neutral && minDelta > 12.0;

    palette.push({
      hex: cluster.hex,
      rgb: cluster.rgb,
      percentage: cluster.percentage,
      isApproved: isMatch,
      isNeutral: neutral,
      nearestApprovedToken: nearestToken,
    });

    if (isOffBrand) {
      colorFindings.push({
        hex: cluster.hex,
        isOffBrand: true,
        deltaE: minDelta,
        nearestTokenName: nearestToken?.name,
        nearestHex: nearestToken?.hex,
        rationale: `Color ${cluster.hex} represents ${cluster.percentage}% of the asset and deviates (ΔE: ${minDelta.toFixed(1)}) from approved brand tokens.`,
        suggestion: nearestToken ? `Replace ${cluster.hex} with approved token ${nearestToken.hex} (${nearestToken.name})` : undefined,
      });
    }
  }

  const durationMs = Math.round(performance.now() - t0);

  return {
    metadata: {
      width,
      height,
      format,
      sizeBytes: inputBuffer.byteLength,
      channels,
    },
    palette,
    colorFindings,
    durationMs,
  };
}
