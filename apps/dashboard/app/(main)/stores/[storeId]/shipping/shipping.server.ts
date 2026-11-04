"use server";

import { revalidatePath } from "next/cache";
import { DEFAULT_CURRENCY, parseStoreCurrency } from "@workspace/lib";
import type { ShippingTemplate, StoreShippingSettings as Settings } from "@workspace/lib/shipping/store-zones";
import {
  deleteStoreShippingZone,
  getStore,
  saveStoreShippingZone,
  applyStoreShippingTemplate,
  updateStoreShippingSettings,
  type StoreShippingZone,
} from "@workspace/lib/stores/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import type { StoreShippingErrorKey, StoreShippingResult } from "./shipping.dto";

/**
 * Store shipping settings and zones (PLAN.md §8.7, P3-08 Part A). storeId is
 * explicit and re-checked with requireStore; validation, the no-overlap rule
 * and the audit row live in @workspace/lib/stores/server.
 */

const limiter = createRateLimiter({ limit: 60, windowMs: 10 * 60_000 });

const ERRORS: Record<string, StoreShippingErrorKey> = {
  invalid_input: "invalidInput",
  overlap: "overlap",
  too_many_zones: "tooManyZones",
  no_zones: "noZones",
  tallaby_unavailable: "tallabyUnavailable",
  zones_exist: "zonesExist",
  egypt_template_only: "egyptTemplateOnly",
  store_read_only: "readOnly",
  not_found: "notFound",
};

async function run<T>(
  storeId: string,
  fn: (sellerId: string, actorId: string, id: string) => Promise<{ success: true; data: T } | { success: false; error: string }>,
): Promise<StoreShippingResult<T>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!limiter.check(`shipping:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const result = await fn(seller.sellerId, seller.userId, store.id);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    revalidatePath(`/stores/${store.id}/shipping`);
    return { success: true, data: result.data };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    console.error("[store-shipping] save failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}

export async function saveShippingSettings(storeId: string, input: unknown): Promise<StoreShippingResult<Settings>> {
  return run(storeId, (sellerId, actorId, id) => updateStoreShippingSettings(sellerId, actorId, id, input));
}

export async function saveShippingZone(
  storeId: string,
  zoneId: string | null,
  input: unknown,
): Promise<StoreShippingResult<StoreShippingZone>> {
  return run(storeId, (sellerId, actorId, id) =>
    saveStoreShippingZone(sellerId, actorId, id, zoneId === null ? null : String(zoneId), input),
  );
}

/**
 * Saves a template's zones (Tallaby's rates, one price for all Egypt, Cairo & Giza).
 * Places and prices are built server-side; the client sends the template id, the
 * zone names, the price for "one price" only, and `replace` once the seller confirmed
 * deleting the current zones. Without `replace`, a store that has zones gets `zonesExist`.
 * Every template is Egyptian and priced in pounds, so only an EGP store can use one.
 */
export async function applyShippingTemplate(
  storeId: string,
  input: { template: ShippingTemplate; names: { nameAr: string; nameEn?: string }[]; price?: number; replace: boolean },
): Promise<StoreShippingResult<StoreShippingZone[]>> {
  const raw = (input ?? {}) as Record<string, unknown>;
  // Pass only the known fields on; the library schema validates each one strictly.
  const payload = { template: raw.template, names: raw.names, price: raw.price, replace: raw.replace };
  return run(storeId, async (sellerId, actorId, id) => {
    const store = await getStore(sellerId, id);
    if (parseStoreCurrency(store?.settings).currency !== DEFAULT_CURRENCY) return { success: false, error: "egypt_template_only" };
    return applyStoreShippingTemplate(sellerId, actorId, id, payload);
  });
}

export async function deleteShippingZone(storeId: string, zoneId: string): Promise<StoreShippingResult<{ id: string }>> {
  return run(storeId, (sellerId, actorId, id) => deleteStoreShippingZone(sellerId, actorId, id, String(zoneId)));
}
