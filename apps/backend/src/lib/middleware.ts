import type { Context, Next } from "hono";

export function internalApiAuth() {
  return async (c: Context, next: Next) => {
    const apiSecret = process.env.INTERNAL_API_SECRET;

    if (!apiSecret) {
      return c.json({ error: "Internal API secret not configured" }, 500);
    }

    // Check for secret in Authorization header (Bearer token) or X-Internal-Api-Secret header
    const authHeader = c.req.header("Authorization");
    const customHeader = c.req.header("X-Internal-Api-Secret");

    const providedSecret =
      authHeader?.replace(/^Bearer\s+/i, "") || customHeader;

    if (!providedSecret || providedSecret !== apiSecret) {
      return c.json({ error: "Unauthorized: Invalid API secret" }, 401);
    }

    await next();
  };
}
