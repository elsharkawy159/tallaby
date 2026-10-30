import { amountToCollect } from "@/app/print/orders/print-orders.lib";
import type { SellerOrderStage } from "./order-flow.lib";
import type { SellerOrderRow } from "./orders.types";

/** Columns of the orders .xlsx export (ROADMAP.md F-04b), in sheet order. */
export const ORDER_EXPORT_COLUMNS = [
  "orderNumber",
  "date",
  "channel",
  "stage",
  "customer",
  "phone",
  "email",
  "address",
  "area",
  "items",
  "quantity",
  "itemsTotal",
  "shipping",
  "discount",
  "total",
  "paymentMethod",
  "paymentStatus",
  "collect",
  "tracking",
  "notes",
] as const;
export type OrderExportColumn = (typeof ORDER_EXPORT_COLUMNS)[number];

/** Translated values, so the sheet reads in the dashboard's language. */
export interface OrderExportLabels {
  marketplace: string;
  stage: (stage: SellerOrderStage) => string;
  paymentMethod: (method: string) => string;
  paymentStatus: (status: string) => string;
}

/** `2026-10-30 14:05` in Cairo time, so the sheet sorts as text too. */
const cairoStamp = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
};

const toPiastres = (value: string | null | undefined) => Math.round((Number(value) || 0) * 100);
/** EGP as a number, so the sheet can sum it. */
const egp = (value: string | null | undefined) => toPiastres(value) / 100;

/**
 * One order as a sheet row. Items and their total are this seller's lines only;
 * shipping, discount and total are the whole order, as the order panel shows them.
 */
export function orderExportRow(
  order: SellerOrderRow,
  labels: OrderExportLabels,
): Record<OrderExportColumn, string | number> {
  const collect = amountToCollect({
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
  });
  return {
    orderNumber: order.orderNumber,
    date: cairoStamp(order.createdAt),
    channel: order.storeName ?? labels.marketplace,
    stage: labels.stage(order.flow.stage),
    customer: order.address?.fullName || order.customerName,
    // Text, so Excel keeps the leading 0.
    phone: order.address?.phone || order.customerPhone || "",
    email: order.customerEmail ?? "",
    address: order.address?.line ?? "",
    area: order.address?.area ?? "",
    items: order.lines
      .map((l) => `${l.productName}${l.variantName ? ` (${l.variantName})` : ""} × ${l.quantity}`)
      .join(" | "),
    quantity: order.itemCount,
    itemsTotal: order.lines.reduce((sum, l) => sum + toPiastres(l.total), 0) / 100,
    shipping: egp(order.shippingCost),
    discount: egp(order.discountAmount),
    total: egp(order.totalAmount),
    paymentMethod: order.paymentMethod ? labels.paymentMethod(order.paymentMethod) : "",
    paymentStatus: order.paymentStatus ? labels.paymentStatus(order.paymentStatus) : "",
    collect: collect === null ? 0 : egp(collect),
    tracking: order.bosta?.trackingNumber ?? "",
    notes: order.notes ?? "",
  };
}
