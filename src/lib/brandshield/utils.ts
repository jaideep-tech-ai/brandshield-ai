"use client";

// ─── Client-only utilities ───────────────────────────────────────────────────
// Pure/isomorphic helpers (color math, cn, diff, formatting) live in
// `shared.ts` and are re-exported below for convenience. Server code must
// import from `shared.ts` — never from this file (browser APIs not allowed).

export * from "./shared";

// ─── Client-side image palette extraction (canvas-based) ─────────────────────

export async function extractImagePalette(file: File, sampleSize = 64): Promise<{ palette: string[]; background: string; dataUrl: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  const w = (canvas.width = Math.min(img.width, 200));
  const h = (canvas.height = Math.min(img.height, 200));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

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
