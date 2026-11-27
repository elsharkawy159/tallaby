"use server";

import { logServerError } from "@workspace/db/log";
import { installStoreApp, uninstallStoreApp } from "@workspace/lib/billing/apps";
import { DOWNSELL_APP, downsellSaveSchema } from "@workspace/lib/downsell";
import { deleteProductDownsell, saveProductDownsell, type DownsellSaveError } from "@workspace/lib/downsell/server";
import { requireStore } from "@/lib/auth/require-seller.server";
import { requireProductStore } from "@/lib/products/product-store.server";
import { afterAppChange, appsAccessError, appsSaveLimiter } from "../../apps-action.lib";
import type { DownsellActionResult, DownsellErrorKey } from "./downsell.dto";

/**
 * Store › Apps › Downsell (ROADMAP.md F-116). Every action takes the store
 * explicitly and re-checks it with `requireStore` (rule 5); product and coupon
 * ids are matched to that store on the server (`saveProductDownsell`).
 * The storefront reads offers fresh at checkout, so there is no cache to purge
 * beyond the App Center pages.
 */

const SAVE_ERRORS: Record<DownsellSaveError, DownsellErrorKey> = {
  unavailable: "unavailable",
  not_found: "notFound",
  offer_not_found: "offerNotFound",
  not_cheaper: "notCheaper",
  same_product: "sameProduct",
  limit: "limit",
};

function failure(error: unknown, what: string, storeId: unknown): DownsellActionResult {
  const denied = appsAccessError(error);
  if (denied) return { success: false, error: denied.success ? "generic" : denied.error === "readOnly" ? "readOnly" : "notFound" };
  logServerError("integration", `downsell ${what} failed`, { storeId: String(storeId) }, error);
  return { success: false, error: "generic" };
}

/** Turns the app on (install) or off (uninstall). Offers are kept either way. */
export async function setDownsellAppInstalled(storeId: string, installed: boolean): Promise<DownsellActionResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const target = { sellerId: seller.sellerId, storeId: store.id, appKey: DOWNSELL_APP };
    if (installed === true) {
      const result = await installStoreApp({ ...target, actorId: seller.userId });
      if (!result.success && result.error !== "already_installed") return { success: false, error: "generic" };
    } else {
      const result = await uninstallStoreApp(target);
      if (!result.success) return { success: false, error: "notInstalled" };
    }
    await afterAppChange(seller.sellerId, store.id, DOWNSELL_APP);
    return { success: true };
  } catch (error) {
    return failure(error, "install", storeId);
  }
}

/** Saves one product's offer (a cheaper product or a coupon), replacing an older one. */
export async function saveDownsell(storeId: string, input: unknown): Promise<DownsellActionResult> {
  try {
    const { seller, store, catalogSplit } = await requireProductStore(String(storeId));
    if (!appsSaveLimiter.check(`downsell:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const parsed = downsellSaveSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "invalid" };
    const result = await saveProductDownsell({ sellerId: seller.sellerId, storeId: store.id, catalogSplit }, parsed.data);
    if (!result.success) return { success: false, error: SAVE_ERRORS[result.error] };
    await afterAppChange(seller.sellerId, store.id, DOWNSELL_APP);
    return { success: true };
  } catch (error) {
    return failure(error, "save", storeId);
  }
}

/** Removes the offer of one product of the store. */
export async function removeDownsell(storeId: string, productId: string): Promise<DownsellActionResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`downsell:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const parsed = downsellSaveSchema.shape.productId.safeParse(productId);
    if (!parsed.success) return { success: false, error: "invalid" };
    const result = await deleteProductDownsell({ sellerId: seller.sellerId, storeId: store.id }, parsed.data);
    if (!result.success) return { success: false, error: "unavailable" };
    await afterAppChange(seller.sellerId, store.id, DOWNSELL_APP);
    return { success: true };
  } catch (error) {
    return failure(error, "remove", storeId);
  }
}
