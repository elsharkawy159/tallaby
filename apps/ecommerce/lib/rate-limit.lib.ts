/**
 * Fixed-window, in-memory rate limiter. Per server instance only: there is no
 * shared store (no Upstash/Redis configured, PLAN.md A4), so it slows abuse
 * down rather than guaranteeing a global limit. Swap the Map for Redis when
 * one is added; callers keep the same `check(key)` API.
 */

export type RateLimiter = {
  check: (key: string, now?: number) => boolean;
  size: () => number;
};

export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
}: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}): RateLimiter {
  const hits = new Map<string, { start: number; count: number }>();

  return {
    check(key, now = Date.now()) {
      const entry = hits.get(key);
      if (!entry || now - entry.start >= windowMs) {
        if (!entry && hits.size >= maxKeys) {
          // Drop the oldest entry (Map keeps insertion order).
          const oldest = hits.keys().next().value;
          if (oldest !== undefined) hits.delete(oldest);
        }
        hits.delete(key);
        hits.set(key, { start: now, count: 1 });
        return true;
      }
      if (entry.count >= limit) return false;
      entry.count += 1;
      return true;
    },
    size: () => hits.size,
  };
}
