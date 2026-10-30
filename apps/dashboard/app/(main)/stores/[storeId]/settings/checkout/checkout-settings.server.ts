"use server";

import { revalidatePath } from "next/cache";
import { and, db, eq, sql, stores } from "@workspace/db";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { parseStoreCheckoutSettingsInput, type StoreCheckoutSettings } from "./checkout-settings.dto";

/**
 * Store settings › Checkout (ROADMAP.md F-25). storeId is explicit and
 * re-checked with requireStore; the input is validated and cleaned on the
 * server and saved in `stores.settings.checkoutForm` and
 * `stores.settings.thankYou` (other keys kept). The storefront reads both
 * fresh at checkout and on the order page, so no storefront cache is
 * invalidated.
 */

const saveLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

export type StoreCheckoutSettingsResult =
  | { success: true; settings: StoreCheckoutSettings }
  | { success: false; error: "readOnly" | "notFound" | "rateLimited" | "invalid" | "questionRequired" | "generic" };

export async function saveStoreCheckoutSettings(storeId: string, input: unknown): Promise<StoreCheckoutSettingsResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!saveLimiter.check(`store-checkout-settings:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const parsed = parseStoreCheckoutSettingsInput(input);
    if (!parsed.ok) return { success: false, error: parsed.error };
    const settings = parsed.value;

    await db
      .update(stores)
      .set({
        settings: sql`coalesce(${stores.settings}, '{}'::jsonb) || jsonb_build_object('checkoutForm', ${JSON.stringify(settings.checkoutForm)}::jsonb, 'thankYou', ${JSON.stringify(settings.thankYou)}::jsonb)`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(stores.id, store.id), eq(stores.sellerId, seller.sellerId)));

    revalidatePath(`/stores/${store.id}/settings/checkout`);
    return { success: true, settings };
  } catch (error) {
    if (isAccessError(error)) {
      return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    }
    console.error("[store-checkout-settings] save failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
