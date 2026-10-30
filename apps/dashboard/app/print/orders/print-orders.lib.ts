import { isPaymentSettled } from "@/app/(main)/orders/order-flow.lib";

/** The two printouts (ROADMAP.md F-04a): an A4 invoice and an A6 packing slip. */
export const PRINT_DOCS = ["invoice", "slip"] as const;
export type PrintDoc = (typeof PRINT_DOCS)[number];

/** Most orders in one print job; also keeps the URL short. */
export const PRINT_MAX_ORDERS = 50;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COD_METHODS = new Set(["cod", "cash_on_delivery"]);

export function parsePrintDoc(value: unknown): PrintDoc {
  return value === "slip" ? "slip" : "invoice";
}

export function parsePrintLocale(value: unknown, fallback: "ar" | "en"): "ar" | "en" {
  return value === "ar" || value === "en" ? value : fallback;
}

/** `ids=a,b,c` → unique, valid UUIDs in the given order, at most PRINT_MAX_ORDERS. */
export function parsePrintIds(value: unknown): string[] {
  const raw = Array.isArray(value) ? value.join(",") : typeof value === "string" ? value : "";
  const ids = raw
    .split(",")
    .map((id) => id.trim().toLowerCase())
    .filter((id) => UUID.test(id));
  return [...new Set(ids)].slice(0, PRINT_MAX_ORDERS);
}

/** The print page URL for these orders; `autoPrint` opens the print dialog on load. */
export function printOrdersHref(doc: PrintDoc, ids: readonly string[], autoPrint = false): string {
  const params = new URLSearchParams({ doc, ids: ids.slice(0, PRINT_MAX_ORDERS).join(",") });
  if (autoPrint) params.set("print", "1");
  return `/print/orders?${params.toString()}`;
}

/**
 * What the courier collects at the door: the order total for an unpaid cash
 * order, else null (paid, or paid another way such as InstaPay).
 */
export function amountToCollect(order: {
  paymentMethod: string | null;
  paymentStatus: string | null;
  totalAmount: string;
}): string | null {
  if (!order.paymentMethod || !COD_METHODS.has(order.paymentMethod)) return null;
  if (isPaymentSettled(order.paymentStatus)) return null;
  return order.totalAmount;
}
