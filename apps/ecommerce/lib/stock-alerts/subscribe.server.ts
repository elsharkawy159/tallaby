"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { subscribeToStockAlert } from "@workspace/lib/stock-alerts/server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { getCartScope, isRequestStoreOffline } from "@/lib/storefront.server";

// Per visitor and store, and a ceiling per store against floods from many IPs.
const visitorLimiter = createRateLimiter({ limit: 6, windowMs: 10 * 60_000 });
const storeLimiter = createRateLimiter({ limit: 300, windowMs: 10 * 60_000 });

export type StockAlertSubscribeResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "notFound" | "inStock" | "tooMany" | "rateLimited" | "generic" };

/**
 * "Notify me when it's back" on a store product page (0126, ROADMAP.md
 * F-23a). The store comes from the request HOST, never the body; the product
 * must be that store's, live and out of stock (subscribeToStockAlert). No
 * account needed. Honeypot, rate limit per IP and store; asking twice is a
 * quiet success. The email is never logged.
 */
export async function subscribeStockAlert(input: {
  productId: string;
  variantId: string | null;
  email: string;
  honeypot?: string;
}): Promise<StockAlertSubscribeResult> {
  const scope = await getCartScope();
  if (!scope || (await isRequestStoreOffline())) return { ok: false, error: "notFound" };
  // Bots fill the hidden field: pretend it worked, store nothing.
  if (typeof input?.honeypot === "string" && input.honeypot) return { ok: true };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!visitorLimiter.check(`${scope.storeId}:${ip}`) || !storeLimiter.check(scope.storeId)) {
    return { ok: false, error: "rateLimited" };
  }

  try {
    const result = await subscribeToStockAlert({
      storeId: scope.storeId,
      sellerId: scope.sellerId,
      productId: input?.productId,
      variantId: input?.variantId ?? null,
      email: input?.email,
      locale: await getLocale(),
    });
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  } catch (error) {
    console.error("[stock-alerts] subscribe failed", error instanceof Error ? error.name : "unknown");
    return { ok: false, error: "generic" };
  }
}
