type OrderLike = {
  orderNumber?: string | null;
  status?: string | null;
  shipments?: Array<{ status?: string | null }> | null;
};

type OrderItemLike = {
  orderId?: string | null;
  status?: string | null;
  order?: OrderLike | null;
};

/** Customer-facing order reference — always prefer `order_number` over the UUID. */
export function getOrderDisplayNumber(item: OrderItemLike): string {
  return (
    item.order?.orderNumber ??
    item.orderId?.slice(0, 8) ??
    "—"
  );
}

/**
 * Fulfillment status for vendor views. Shipment status is the source of truth
 * once a courier record exists; otherwise fall back to the order, then the line item.
 */
export function resolveVendorOrderStatus(item: OrderItemLike): string {
  const shipmentStatus = item.order?.shipments?.[0]?.status;
  if (shipmentStatus) {
    return shipmentStatus;
  }

  if (item.order?.status) {
    return item.order.status;
  }

  return item.status ?? "pending";
}
