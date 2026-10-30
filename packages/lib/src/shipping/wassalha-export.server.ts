import { and, db, eq, inArray, sql, orders, shipments } from "@workspace/db";
import { getStoreWassalha } from "../integrations/wassalha.server";
import { wassalhaSheetDefaults } from "../integrations/wassalha.lib";
import {
  EGYPT_POST_COLUMNS,
  itemsWeightKg,
  toEgyptPostRows,
  type EgyptPostOrderInput,
  type EgyptPostRow,
} from "./egypt-post.lib";

/**
 * Store orders → Wassalha (Egypt Post) upload sheet (ROADMAP.md F-12c).
 * Server-only. The store must be the seller's and have Wassalha set up; only
 * that store's orders that are still waiting to ship are exported. Each
 * exported order gets (or keeps) a `shipments` row with carrier 'wassalha',
 * so the order shows "Sent to Wassalha" and no other carrier takes it by
 * mistake. The seller then moves it to shipped / delivered by hand, like
 * their own delivery (no API, so no automatic updates).
 */

const CARRIER = "wassalha";
const MAX_ORDERS = 500;

/** Orders in these stages can still be handed to a carrier. */
const EXPORTABLE_STATUSES = ["pending", "confirmed", "shipping_soon"] as const;

export type WassalhaSkipReason = "not_found" | "not_ready" | "other_carrier" | "bad_phone" | "bad_governorate";

export type WassalhaExportIssue = { orderId: string; orderNumber: string; reason: WassalhaSkipReason };

export type WassalhaExportResult =
  | {
      success: true;
      data: {
        header: readonly string[];
        rows: EgyptPostRow[];
        exportedOrderIds: string[];
        /** Orders left out: not this store's, not ready to ship, another carrier, or a bad phone / governorate. */
        skipped: WassalhaExportIssue[];
      };
    }
  | { success: false; error: "not_set_up" | "no_orders" | "too_many" };

export async function exportWassalhaOrders(sellerId: string, storeId: string, orderIds: string[]): Promise<WassalhaExportResult> {
  const ids = [...new Set(orderIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id)))];
  if (ids.length === 0) return { success: false, error: "no_orders" };
  if (ids.length > MAX_ORDERS) return { success: false, error: "too_many" };

  const account = await getStoreWassalha(sellerId, storeId);
  if (!account) return { success: false, error: "not_set_up" };

  const found = await db.query.orders.findMany({
    where: and(inArray(orders.id, ids), eq(orders.storeId, storeId)),
    with: {
      user: { columns: { fullName: true, phone: true } },
      userAddress_shippingAddressId: true,
      orderItems: { with: { product: { columns: { dimensions: true } } } },
      shipments: true,
    },
  });

  const skipped: WassalhaExportIssue[] = ids
    .filter((id) => !found.some((o) => o.id === id))
    .map((id) => ({ orderId: id, orderNumber: "", reason: "not_found" }));
  const inputs: EgyptPostOrderInput[] = [];

  for (const order of found) {
    const orderNumber = String(order.orderNumber);
    if (!(EXPORTABLE_STATUSES as readonly string[]).includes(order.status ?? "")) {
      skipped.push({ orderId: order.id, orderNumber, reason: "not_ready" });
      continue;
    }
    const shipment = order.shipments[0];
    if (shipment && !canTakeShipment(shipment, sellerId)) {
      skipped.push({ orderId: order.id, orderNumber, reason: "other_carrier" });
      continue;
    }
    const address = order.userAddress_shippingAddressId;
    const weight =
      (shipment?.packageWeight ? Number(shipment.packageWeight) : null) ??
      itemsWeightKg(
        order.orderItems.map((i) => {
          const d = (i.product?.dimensions ?? {}) as Record<string, unknown>;
          return { quantity: i.quantity ?? 1, weight: d.weight, weightUnit: d.weightUnit };
        }),
      );
    inputs.push({
      orderId: order.id,
      orderNumber,
      orderNotes: order.notes,
      totalAmount: Number(order.totalAmount),
      paymentStatus: order.paymentStatus,
      packageWeightKg: weight,
      customerName: address?.fullName ?? order.user?.fullName ?? null,
      phone: address?.phone ?? null,
      fallbackPhone: order.user?.phone ?? null,
      addressLine1: [address?.addressLine1, address?.city].filter(Boolean).join("، "),
      addressLine2: address?.addressLine2 ?? null,
      governorate: address?.state ?? null,
      city: address?.city ?? null,
      deliveryInstructions: address?.deliveryInstructions ?? null,
      items: order.orderItems.map((i) => ({
        productName: i.variantName ? `${i.productName} (${i.variantName})` : i.productName,
        quantity: i.quantity ?? 1,
      })),
      sellerNames: [],
    });
  }

  const { rows, errors } = toEgyptPostRows(inputs, wassalhaSheetDefaults(account.settings));
  skipped.push(...errors.map((e) => ({ orderId: e.orderId, orderNumber: e.orderNumber, reason: e.code })));
  const exported = inputs.filter((i) => !errors.some((e) => e.orderId === i.orderId)).map((i) => i.orderId);

  // Mark the exported orders. A shipment that moved on meanwhile is left as it is.
  for (const orderId of exported) {
    await db
      .insert(shipments)
      .values({ orderId, sellerId, carrier: CARRIER, status: "pending", storeIntegrationId: account.integrationId, updatedAt: sql`now()` })
      .onConflictDoUpdate({
        target: shipments.orderId,
        set: { carrier: CARRIER, storeIntegrationId: account.integrationId, updatedAt: sql`now()` },
        setWhere: sql`${shipments.externalId} IS NULL
          AND ${shipments.status} = 'pending'
          AND ${shipments.sellerId} = ${sellerId}
          AND ${shipments.riderId} IS NULL
          AND ${shipments.carrier} IN ('seller', ${CARRIER})`,
      });
  }

  return { success: true, data: { header: EGYPT_POST_COLUMNS, rows, exportedOrderIds: exported, skipped } };
}

/** The seller's own pending shipment (no rider, no carrier delivery yet), or one already sent to Wassalha. */
function canTakeShipment(
  shipment: { carrier: string | null; externalId: string | null; riderId: string | null; status: string | null; sellerId: string | null },
  sellerId: string,
): boolean {
  return (
    shipment.sellerId === sellerId &&
    shipment.status === "pending" &&
    !shipment.externalId &&
    !shipment.riderId &&
    (shipment.carrier === "seller" || shipment.carrier === CARRIER)
  );
}
