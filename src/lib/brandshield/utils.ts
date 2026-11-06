"use client";

// ─── Client-only utilities ───────────────────────────────────────────────────
// Pure/isomorphic helpers (color math, cn, diff, formatting) live in
// `shared.ts` and are re-exported below for convenience. Server code must
// import from `shared.ts` — never from this file (browser APIs not allowed).

// NOTE: `export *` re-exports names but does NOT bring them into this module's
// scope — functions used inside this file must be imported explicitly.
import { colorDistance } from "./shared";

export * from "./shared";

// ─── Client-side image palette extraction (canvas-based) ─────────────────────
// Built to be bulletproof across engines (Chromium / WebKit-Safari / Firefox):
//  1. Preview data URL via FileReader (with real error extraction)
//  2. Decode via multi-strategy loader — blob object-URL first (fast + robust
//     in WebKit with large/base64 data URIs), then data URL, using img.decode()
//     when available with an onload/onerror fallback
//  3. Natural-size sanity check + natural dimensions (never img.width which can
//     be 0 for un-decoded frames in some engines)
//  4. Canvas + getImageData wrapped with descriptive errors so failures are
//     debuggable instead of a generic "could not read"

export interface ExtractedPalette {
  palette: string[];
  background: string;
  dataUrl: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.length > 0) resolve(reader.result);
      else reject(new Error("empty data URL"));
    };
    reader.onerror = () => reject(new Error(`FileReader failed (${reader.error?.code ?? "unknown"})`));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string, timeoutMs = 8000): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    let settled = false;
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      fn();
    };
    const timer = window.setTimeout(() => done(() => reject(new Error("image decode timed out"))), timeoutMs);
    img.onload = () =>
      done(() => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) resolve(img);
        else reject(new Error("decoded image has zero size"));
      });
    img.onerror = () => done(() => reject(new Error("browser could not decode this image")));
    img.decoding = "async";
    img.src = src;
  });
}

async function decodeImage(dataUrl: string, file: File): Promise<HTMLImageElement> {
  const attempts: string[] = [];
  // Strategy 1: blob object URL — most reliable + fastest in WebKit/Safari,
  // avoids multi-hundred-KB base64 data-URI decode quirks.
  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    const objectUrl = URL.createObjectURL(file);
    try {
      return await loadImageElement(objectUrl);
    } catch (e) {
      attempts.push(e instanceof Error ? e.message : String(e));
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
  // Strategy 2: data URL with onload/onerror (decode() omitted deliberately —
  // Safari's decode() promise can reject for images it still ends up rendering).
  try {
    return await loadImageElement(dataUrl);
  } catch (e) {
    attempts.push(e instanceof Error ? e.message : String(e));
  }
  throw new Error(`image decode failed — tried: ${attempts.join(" | ")}`);
}

export async function extractImagePalette(file: File, sampleSize = 64): Promise<ExtractedPalette> {
  const dataUrl = await fileToDataUrl(file);
  const img = await decodeImage(dataUrl, file);

  const w = Math.min(img.naturalWidth, 200);
  const h = Math.min(img.naturalHeight, 200);
  if (w === 0 || h === 0) throw new Error("image has zero dimensions");

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0, w, h);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    throw new Error("canvas pixel access blocked");
  }

  const counts = new Map<string, number>();
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a < 128) continue;
      // quantize to reduce noise
      const r = Math.round(data[i] / 16) * 16;
      const g = Math.round(data[i + 1] / 16) * 16;
      const b = Math.round(data[i + 2] / 16) * 16;
      const key = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, sampleSize);
  const background = sorted[0]?.[0] ?? "#FFFFFF";
  // pick top distinct colors (min distance apart)
  const palette: string[] = [];
  for (const [hex] of sorted) {
    if (palette.every((p) => colorDistance(p, hex) > 48)) palette.push(hex);
    if (palette.length >= 8) break;
  }
  return { palette, background, dataUrl };
}
