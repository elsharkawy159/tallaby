import { headers } from "next/headers";
import { and, db, eq, userAddresses } from "@workspace/db";
import { createOrderRateLimit, orderRateLimitKeys, type OrderRateKeys } from "@/lib/order-rate-limit.lib";

/**
 * Store-website order rate limit (ROADMAP.md F-02e), on the server. Every
 * part comes from the request and the session: the store from the host (the
 * caller passes getCartScope's storeId), the IP from the proxy header as the
 * other storefront limiters read it, the phone from the shipping address only
 * when it is that user's. Fail-open: any error lets the order through (logged).
 */
const orderRateLimit = createOrderRateLimit();

export async function storeOrderRateKeys(input: {
  storeId: string;
  userId: string;
  shippingAddressId?: string;
}): Promise<OrderRateKeys | null> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    let phone: string | null = null;
    if (input.shippingAddressId) {
      const address = await db.query.userAddresses.findFirst({
        where: and(eq(userAddresses.id, input.shippingAddressId), eq(userAddresses.userId, input.userId)),
        columns: { phone: true },
      });
      phone = address?.phone ?? null;
    }
    return orderRateLimitKeys({ storeId: input.storeId, ip, phone, userId: input.userId });
  } catch (error) {
    console.error("[order-rate-limit] keys failed, not limiting:", error);
    return null;
  }
}

/** False only when one of the keys is at its limit. */
export function isStoreOrderAllowed(keys: OrderRateKeys | null): boolean {
  if (!keys) return true;
  try {
    return orderRateLimit.allows(keys);
  } catch (error) {
    console.error("[order-rate-limit] check failed, allowing:", error);
    return true;
  }
}

/** Counts a placed order. */
export function recordStoreOrder(keys: OrderRateKeys | null): void {
  if (!keys) return;
  try {
    orderRateLimit.record(keys);
  } catch (error) {
    console.error("[order-rate-limit] record failed:", error);
  }
}
