"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { logServerError } from "@workspace/db/log";
import {
  previewBostaShipment,
  shipOrderWithBosta,
  type BostaShipError,
  type BostaShipPreview,
} from "@workspace/lib/shipping/bosta-ship";
import {
  cancelBostaShipment,
  listBostaTimeline,
  type BostaTimelineEvent,
  type CancelBostaError,
} from "@workspace/lib/shipping/bosta-orders";
import { requireStore, isAccessError } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * "Ship with Bosta" on /orders (BS-08). Every call names the store the order
 * was placed on; requireStore checks it is the session seller's, and the lib
 * checks the order belongs to that store and seller.
 */

/** Each call may create a Bosta delivery: 60 a minute per seller is far above a person's pace. */
const shipLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

export type BostaActionError = BostaShipError | CancelBostaError | "rate_limited" | "read_only" | "generic";

export type BostaActionResult<T> = { success: true; data: T } | { success: false; error: BostaActionError; message?: string; cityIds?: string[] };

function denied(error: unknown): BostaActionResult<never> | null {
  if (!isAccessError(error)) return null;
  return { success: false, error: error.code === "store_read_only" ? "read_only" : "not_found" };
}

export async function previewShipWithBosta(
  storeId: string,
  orderId: string,
  districtId?: string | null,
): Promise<BostaActionResult<BostaShipPreview>> {
  try {
    const { seller, store } = await requireStore(String(storeId));
    const result = await previewBostaShipment(seller.sellerId, store.id, String(orderId), {
      districtId: typeof districtId === "string" ? districtId : null,
      locale: await getLocale(),
    });
    return result.ok ? { success: true, data: result.data } : { success: false, error: result.error };
  } catch (error) {
    const blocked = denied(error);
    if (blocked) return blocked;
    logServerError("integration", "bosta preview failed", { storeId: String(storeId), orderId: String(orderId) }, error);
    return { success: false, error: "generic" };
  }
}

export async function shipWithBosta(
  storeId: string,
  orderId: string,
  overrides: { districtId?: string | null; size?: "SMALL" | "MEDIUM" | "LARGE" | null } = {},
): Promise<BostaActionResult<{ trackingNumber: string }>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!shipLimiter.check(`bosta-ship:${seller.sellerId}`)) return { success: false, error: "rate_limited" };

    const size = overrides.size === "SMALL" || overrides.size === "MEDIUM" || overrides.size === "LARGE" ? overrides.size : null;
    const result = await shipOrderWithBosta(store.id, String(orderId), {
      trigger: "manual",
      sellerId: seller.sellerId,
      overrides: { districtId: typeof overrides.districtId === "string" ? overrides.districtId : null, size },
    });
    revalidatePath("/orders", "layout");
    if (!result.ok) {
      return { success: false, error: result.error, message: result.message, cityIds: result.cityIds };
    }
    return { success: true, data: { trackingNumber: result.trackingNumber } };
  } catch (error) {
    const blocked = denied(error);
    if (blocked) return blocked;
    logServerError("integration", "bosta ship failed", { storeId: String(storeId), orderId: String(orderId) }, error);
    return { success: false, error: "generic" };
  }
}

export async function loadBostaTimeline(storeId: string, orderId: string): Promise<BostaActionResult<BostaTimelineEvent[]>> {
  try {
    const { seller, store } = await requireStore(String(storeId));
    const events = await listBostaTimeline(seller.sellerId, store.id, String(orderId));
    return events ? { success: true, data: events } : { success: false, error: "not_found" };
  } catch (error) {
    const blocked = denied(error);
    if (blocked) return blocked;
    logServerError("integration", "bosta timeline failed", { storeId: String(storeId), orderId: String(orderId) }, error);
    return { success: false, error: "generic" };
  }
}

/** Cancels the Bosta delivery before pickup (Full access keys only); the order goes back to "to ship". */
export async function cancelShipmentWithBosta(storeId: string, orderId: string): Promise<BostaActionResult<null>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!shipLimiter.check(`bosta-ship:${seller.sellerId}`)) return { success: false, error: "rate_limited" };
    const result = await cancelBostaShipment(seller.sellerId, store.id, String(orderId));
    revalidatePath("/orders", "layout");
    return result.ok ? { success: true, data: null } : { success: false, error: result.error, message: result.message };
  } catch (error) {
    const blocked = denied(error);
    if (blocked) return blocked;
    logServerError("integration", "bosta cancel failed", { storeId: String(storeId), orderId: String(orderId) }, error);
    return { success: false, error: "generic" };
  }
}
