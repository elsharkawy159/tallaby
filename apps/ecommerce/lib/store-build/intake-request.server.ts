import { NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Shared by the hero composer's intake routes (ROADMAP.md F-82d). The AI Store
 * Builder is behind `STORE_BUILDER_AI_ENABLED=1` (F-82m); while it is off the
 * routes answer 404 and the hero keeps its signup button.
 */
export const storeBuilderEnabled = () => process.env.STORE_BUILDER_AI_ENABLED === "1";

/** The visitor's address as Vercel forwards it (only ever hashed). */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

// Per instance (no shared Redis yet, PLAN.md A4): bursts only; the daily cap is in the DB.
export const intakeBurstLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });
export const completeBurstLimiter = createRateLimiter({ limit: 15, windowMs: 10 * 60_000 });

/** The bodies are small JSON objects; anything bigger is refused unread. */
export const MAX_INTAKE_BODY_BYTES = 16 * 1024;

export async function readJsonBody(request: Request): Promise<unknown | undefined> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_INTAKE_BODY_BYTES) return undefined;
  const text = await request.text();
  if (text.length > MAX_INTAKE_BODY_BYTES) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export type IntakeErrorCode = "invalid_input" | "rate_limited" | "invalid_file" | "not_found" | "unavailable" | "failed";

const STATUS: Record<IntakeErrorCode, number> = {
  invalid_input: 400,
  rate_limited: 429,
  invalid_file: 422,
  not_found: 404,
  unavailable: 404,
  failed: 500,
};

export function intakeError(error: IntakeErrorCode): NextResponse {
  return NextResponse.json({ ok: false, error }, { status: STATUS[error], headers: { "Cache-Control": "no-store" } });
}

export function intakeOk(body: Record<string, unknown>): NextResponse {
  return NextResponse.json({ ok: true, ...body }, { headers: { "Cache-Control": "no-store" } });
}
