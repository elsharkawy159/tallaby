/**
 * Structured server error logs (PLAN.md P9-03). There is no logging library:
 * this writes one `console.error` line per failure, shaped as
 *
 *   [scope] message { ...context, error: { name, code, message } }
 *
 * so Vercel / server logs can be searched by the `[scope]` prefix
 * (`[publish]`, `[fee]`, `[integration]`, `[wallet]`, `[admin]`).
 *
 * Never pass secrets, tokens, credentials, payment details or personal data
 * (names, emails, phones, addresses) in `context`; pass ids only. The error is
 * reduced to its name, code and a short message: Drizzle's "Failed query"
 * messages embed the SQL parameters (which can hold personal data), so for
 * those only the database driver's own message is kept.
 */

export type LogScope = "publish" | "fee" | "integration" | "wallet" | "admin" | "email";

export type LogContext = Record<string, string | number | boolean | null | undefined>;

export type ErrorSummary = { name: string; code?: string; message: string };

const MAX_MESSAGE = 300;

export function summarizeError(error: unknown): ErrorSummary {
  if (!(error instanceof Error)) {
    return { name: typeof error, message: typeof error === "string" ? error.slice(0, MAX_MESSAGE) : "non-error thrown" };
  }
  const cause = (error as { cause?: unknown }).cause as { code?: unknown; message?: unknown } | undefined;
  const code =
    typeof (error as { code?: unknown }).code === "string"
      ? ((error as unknown as { code: string }).code)
      : typeof cause?.code === "string"
        ? cause.code
        : undefined;

  let message = error.message;
  if (message.startsWith("Failed query")) {
    // DrizzleQueryError: "Failed query: <sql>\nparams: <values>". Keep only the driver message.
    message = typeof cause?.message === "string" ? cause.message : "Failed query";
  }
  return { name: error.name, ...(code && { code }), message: message.slice(0, MAX_MESSAGE) };
}

export function logServerError(scope: LogScope, message: string, context: LogContext = {}, error?: unknown): void {
  const payload: Record<string, unknown> = { ...context };
  if (error !== undefined) payload.error = summarizeError(error);
  console.error(`[${scope}] ${message}`, payload);
}
