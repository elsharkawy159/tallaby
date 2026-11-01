/**
 * MCP tool calls (ROADMAP.md F-29c, design note §8): rate-limit windows and
 * the redacted argument summary written to agent_tool_calls. Pure; storage in
 * calls.server.ts.
 */

export type RateBucket = "minute" | "day" | "write_minute";

/** Per grant (design note §8): 120 calls/min, 2,000/day, 30 writes/min. */
export const AGENT_RATE_LIMITS: Record<RateBucket, { windowSeconds: number; limit: number }> = {
  minute: { windowSeconds: 60, limit: 120 },
  day: { windowSeconds: 24 * 60 * 60, limit: 2000 },
  write_minute: { windowSeconds: 60, limit: 30 },
};

/** Start of the fixed window that `now` falls in. */
export function rateWindowStart(now: Date, windowSeconds: number): Date {
  const ms = windowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / ms) * ms);
}

/** Seconds until the window that `now` falls in ends (for Retry-After). */
export function rateRetryAfter(now: Date, windowSeconds: number): number {
  const end = rateWindowStart(now, windowSeconds).getTime() + windowSeconds * 1000;
  return Math.max(1, Math.ceil((end - now.getTime()) / 1000));
}

const SUMMARY_KEYS = 20;
const SUMMARY_STRING = 80;
const SUMMARY_ARRAY = 5;
/** Never written to the log, whatever the tool. */
const SECRET_KEY = /token|secret|password|key$|authorization/i;

function summarizeValue(value: unknown, depth: number): unknown {
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value.length > SUMMARY_STRING ? `${value.slice(0, SUMMARY_STRING)}…` : value;
  if (Array.isArray(value)) {
    if (depth >= 2) return `[${value.length} items]`;
    const head = value.slice(0, SUMMARY_ARRAY).map((v) => summarizeValue(v, depth + 1));
    return value.length > SUMMARY_ARRAY ? [...head, `+${value.length - SUMMARY_ARRAY} more`] : head;
  }
  if (typeof value === "object") {
    if (depth >= 2) return "{…}";
    return summarizeArgs(value as Record<string, unknown>, depth + 1);
  }
  return null;
}

/**
 * A short, secret-free copy of a tool's arguments for the activity log: long
 * strings cut, arrays and nesting capped, secret-looking keys dropped. The
 * idempotency key is stored in its own column.
 */
export function summarizeArgs(args: Record<string, unknown> | null | undefined, depth = 0): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!args || typeof args !== "object") return out;
  for (const [key, value] of Object.entries(args).slice(0, SUMMARY_KEYS)) {
    if (key === "idempotencyKey" || SECRET_KEY.test(key)) continue;
    out[key] = summarizeValue(value, depth);
  }
  return out;
}

/** An idempotency key the client may send: 1–200 visible ASCII characters. */
export function isIdempotencyKey(value: unknown): value is string {
  return typeof value === "string" && /^[\x21-\x7e]{1,200}$/.test(value);
}
