import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PickingDocument, type PrintT } from "./print-documents";
import type { PrintOrder } from "./print-orders.types";

const t = Object.assign((key: string, values?: Record<string, string | number>) => `${key}${values ? JSON.stringify(values) : ""}`, {
  has: () => false,
}) as PrintT;

const order = (orderNumber: string, quantity: number, storeName = "Nour Store"): PrintOrder => ({
  id: orderNumber,
  orderNumber,
  createdAt: "2026-10-30T09:00:00Z",
  sender: { name: storeName, logoUrl: null, website: null, phone: null, marketplace: false },
  customerName: `Customer ${orderNumber}`,
  customerPhone: null,
  address: null,
  notes: null,
  giftMessage: null,
  paymentMethod: "cod",
  paymentStatus: "pending",
  lines: [
    { id: `${orderNumber}-1`, productId: "p1", variantId: "v1", productName: "Shirt", variantName: "Red / M", sku: "SH-RM", quantity, price: "100.00", total: "100.00" },
  ],
  itemCount: quantity,
  wholeOrder: true,
  linesTotal: "100.00",
  subtotal: "100.00",
  shippingCost: "0",
  discountAmount: "0",
  totalAmount: "100.00",
  collect: "100.00",
});

describe("PickingDocument", () => {
  it("prints one row per item with the total and its orders", () => {
    const html = renderToStaticMarkup(createElement(PickingDocument, { orders: [order("TL-1", 2), order("TL-2", 1)], t, locale: "en" }));
    expect(html.slice(html.indexOf("<tbody>"), html.indexOf("</tbody>")).match(/<tr/g)).toHaveLength(1);
    expect(html).toContain("print.unitsCount{&quot;count&quot;:3}");
    expect(html).toContain('dir="ltr">#TL-1<');
    expect(html).toContain('dir="ltr">#TL-2<');
    expect(html).toContain("Nour Store");
  });

  it("leaves the sender out when the orders come from different stores", () => {
    const html = renderToStaticMarkup(createElement(PickingDocument, { orders: [order("TL-1", 1), order("TL-2", 1, "Other")], t, locale: "ar" }));
    expect(html).not.toContain("Nour Store");
  });
});
