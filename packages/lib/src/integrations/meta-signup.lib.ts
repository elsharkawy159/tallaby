/**
 * Tallaby's own Meta Pixel "CompleteRegistration" for a new seller account
 * (tallaby.com and the dashboard, never a storefront). Pure and client-safe:
 * the browser and the Conversions API share the event id and the method, so
 * Meta deduplicates the two. The CAPI sender is in `meta-signup.server.ts`.
 */

export type SignupMethod = "email" | "google";

/** Same id in the browser and the CAPI event; one per account. */
export function signupEventId(userId: string): string {
  return `signup_${userId}`;
}

/** Google when the account was made with Google, else email. */
export function signupMethodOf(user: { app_metadata?: { provider?: unknown } | null }): SignupMethod {
  return user.app_metadata?.provider === "google" ? "google" : "email";
}

/** The `?signup=` value the server adds to the welcome redirect (never trusted beyond this). */
export function parseSignupMethod(raw: unknown): SignupMethod | null {
  return raw === "email" || raw === "google" ? raw : null;
}

/** The custom data both events carry. */
export function signupEventParams(method: SignupMethod) {
  return { content_name: "seller_signup", status: true, method };
}

/**
 * Digits with the country code, as Meta matches phones. Seller phones are
 * stored in the local Egyptian form (01XXXXXXXXX), so a leading 0 becomes 20.
 */
export function metaPhoneDigits(phone: string | null | undefined): string | undefined {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits) return undefined;
  return /^0\d{10}$/.test(digits) ? `20${digits.slice(1)}` : digits;
}

export type SignupRequestContext = {
  clientIpAddress: string | null;
  clientUserAgent: string | null;
  fbp: string | null;
  fbc: string | null;
  eventSourceUrl: string | null;
};

/** IP, user agent, Meta cookies and page URL of the request that created the account. */
export function signupRequestContext(
  headers: { get(name: string): string | null },
  cookies: { get(name: string): { value: string } | undefined },
): SignupRequestContext {
  const host = headers.get("x-forwarded-host") || headers.get("host");
  const proto = headers.get("x-forwarded-proto") || "https";
  return {
    clientIpAddress: headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || null,
    clientUserAgent: headers.get("user-agent"),
    fbp: cookies.get("_fbp")?.value ?? null,
    fbc: cookies.get("_fbc")?.value ?? null,
    eventSourceUrl: host ? `${proto}://${host}/` : null,
  };
}
