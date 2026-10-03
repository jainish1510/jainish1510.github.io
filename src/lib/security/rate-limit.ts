/**
 * Fixed-window, in-memory rate limiter. Adequate for a single-process
 * personal site; swap for Redis/Upstash if the app is ever horizontally scaled.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterMs: number };

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  if (now - lastSweep > 60_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    lastSweep = now;
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterMs: 0 };
}

export function resetRateLimits() {
  buckets.clear();
}

export const LIMITS = {
  search: { limit: 60, windowMs: 60_000 },
  like: { limit: 40, windowMs: 60_000 },
  bookmark: { limit: 40, windowMs: 60_000 },
  view: { limit: 60, windowMs: 60_000 },
  comment: { limit: 5, windowMs: 10 * 60_000 },
  contact: { limit: 3, windowMs: 30 * 60_000 },
  login: { limit: 8, windowMs: 15 * 60_000 },
  upload: { limit: 30, windowMs: 60_000 },
  event: { limit: 60, windowMs: 60_000 },
} as const;
