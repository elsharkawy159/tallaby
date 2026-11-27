"use server";

import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { and, db, eq, sql, stores } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { installStoreApp, uninstallStoreApp } from "@workspace/lib/billing/apps";
import {
  WHATSAPP_BUTTON_APP,
  normalizeWhatsAppButtonInput,
  type StoreWhatsAppButtonSettings,
} from "@workspace/lib/stores/whatsapp-button";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { afterAppChange, appsSaveLimiter } from "../../apps-action.lib";

/**
 * Store › Apps › WhatsApp button (owner, 2026-11-27). storeId is explicit and
 * re-checked with requireStore; the input is cleaned again on the server and
 * saved in `stores.settings.whatsappButton` (other keys kept). Saving works
 * while the app is not installed (like Size chart's charts): the storefront
 * shows nothing until it is. The storefront profile carrying the settings is
 * cached, so the store's hosts are invalidated; install and remove purge the
 * store's integrations tag (`afterAppChange`), which the install read uses.
 */

const saveLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

type ErrorKey = "readOnly" | "notFound" | "rateLimited" | "invalidPhone" | "notInstalled" | "generic";

export type StoreWhatsAppButtonResult = { success: true; settings: StoreWhatsAppButtonSettings } | { success: false; error: ErrorKey };

function accessError(error: unknown): { success: false; error: ErrorKey } | null {
  if (!isAccessError(error)) return null;
  return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
}

export async function saveStoreWhatsAppButton(storeId: string, input: unknown): Promise<StoreWhatsAppButtonResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!saveLimiter.check(`store-whatsapp-button:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const normalized = normalizeWhatsAppButtonInput(input);
    if (!normalized.success) return { success: false, error: normalized.error };
    const { settings } = normalized;
    await db
      .update(stores)
      .set({
        settings: sql`coalesce(${stores.settings}, '{}'::jsonb) || jsonb_build_object('whatsappButton', ${JSON.stringify(settings)}::jsonb)`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(stores.id, store.id), eq(stores.sellerId, seller.sellerId)));

    revalidateDashboardPath(`/stores/${store.id}/apps/whatsapp-button/settings`);
    await applyInvalidation(invalidateStorefront([store.subdomain]), { from: "dashboard", mode: "action" });
    return { success: true, settings };
  } catch (error) {
    const denied = accessError(error);
    if (denied) return denied;
    logServerError("integration", "whatsapp-button save failed", { storeId: String(storeId) }, error);
    return { success: false, error: "generic" };
  }
}

/** Installs or removes the app (free, through the install engine), like Downsell's switch. */
export async function setWhatsAppButtonInstalled(
  storeId: string,
  installed: boolean,
): Promise<{ success: true } | { success: false; error: ErrorKey }> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const target = { sellerId: seller.sellerId, storeId: store.id, appKey: WHATSAPP_BUTTON_APP };
    if (installed === true) {
      const result = await installStoreApp({ ...target, actorId: seller.userId });
      if (!result.success && result.error !== "already_installed") return { success: false, error: "generic" };
    } else {
      const result = await uninstallStoreApp(target);
      if (!result.success) return { success: false, error: "notInstalled" };
    }
    await afterAppChange(seller.sellerId, store.id, WHATSAPP_BUTTON_APP);
    return { success: true };
  } catch (error) {
    const denied = accessError(error);
    if (denied) return denied;
    logServerError("integration", "whatsapp-button install failed", { storeId: String(storeId) }, error);
    return { success: false, error: "generic" };
  }
}
