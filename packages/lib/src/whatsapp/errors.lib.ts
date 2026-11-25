/**
 * Graph send errors and retries (docs/whatsapp.md §4 Retries). Pure.
 *
 * - retryable: 130429 (throughput), 131048 (spam rate limit), 131056 (pair
 *   rate limit), 131057 (account in maintenance), 131000 and 131016 (Meta
 *   errors), any 5xx, and a network error before the request was sent.
 * - permanent: 131026 (undeliverable), 131047 (re-engagement), 131049, 131050
 *   (user stopped marketing), 131051 (unsupported type), every 132xxx
 *   (template errors), 133010 (number not registered), and any other 4xx.
 * - auth: 190 (token expired or revoked). Fails the message like a permanent
 *   error, and the caller logs an ops alert.
 *
 * A timeout after the request body was sent is neither: the message may have
 * gone out, so it becomes `unknown` and is never re-sent automatically.
 */

export type GraphErrorClass = "retryable" | "permanent" | "auth";

export interface GraphSendError {
  /** Graph `error.code`, when the response had one. */
  code?: number | null;
  /** HTTP status, when a response came back. */
  httpStatus?: number | null;
  /** Network failure: `before_send` (safe to retry) or `after_send` (outcome unknown). */
  network?: "before_send" | "after_send" | null;
}

const RETRYABLE_CODES = new Set([130429, 131048, 131056, 131057, 131000, 131016]);
const PERMANENT_CODES = new Set([131026, 131047, 131049, 131050, 131051, 133010]);
const AUTH_CODES = new Set([190]);

/** Pair rate limit (131056): the next try for the same recipient waits at least this long. */
export const PAIR_RATE_LIMIT_CODE = 131056;
export const PAIR_RATE_LIMIT_MIN_DELAY_MS = 10_000;

/** Delays before retry 1, 2, 3 and 4. */
export const RETRY_BACKOFF_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 3_600_000] as const;

/** Sends per message, the first one included; after the last one fails the message is `failed`. */
export const WHATSAPP_MAX_ATTEMPTS = 5;

export function classifyGraphError(error: GraphSendError): GraphErrorClass {
  const code = error.code ?? null;
  if (code !== null) {
    if (AUTH_CODES.has(code)) return "auth";
    if (RETRYABLE_CODES.has(code)) return "retryable";
    if (PERMANENT_CODES.has(code) || (code >= 132000 && code <= 132999)) return "permanent";
  }
  const status = error.httpStatus ?? null;
  if (status !== null && status >= 500) return "retryable";
  if (status === 401) return "auth";
  if (status === 429) return "retryable";
  if (status === null && error.network === "before_send") return "retryable";
  return "permanent";
}

/**
 * How long to wait before the next send after `attempt` failed sends
 * (1 = the first send failed), or null when no attempt is left.
 */
export function nextAttemptDelayMs(attempt: number, code?: number | null): number | null {
  if (!Number.isInteger(attempt) || attempt < 1 || attempt >= WHATSAPP_MAX_ATTEMPTS) return null;
  const delay = RETRY_BACKOFF_MS[attempt - 1] ?? null;
  if (delay === null) return null;
  return code === PAIR_RATE_LIMIT_CODE ? Math.max(delay, PAIR_RATE_LIMIT_MIN_DELAY_MS) : delay;
}

export type SendErrorOutcome =
  | { status: "queued"; delayMs: number }
  | { status: "failed"; auth: boolean }
  | { status: "unknown" };

/** What a failed send does to its row, after `attempt` failed sends. */
export function sendErrorOutcome(error: GraphSendError, attempt: number): SendErrorOutcome {
  if (error.network === "after_send" && (error.httpStatus ?? null) === null) return { status: "unknown" };
  const kind = classifyGraphError(error);
  if (kind === "retryable") {
    const delayMs = nextAttemptDelayMs(attempt, error.code);
    if (delayMs !== null) return { status: "queued", delayMs };
  }
  return { status: "failed", auth: kind === "auth" };
}
