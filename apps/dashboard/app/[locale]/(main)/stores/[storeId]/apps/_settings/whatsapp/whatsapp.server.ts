"use server";

import { logServerError } from "@workspace/db/log";
import {
  listStoreWhatsAppMessages,
  updateStoreWhatsAppSettings,
  type StoreWhatsAppMessagesPage,
  type StoreWhatsAppSettings,
} from "@workspace/lib/whatsapp/store/server";
import { requireStore } from "@/lib/auth/require-seller.server";
import { afterAppChange, appsAccessError, appsSaveLimiter } from "../../apps-action.lib";
import { whatsAppMessagesQuerySchema, whatsAppSettingsInputSchema, type WhatsAppAppResult } from "./whatsapp.dto";

/**
 * Store › Apps › WhatsApp notifications (ROADMAP.md F-109, docs/whatsapp.md
 * §5). Every action takes the store explicitly and re-checks it with
 * `requireStore` (rule 5); the lib filters every query by seller and store
 * again. Nothing here is cached (rule 8).
 */

function failure(error: unknown, what: string, storeId: unknown): WhatsAppAppResult<never> {
  const denied = appsAccessError(error);
  if (denied && !denied.success) return { success: false, error: denied.error === "readOnly" ? "readOnly" : "notFound" };
  logServerError("integration", `whatsapp ${what} failed`, { storeId: String(storeId) }, error);
  return { success: false, error: "generic" };
}

/** Saves the switch and the chosen events. Refused while the admin has WhatsApp off. */
export async function saveWhatsAppSettings(storeId: string, input: unknown): Promise<WhatsAppAppResult<StoreWhatsAppSettings>> {
  try {
    const parsed = whatsAppSettingsInputSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "invalid" };
    if (parsed.data.enabled && parsed.data.events.length === 0) return { success: false, error: "noEvents" };
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await updateStoreWhatsAppSettings(seller.sellerId, store.id, parsed.data);
    if (!result.success) return { success: false, error: result.error };

    await afterAppChange(seller.sellerId, store.id, "whatsapp");
    return result;
  } catch (error) {
    return failure(error, "save", storeId);
  }
}

/** One page of the store's message history (50 rows), with optional status and event filters. */
export async function loadWhatsAppMessages(storeId: string, query: unknown): Promise<WhatsAppAppResult<StoreWhatsAppMessagesPage>> {
  try {
    const parsed = whatsAppMessagesQuerySchema.safeParse(query);
    if (!parsed.success) return { success: false, error: "invalid" };
    const { seller, store } = await requireStore(String(storeId));
    const page = await listStoreWhatsAppMessages(seller.sellerId, store.id, parsed.data);
    return { success: true, data: page };
  } catch (error) {
    return failure(error, "history", storeId);
  }
}
