import { EASYKASH_API_BASE, parseEasykashInquiry, type EasykashInquiry, type EasykashPayBody } from "./easykash.lib";

/**
 * EasyKash API calls (docs/easykash.md §1.2, §1.6). Server-only: the API key
 * is the seller's secret. Bodies and keys are never logged or put in an error
 * message; a failure carries the HTTP status only.
 */

type FetchLike = typeof fetch;
export type EasykashCallOptions = { fetch?: FetchLike; timeoutMs?: number };

const DEFAULT_TIMEOUT_MS = 10_000;

/** A non-2xx answer (status set) or an unusable 2xx answer (status 0 with `invalid_response`). */
export class EasykashApiError extends Error {
  readonly status: number;
  constructor(status: number, message = `EasyKash request failed (${status})`) {
    super(message);
    this.name = "EasykashApiError";
    this.status = status;
  }
}

async function post(path: string, apiKey: string, body: unknown, options: EasykashCallOptions): Promise<unknown> {
  const { fetch: fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const response = await fetchImpl(`${EASYKASH_API_BASE}${path}`, {
    method: "POST",
    headers: { authorization: apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new EasykashApiError(response.status);
  return response.json().catch(() => null);
}

/** Pay API: a hosted payment link for the shopper. */
export async function createEasykashPayLink(
  apiKey: string,
  body: EasykashPayBody,
  options: EasykashCallOptions = {},
): Promise<{ redirectUrl: string }> {
  const data = (await post("/api/directpayv1/pay", apiKey, body, options)) as { redirectUrl?: unknown } | null;
  const redirectUrl = typeof data?.redirectUrl === "string" ? data.redirectUrl : "";
  if (!/^https:\/\//i.test(redirectUrl)) throw new EasykashApiError(0, "EasyKash pay response has no redirectUrl");
  return { redirectUrl };
}

/**
 * Payment Inquiry by our reference. Throws EasykashApiError on a non-2xx
 * answer; null when the answer has no status (unknown reference, say).
 */
export async function inquireEasykashPayment(
  apiKey: string,
  customerReference: string,
  options: EasykashCallOptions = {},
): Promise<EasykashInquiry | null> {
  return parseEasykashInquiry(await post("/api/cash-api/inquire", apiKey, { customerReference }, options));
}
