import { and, asc, db, eq, inArray, orders, shipmentCarrierEvents, shipments } from "@workspace/db";
import { getStoreBostaAccount } from "../integrations/bosta.server";
import {
  BOSTA_AWB_INLINE_MAX,
  printBostaAwbs,
  terminateBostaDelivery,
  type BostaAwbType,
  type BostaCallOptions,
} from "./bosta/bosta.client.server";
import type { BostaErrorReason } from "./bosta/bosta-errors.lib";
import { canCancelBostaState } from "./bosta/bosta-states.lib";
import { applyBostaState } from "./bosta-sync.server";

/**
 * Order-page actions on Bosta shipments (docs/superpowers/plans/2026-10-26-bosta-shipping.md
 * §3.3, BS-12): the status timeline, cancelling before pickup and printing
 * labels. The caller has checked the session seller owns `storeId`; every
 * query here also scopes to that store's orders and that seller's shipments.
 */

/** This store's Bosta shipments for these orders. Storefront orders hold one seller's lines only. */
async function storeShipments(storeId: string, sellerId: string, orderIds: string[]) {
  if (orderIds.length === 0) return [];
  return db
    .select({
      id: shipments.id,
      orderId: shipments.orderId,
      sellerId: shipments.sellerId,
      status: shipments.status,
      externalId: shipments.externalId,
      externalStateCode: shipments.externalStateCode,
      trackingNumber: shipments.trackingNumber,
    })
    .from(shipments)
    .innerJoin(orders, eq(orders.id, shipments.orderId))
    .where(
      and(
        inArray(shipments.orderId, orderIds),
        eq(orders.storeId, storeId),
        eq(shipments.sellerId, sellerId),
        eq(shipments.carrier, "bosta"),
      ),
    );
}

export type BostaTimelineEvent = {
  stateCode: number;
  stateText: string | null;
  exceptionReason: string | null;
  occurredAt: string;
};

/** The Bosta status history of one order, oldest first. */
export async function listBostaTimeline(sellerId: string, storeId: string, orderId: string): Promise<BostaTimelineEvent[] | null> {
  const [shipment] = await storeShipments(storeId, sellerId, [orderId]);
  if (!shipment) return null;
  return db
    .select({
      stateCode: shipmentCarrierEvents.stateCode,
      stateText: shipmentCarrierEvents.stateText,
      exceptionReason: shipmentCarrierEvents.exceptionReason,
      occurredAt: shipmentCarrierEvents.occurredAt,
    })
    .from(shipmentCarrierEvents)
    .where(eq(shipmentCarrierEvents.shipmentId, shipment.id))
    .orderBy(asc(shipmentCarrierEvents.occurredAt))
    .limit(100);
}

export type CancelBostaError = "not_connected" | "not_found" | "full_access_required" | "picked_up" | BostaErrorReason;

/**
 * Cancels the Bosta delivery before pickup (states 10/11/20). Needs the
 * seller's "my key has Full access" setting, since Bosta only allows
 * `terminate` with Full access. The shipment goes back to `pending`, so the
 * seller can cancel the order, ship it again or deliver it.
 */
export async function cancelBostaShipment(
  sellerId: string,
  storeId: string,
  orderId: string,
  options: BostaCallOptions = {},
): Promise<{ ok: true } | { ok: false; error: CancelBostaError; message?: string }> {
  const account = await getStoreBostaAccount(storeId);
  if (!account || account.sellerId !== sellerId) return { ok: false, error: "not_connected" };
  if (!account.settings.canCancel) return { ok: false, error: "full_access_required" };
  const [shipment] = await storeShipments(storeId, sellerId, [orderId]);
  if (!shipment?.externalId || !shipment.trackingNumber || !shipment.sellerId) return { ok: false, error: "not_found" };
  if (shipment.externalStateCode != null && !canCancelBostaState(shipment.externalStateCode)) return { ok: false, error: "picked_up" };

  const result = await terminateBostaDelivery(account.apiKey, shipment.trackingNumber, options);
  if (!result.ok) {
    return {
      ok: false,
      error: result.error.reason === "forbidden" ? "full_access_required" : result.error.reason,
      message: result.error.message,
    };
  }
  await applyBostaState(
    { id: shipment.id, orderId: shipment.orderId, sellerId: shipment.sellerId, status: shipment.status, externalStateCode: shipment.externalStateCode },
    { code: 49, text: "Cancelled from Tallaby", occurredAt: new Date().toISOString(), payload: { source: "tallaby_cancel" } },
  );
  return { ok: true };
}

export type BostaLabelsError = "not_connected" | "not_found" | "too_many" | BostaErrorReason;

/** One PDF (base64) with the labels of these orders' Bosta shipments, at most 50. */
export async function getBostaLabels(
  sellerId: string,
  storeId: string,
  orderIds: string[],
  format: { type: BostaAwbType; lang: "ar" | "en" },
  options: BostaCallOptions = {},
): Promise<{ ok: true; pdfBase64: string; count: number } | { ok: false; error: BostaLabelsError; message?: string }> {
  const unique = [...new Set(orderIds)];
  if (unique.length > BOSTA_AWB_INLINE_MAX) return { ok: false, error: "too_many" };
  const account = await getStoreBostaAccount(storeId);
  if (!account || account.sellerId !== sellerId) return { ok: false, error: "not_connected" };

  const rows = (await storeShipments(storeId, sellerId, unique)).filter((row) => row.trackingNumber);
  if (rows.length === 0) return { ok: false, error: "not_found" };
  const pdf = await printBostaAwbs(account.apiKey, rows.map((row) => row.trackingNumber!), format, options);
  return pdf.ok ? { ok: true, pdfBase64: pdf.data, count: rows.length } : { ok: false, error: pdf.error.reason, message: pdf.error.message };
}

