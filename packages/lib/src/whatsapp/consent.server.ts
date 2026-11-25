import { and, db, eq, orders, sql, storeWhatsappSettings, userAddresses, whatsappContacts, whatsappSettings } from "@workspace/db";
import { WHATSAPP_EVENTS, isWhatsAppEvent, type WhatsAppLocale } from "./events.lib";
import { toWhatsAppPhone } from "./phone.lib";

/**
 * Shopper consent for WhatsApp order updates (ROADMAP.md F-109,
 * docs/whatsapp.md D4, D5). Server-only, never cached (rule 8).
 *
 * The checkout box is unticked and shows only while WhatsApp is live for the
 * store (`isWhatsAppLiveForStore`). When the shopper ticks it, the order gets
 * `metadata.whatsapp` (`whatsAppConsentMetadata`, written by the server: the
 * client only sends the boolean) and, after the order is placed, the phone
 * gets a `whatsapp_contacts` row (`recordWhatsAppConsent`). A tick also opts a
 * phone back in after an earlier STOP (D5).
 */

/** The consent text's version. Bump it when the checkbox copy changes. */
export const WHATSAPP_CONSENT_VERSION = "wa-consent-v1";

export type WhatsAppOrderConsent = { optIn: true; locale: WhatsAppLocale; consentVersion: string; at: string };

/** `orders.metadata.whatsapp`, with the server's time. */
export function whatsAppConsentMetadata(locale: string): WhatsAppOrderConsent {
  return {
    optIn: true,
    locale: locale === "en" ? "en" : "ar",
    consentVersion: WHATSAPP_CONSENT_VERSION,
    at: new Date().toISOString(),
  };
}

/**
 * Whether the checkout of this store (from the request host) offers the box:
 * the admin switch is on, the store has WhatsApp on (no row = the admin
 * default), and at least one event is on both for the store and globally.
 * Any read error (a missing table before 0180 above all) is "not live", so the
 * checkout never breaks on it and shows no box (owner, 2026-11-26: shipped dark).
 */
export async function isWhatsAppLiveForStore(storeId: string): Promise<boolean> {
  try {
    return await readStoreLive(storeId);
  } catch {
    return false;
  }
}

async function readStoreLive(storeId: string): Promise<boolean> {
  const [row] = await db
    .select({
      enabled: whatsappSettings.enabled,
      storesDefaultOn: whatsappSettings.storesDefaultOn,
      globalEvents: whatsappSettings.eventsEnabled,
      storeEnabled: storeWhatsappSettings.enabled,
      storeEvents: storeWhatsappSettings.events,
    })
    .from(whatsappSettings)
    .leftJoin(storeWhatsappSettings, eq(storeWhatsappSettings.storeId, storeId))
    .where(eq(whatsappSettings.id, 1))
    .limit(1);
  if (!row?.enabled) return false;
  const storeOn = row.storeEnabled ?? row.storesDefaultOn;
  if (!storeOn) return false;
  const storeEvents = new Set((row.storeEvents ?? [...WHATSAPP_EVENTS]).filter(isWhatsAppEvent));
  return (row.globalEvents ?? []).some((event) => isWhatsAppEvent(event) && storeEvents.has(event));
}

/**
 * Saves the consent on the shopper's phone after the order was placed with
 * the box ticked. Best-effort: it never throws, and does nothing unless the
 * order is this store's and carries `metadata.whatsapp.optIn`. The phone comes
 * from the order's shipping address, never from the client.
 */
export async function recordWhatsAppConsent(input: { orderId: string; storeId: string }): Promise<boolean> {
  try {
    const [order] = await db
      .select({ phone: userAddresses.phone, consentVersion: sql<string | null>`${orders.metadata} -> 'whatsapp' ->> 'consentVersion'` })
      .from(orders)
      .innerJoin(userAddresses, and(eq(userAddresses.id, orders.shippingAddressId), eq(userAddresses.userId, orders.userId)))
      .where(
        and(
          eq(orders.id, input.orderId),
          eq(orders.storeId, input.storeId),
          sql`(${orders.metadata} -> 'whatsapp' ->> 'optIn') = 'true'`,
        ),
      )
      .limit(1);
    const phone = toWhatsAppPhone(order?.phone);
    if (!order || !phone) return false;
    const now = new Date().toISOString();
    const values = {
      optedInAt: now,
      optedOutAt: null,
      optInSource: "checkout",
      consentVersion: order.consentVersion || WHATSAPP_CONSENT_VERSION,
      lastStoreId: input.storeId,
      updatedAt: now,
    };
    await db
      .insert(whatsappContacts)
      .values({ phone, ...values })
      .onConflictDoUpdate({ target: whatsappContacts.phone, set: values });
    return true;
  } catch (error) {
    // No details: a database error can carry the phone.
    console.error("whatsapp: consent not saved", error instanceof Error ? error.name : "unknown");
    return false;
  }
}
