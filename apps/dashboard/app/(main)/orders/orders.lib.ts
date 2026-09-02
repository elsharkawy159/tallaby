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

/**
 * Minimal shape shared by the orders list query and `getOrderDetails` — both
 * carry the customer and the shipping address on the order.
 */
export type OrderCustomerSource =
  | {
      user?: {
        email?: string | null;
        fullName?: string | null;
        phone?: string | null;
        isGuest?: boolean | null;
      } | null;
      userAddress_shippingAddressId?: {
        fullName?: string | null;
        phone?: string | null;
      } | null;
    }
  | null
  | undefined;

/** Guest checkouts get a synthetic `guest_<uuid>@temp.local` address — never show it. */
export function isGuestEmail(email: string | null | undefined): boolean {
  return Boolean(email?.includes("@temp.local"));
}

const trimmed = (value: string | null | undefined) => value?.trim() || null;

/**
 * Guests are real `users` rows with a `"Guest User"` placeholder name, so the
 * shipping address is the first and most reliable source of a real name.
 * Mirrors the chain used by the shipping admin (`orders/[orderId]/order-detail.data.tsx`).
 */
export function resolveCustomerName(order: OrderCustomerSource): string {
  return (
    trimmed(order?.userAddress_shippingAddressId?.fullName) ??
    trimmed(order?.user?.fullName) ??
    trimmed(resolveCustomerEmail(order)) ??
    "Guest"
  );
}

/** Address phone first — `user_addresses.phone` is NOT NULL, `users.phone` is not. */
export function resolveCustomerPhone(order: OrderCustomerSource): string | null {
  return (
    trimmed(order?.userAddress_shippingAddressId?.phone) ??
    trimmed(order?.user?.phone)
  );
}

/** Null for guests, so a `guest_<uuid>@temp.local` address never reaches the UI. */
export function resolveCustomerEmail(order: OrderCustomerSource): string | null {
  const email = trimmed(order?.user?.email);
  return email && !isGuestEmail(email) ? email : null;
}

export function formatOrderStatus(status: string) {
  return status.replace(/_/g, " ").replace(/^\w/, (m) => m.toUpperCase());
}

export function orderStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "pending":
    case "payment_processing":
      return "secondary";
    case "assigned":
    case "confirmed":
    case "shipping_soon":
    case "shipped":
    case "out_for_delivery":
      return "outline";
    case "delivered":
      return "default";
    case "failed":
    case "cancelled":
    case "refund_requested":
    case "refunded":
      return "destructive";
    case "returned":
      return "secondary";
    default:
      return "outline";
  }
}

/** Prefers the English translation, falls back to Arabic. */
export function pickProductSlug(
  translations: Array<{ locale: string; slug?: string | null }> | null | undefined
): string | null {
  const list = translations ?? [];
  const en = list.find((t) => t.locale === "en")?.slug;
  const ar = list.find((t) => t.locale === "ar")?.slug;
  return trimmed(en) ?? trimmed(ar);
}
