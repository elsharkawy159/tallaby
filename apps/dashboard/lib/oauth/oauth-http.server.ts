import { NextResponse } from "next/server";
import { normalizeIssuer, OAuthError } from "@workspace/lib/agents";
import { logServerError } from "@workspace/db/log";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * HTTP helpers for the MCP OAuth endpoints (ROADMAP.md F-29b). These endpoints
 * use no cookies, so they answer any origin: browser-based MCP clients (the
 * MCP Inspector, web IDEs) call them with fetch. Responses are never cached.
 */

export function oauthIssuer(): string {
  return normalizeIssuer(process.env.NEXT_PUBLIC_SITE_URL);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

export function oauthJson(body: unknown, status = 200, extra: Record<string, string> = {}): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { ...CORS_HEADERS, "Cache-Control": "no-store", Pragma: "no-cache", ...extra },
  });
}

export function oauthPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function oauthErrorResponse(error: unknown, scope: string): NextResponse {
  if (error instanceof OAuthError) return oauthJson(error.toJSON(), error.status);
  logServerError("integration", `mcp oauth ${scope} failed`, {}, error);
  return oauthJson({ error: "server_error", error_description: "Something went wrong." }, 500);
}

/** Form (RFC 6749) or JSON body → a string map. */
export async function readOAuthBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get("content-type") ?? "";
  const text = await request.text();
  if (text.length > 16_384) throw new OAuthError("invalid_request", "Request body is too large.");
  if (type.includes("application/json")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new OAuthError("invalid_request", "Invalid JSON body.");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new OAuthError("invalid_request", "Invalid body.");
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(([, v]) => typeof v === "string") as [string, string][],
    );
  }
  return Object.fromEntries(new URLSearchParams(text));
}

/** Best-effort per-instance limits (no shared store yet, PLAN.md A4). */
const limiters = {
  register: createRateLimiter({ limit: 20, windowMs: 60 * 60 * 1000 }),
  token: createRateLimiter({ limit: 120, windowMs: 60 * 1000 }),
  revoke: createRateLimiter({ limit: 60, windowMs: 60 * 1000 }),
};

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function rateLimited(kind: keyof typeof limiters, request: Request): NextResponse | null {
  if (limiters[kind].check(clientIp(request))) return null;
  return oauthJson({ error: "slow_down", error_description: "Too many requests." }, 429, { "Retry-After": "60" });
}
