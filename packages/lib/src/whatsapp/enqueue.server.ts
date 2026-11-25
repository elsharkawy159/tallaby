/**
 * Queues one WhatsApp order message (docs/whatsapp.md §4 Flow, Gates). Backend
 * only. Every gate is checked here and again at send (dispatch.server.ts); a
 * failed gate writes nothing. The row's dedupe key (`order:<id>:<event>`)
 * makes a repeated call, from any code path, queue the event once.
 *
 * Off by default and quiet: with no env, the env check returns before any
 * database read; with the tables missing (0180 not applied) the settings read
 * fails once, is logged once per process (settings.server.ts), and the result
 * is "disabled".
 */
import { db, eq, orderItems, orders, shipments, sql, stores, whatsappContacts, whatsappMessages } from "@workspace/db";
import { customerCanConfirm } from "../orders/customer-order-actions.lib";
import { orderEventDedupeKey, type WhatsAppEvent } from "./events.lib";
import { getWhatsAppConfig } from "./graph.server";
import {
  formatWhatsAppTotal,
  readWhatsAppConsent,
  resolveWhatsAppLocale,
  whatsAppCarrierLabel,
  whatsAppGateFailure,
  type WhatsAppSkipReason,
} from "./order-message.lib";
import { toWhatsAppPhone } from "./phone.lib";
import { getStoreWhatsAppSettings, getWhatsAppSettings } from "./settings.server";
import { templateForEvent, type TemplateParams } from "./templates.lib";

export interface EnqueueOptions {
  /** The shopper confirmed or cancelled by WhatsApp button: no template (§2). */
  byCustomerButton?: boolean;
}

export type EnqueueResult =
  | { queued: true; id: string }
  | { queued: false; reason: WhatsAppSkipReason | "duplicate" | "error" };

function trimmed(value: string | null | undefined): string | null {
  const clean = value?.trim();
  return clean ? clean : null;
}

async function loadOrderForMessage(orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: {
      id: true,
      orderNumber: true,
      status: true,
      storeId: true,
      isTest: true,
      isDigitalOnly: true,
      depositStatus: true,
      metadata: true,
      totalAmount: true,
      currency: true,
    },
    with: {
      user: { columns: { fullName: true, phone: true } },
      userAddress_shippingAddressId: { columns: { fullName: true, phone: true } },
    },
  });
  if (!order) return null;
  const store = order.storeId
    ? ((
        await db
          .select({ id: stores.id, sellerId: stores.sellerId, name: stores.name, defaultLocale: stores.defaultLocale })
          .from(stores)
          .where(eq(stores.id, order.storeId))
          .limit(1)
      )[0] ?? null)
    : null;
  return { order, store };
}

/** Queues the message for an order event, or says which gate stopped it. Never throws. */
export async function enqueueOrderWhatsApp(
  orderId: string,
  event: WhatsAppEvent,
  opts: EnqueueOptions = {}
): Promise<EnqueueResult> {
  const configured = getWhatsAppConfig() !== null;
  if (!configured) return { queued: false, reason: "not_configured" };
  try {
    const settings = await getWhatsAppSettings();
    // The global gates first, so a disabled WhatsApp costs one settings read.
    if (!settings?.enabled) return { queued: false, reason: "disabled" };
    if (!settings.eventsEnabled.includes(event)) return { queued: false, reason: "event_disabled" };

    const loaded = await loadOrderForMessage(orderId);
    const order = loaded?.order ?? null;
    const store = loaded?.store ?? null;
    const storeSettings = store && settings ? await getStoreWhatsAppSettings(store.id, settings) : null;
    const consent = readWhatsAppConsent(order?.metadata);
    // Address phone first (user_addresses.phone is NOT NULL), as the dashboard shows it.
    const rawPhone = trimmed(order?.userAddress_shippingAddressId?.phone) ?? trimmed(order?.user?.phone);
    const phone = toWhatsAppPhone(rawPhone);
    const [contact] = phone
      ? await db
          .select({ optedInAt: whatsappContacts.optedInAt, optedOutAt: whatsappContacts.optedOutAt })
          .from(whatsappContacts)
          .where(eq(whatsappContacts.phone, phone))
          .limit(1)
      : [];

    const failed = whatsAppGateFailure({
      configured,
      settings,
      event,
      order: order ? { storeId: store?.id ?? null, isTest: order.isTest, status: order.status } : null,
      store: storeSettings,
      consent,
      phone,
      contact: contact ?? null,
      byCustomerButton: opts.byCustomerButton,
    });
    if (failed) return { queued: false, reason: failed };
    if (!order || !store || !phone) return { queued: false, reason: "order_not_found" };

    const locale = resolveWhatsAppLocale(consent.locale, store.defaultLocale);
    let templateStatus: string | null = order.status;
    let shipment: { carrier: string | null; trackingNumber: string | null; externalId: string | null } | null = null;
    if (event === "order_placed" || event === "order_shipped") {
      [shipment = null] = await db
        .select({ carrier: shipments.carrier, trackingNumber: shipments.trackingNumber, externalId: shipments.externalId })
        .from(shipments)
        .where(eq(shipments.orderId, order.id))
        .limit(1);
    }
    if (event === "order_placed" && order.status === "pending") {
      // Confirm/cancel buttons only when a tap could confirm the order; else the plain receipt.
      const [lines] = await db
        .select({ foreign: sql<number>`count(*) FILTER (WHERE ${orderItems.sellerId} IS DISTINCT FROM ${store.sellerId})::int` })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      const confirmable = customerCanConfirm({
        status: order.status,
        isTest: order.isTest,
        isDigitalOnly: order.isDigitalOnly,
        depositStatus: order.depositStatus,
        foreignLines: lines?.foreign ?? 0,
        carrierManaged: Boolean(shipment?.externalId),
      });
      if (!confirmable) templateStatus = "not_confirmable";
    }
    const template = templateForEvent(event, templateStatus);
    const customerName =
      trimmed(order.userAddress_shippingAddressId?.fullName) ?? trimmed(order.user?.fullName) ?? (locale === "ar" ? "عميلنا" : "there");
    const params: TemplateParams = {
      customer_name: customerName,
      store_name: store.name,
      order_number: order.orderNumber,
      total: formatWhatsAppTotal(order.totalAmount, order.currency, locale),
    };
    if (template.params.includes("carrier")) params.carrier = whatsAppCarrierLabel(shipment?.carrier, locale);
    if (template.params.includes("tracking_number")) params.tracking_number = trimmed(shipment?.trackingNumber) ?? "-";

    const [row] = await db
      .insert(whatsappMessages)
      .values({
        sellerId: store.sellerId,
        storeId: store.id,
        orderId: order.id,
        event,
        dedupeKey: orderEventDedupeKey(order.id, event),
        toPhone: phone,
        locale,
        kind: "template",
        templateName: template.name,
        templateLanguage: locale,
        payload: { params, buttons: template.buttons },
        // Free for now (D3): nothing is charged and no wallet is touched.
        priceUsdCents: 0,
      })
      .onConflictDoNothing({ target: whatsappMessages.dedupeKey })
      .returning({ id: whatsappMessages.id });
    return row ? { queued: true, id: row.id } : { queued: false, reason: "duplicate" };
  } catch (error) {
    console.error("[whatsapp] enqueue failed", orderId, event, (error as Error)?.name);
    return { queued: false, reason: "error" };
  }
}
