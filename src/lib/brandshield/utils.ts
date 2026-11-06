"use client";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Color math (WCAG 2.1) — used both client & server ──────────────────────

export function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export function wcagLevel(ratio: number, largeText = false): "AAA" | "AA" | "AA-Large" | "FAIL" {
  if (largeText) {
    if (ratio >= 4.5) return "AAA";
    if (ratio >= 3) return "AA-Large";
    return "FAIL";
  }
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "FAIL";
}

export function isNeutralColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min < 24; // low saturation → neutral
}

export function colorDistance(hexA: string, hexB: string): number {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return Infinity;
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

export function nearestApproved(hex: string, approved: string[]): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const a of approved) {
    const d = colorDistance(hex, a);
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  return best;
}

export function readableOn(hex: string): "#FFFFFF" | "#0F172A" {
  return contrastRatio(hex, "#FFFFFF") >= contrastRatio(hex, "#0F172A") ? "#FFFFFF" : "#0F172A";
}

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

// ─── Line diff (LCS) for side-by-side revision compare ───────────────────────

export type DiffRow = { left: string | null; right: string | null; type: "same" | "removed" | "added" | "changed" };

export function lineDiff(oldText: string, newText: string): DiffRow[] {
  const a = oldText.split("\n");
  const b = newText.split("\n");
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rows.push({ left: a[i], right: b[j], type: "same" });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ left: a[i], right: null, type: "removed" });
      i++;
    } else {
      rows.push({ left: null, right: b[j], type: "added" });
      j++;
    }
  }
  while (i < n) rows.push({ left: a[i++], right: null, type: "removed" });
  while (j < m) rows.push({ left: null, right: b[j++], type: "added" });
  return rows;
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

export function timeAgo(dateStr: string, lang: "en" | "hi" = "en"): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === "hi" ? "अभी" : "just now";
  if (mins < 60) return lang === "hi" ? `${mins} मि. पहले` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === "hi" ? `${hours} घं. पहले` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return lang === "hi" ? `${days} दि. पहले` : `${days}d ago`;
  return lang === "hi"
    ? new Date(dateStr).toLocaleDateString("hi-IN", { day: "numeric", month: "short", year: "numeric" })
    : new Date(dateStr).toLocaleDateString();
}

export function formatDate(dateStr: string, lang: "en" | "hi" = "en"): string {
  return new Date(dateStr).toLocaleString(lang === "hi" ? "hi-IN" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function shortHash(hash: string): string {
  return hash.slice(0, 10) + "…" + hash.slice(-6);
}
