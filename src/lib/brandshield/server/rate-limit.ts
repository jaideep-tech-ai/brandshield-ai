// ─── In-memory sliding-window rate limiter ───────────────────────────────────
//
// Protects auth endpoints from runaway scripts ("what if 1000 signups hit the
// API?"). Fixed memory ceiling: expired buckets are pruned on every call, and
// the map is hard-capped so even an attacker rotating IPs cannot grow it.

const BUCKETS = new Map<string, number[]>();
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Prune expired buckets to keep memory flat.
  if (BUCKETS.size > 512) {
    for (const [k, hits] of BUCKETS) {
      const alive = hits.some((t) => now - t < windowMs);
      if (!alive) BUCKETS.delete(k);
    }
  }
  // Hard ceiling — drop the oldest keys if an attacker keeps rotating IDs.
  while (BUCKETS.size >= MAX_BUCKETS) {
    BUCKETS.delete(BUCKETS.keys().next().value as string);
  }

  const hits = (BUCKETS.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
    BUCKETS.set(key, hits);
    return { ok: false, remaining: 0, retryAfterSec };
  }
  hits.push(now);
  BUCKETS.set(key, hits);
  return { ok: true, remaining: limit - hits.length, retryAfterSec: 0 };
}

/** Best-effort client IP from proxy headers (Caddy / Vercel style). */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}
