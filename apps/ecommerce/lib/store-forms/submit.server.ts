"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { submitStoreForm } from "@workspace/lib/store-forms/server";
import { hostnameOf } from "@workspace/lib/storefront";
import { getAuthUser } from "@/lib/auth/current-user";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { getCartScope } from "@/lib/storefront.server";
import { storeFormSubmitSchema, type StoreFormSubmitResult } from "./submit.dto";

// Per visitor and store, and a ceiling per store against floods from many IPs.
const visitorLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });
const storeLimiter = createRateLimiter({ limit: 200, windowMs: 10 * 60_000 });

/**
 * Salted hash of the visitor IP, per store (never the raw IP): the same
 * visitor on two stores gets two unrelated hashes. Null when no salt is
 * configured (replay detection is then skipped; the rate limit still applies).
 */
function hashIp(storeId: string, ip: string): string | null {
  const salt = process.env.FORM_IP_HASH_SALT || process.env.INTERNAL_API_SECRET;
  if (!salt || ip === "unknown") return null;
  return createHmac("sha256", salt).update(`${storeId}:${ip}`).digest("hex");
}

/** The page the form was sent from, only when it is on the same host. */
function sourceUrlOf(referer: string | null, host: string | null): string | null {
  if (!referer || !host) return null;
  try {
    const url = new URL(referer);
    if (hostnameOf(url.host) !== hostnameOf(host) || !/^https?:$/.test(url.protocol)) return null;
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

/**
 * Storefront form submission (PLAN.md §8.4, P4-10). The store is resolved
 * from the request HOST (getCartScope), never from the body; the form must
 * belong to that store and be active, and the values are validated against
 * the form's definition (submitStoreForm). Honeypot, rate limit per IP and
 * store, hashed IP, replayed payloads stored once.
 */
export async function submitStorefrontForm(input: unknown): Promise<StoreFormSubmitResult> {
  const parsed = storeFormSubmitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { formId, values, honeypot } = parsed.data;

  const scope = await getCartScope();
  if (!scope) return { ok: false, error: "notFound" };

  // Bots fill the hidden field: pretend it worked, store nothing.
  if (honeypot) return { ok: true, message: "" };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!visitorLimiter.check(`${scope.storeId}:${ip}`) || !storeLimiter.check(scope.storeId)) {
    return { ok: false, error: "rateLimited" };
  }

  try {
    const user = await getAuthUser().catch(() => null);
    const result = await submitStoreForm(scope.storeId, formId, values, {
      ipHash: hashIp(scope.storeId, ip),
      userAgent: h.get("user-agent"),
      sourceUrl: sourceUrlOf(h.get("referer"), h.get("host")),
      userId: user && !user.is_anonymous ? user.id : null,
    });
    if (!result.success) {
      return result.error === "invalid"
        ? { ok: false, error: "invalid", fieldErrors: result.fieldErrors }
        : { ok: false, error: "notFound" };
    }
    // Store-owner notification email: no backend route exists yet (P4-10 note).
    return { ok: true, message: result.successMessage };
  } catch (error) {
    console.error("[store-forms] submission failed", error instanceof Error ? error.message : error);
    return { ok: false, error: "generic" };
  }
}
