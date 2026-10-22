"use server";

import { revalidatePath } from "next/cache";
import { shipOrderWithBosta } from "@workspace/lib/integrations/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import type { ShipWithBostaErrorKey, ShipWithBostaResult } from "./bosta.dto";

/**
 * "Ship with Bosta" on the Delivery page. Only the order id comes from the
 * client: ownership, the store (and so the Bosta account), the address and
 * the cash to collect are all read on the server.
 */

const limiter = createRateLimiter({ limit: 60, windowMs: 10 * 60_000 });

const ERRORS: Record<string, ShipWithBostaErrorKey> = {
  order_not_found: "orderNotFound",
  handled_by_other: "handledByOther",
  not_ready: "notReady",
  not_connected: "notConnected",
  no_address: "noAddress",
  missing_address: "noAddress",
  invalid_phone: "invalidPhone",
  unsupported_city: "unsupportedCity",
  auth: "auth",
  rejected: "rejected",
  throttled: "rateLimited",
  unreachable: "unreachable",
  failed: "unreachable",
};

export async function shipWithBosta(orderId: string): Promise<ShipWithBostaResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    if (!limiter.check(`bosta-ship:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await shipOrderWithBosta(seller.sellerId, String(orderId));
    if (!result.success) {
      return { success: false, error: ERRORS[result.error] ?? "generic", message: result.message };
    }
    revalidatePath("/orders", "layout");
    return { success: true, data: { trackingNumber: result.data.trackingNumber, alreadyShipped: result.data.alreadyShipped } };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "orderNotFound" };
    console.error("[bosta] ship failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
