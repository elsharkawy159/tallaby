/**
 * WhatsApp settings reads (docs/whatsapp.md §3, D6). Uncached on purpose
 * (CLAUDE.md rule 8: messaging state). A read that fails (for example before
 * migration 0180 is applied) is treated as "WhatsApp off", so nothing sends.
 */
import { db, eq, storeWhatsappSettings, whatsappSettings } from "@workspace/db";
import { effectiveStoreWhatsApp, type StoreWhatsAppRow, type WhatsAppGlobalSettings } from "./order-message.lib";

type Queryable = Pick<typeof db, "select">;

let warned = false;
function warnOnce(error: unknown): void {
  if (warned) return;
  warned = true;
  console.error("[whatsapp] settings unavailable; treating WhatsApp as off", (error as Error)?.message?.slice(0, 200));
}

function rates(value: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const [key, rate] of Object.entries(value as Record<string, unknown>)) {
    if (typeof rate === "number" && Number.isInteger(rate) && rate >= 0) out[key] = rate;
  }
  return out;
}

/** The admin's settings (row 1), or null when the table or row is missing. */
export async function getWhatsAppSettings(q: Queryable = db): Promise<WhatsAppGlobalSettings | null> {
  try {
    const [row] = await q.select().from(whatsappSettings).where(eq(whatsappSettings.id, 1)).limit(1);
    if (!row) return null;
    return {
      enabled: row.enabled,
      storesDefaultOn: row.storesDefaultOn,
      eventsEnabled: row.eventsEnabled ?? [],
      metaRateMicros: rates(row.metaRateMicros),
      sellerPriceUsdCents: row.sellerPriceUsdCents,
    };
  } catch (error) {
    warnOnce(error);
    return null;
  }
}

/** A store's effective settings: its own row, else the admin default. Null when the read fails. */
export async function getStoreWhatsAppSettings(
  storeId: string,
  settings: Pick<WhatsAppGlobalSettings, "storesDefaultOn">,
  q: Queryable = db
): Promise<StoreWhatsAppRow | null> {
  try {
    const [row] = await q
      .select({ enabled: storeWhatsappSettings.enabled, events: storeWhatsappSettings.events })
      .from(storeWhatsappSettings)
      .where(eq(storeWhatsappSettings.storeId, storeId))
      .limit(1);
    return effectiveStoreWhatsApp(row ?? null, settings);
  } catch (error) {
    warnOnce(error);
    return null;
  }
}
