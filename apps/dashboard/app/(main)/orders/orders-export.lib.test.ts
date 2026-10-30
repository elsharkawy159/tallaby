import { describe, expect, it } from "vitest";
import type { SellerOrderFlow } from "./order-flow.lib";
import { ORDER_EXPORT_COLUMNS, orderExportRow, type OrderExportLabels } from "./orders-export.lib";
import type { SellerOrderRow } from "./orders.types";

const labels: OrderExportLabels = {
  marketplace: "Tallaby marketplace",
  stage: (stage) => `stage:${stage}`,
  paymentMethod: (method) => `pm:${method}`,
  paymentStatus: (status) => `ps:${status}`,
};

const line = (id: string, total: string, quantity = 1) => ({
  id,
  productName: `Product ${id}`,
  variantName: null,
  sku: null,
  quantity,
  price: total,
  total,
  image: null,
  productUrl: null,
});

const order = (patch: Partial<SellerOrderRow> = {}): SellerOrderRow =>
  ({
    id: "o1",
    orderNumber: "TL-1042",
    createdAt: "2026-10-30T10:05:00.000Z",
    storeId: "s1",
    storeName: "Nest",
    customerName: "Mona Adel",
    customerPhone: "01001234567",
    customerEmail: null,
    address: null,
    notes: null,
    paymentMethod: "cod",
    paymentStatus: "pending",
    subtotal: "300.00",
    shippingCost: "50.00",
    discountAmount: "0.00",
    totalAmount: "350.00",
    lines: [line("a", "100.10", 2), line("b", "199.90")],
    itemCount: 3,
    bosta: null,
    flow: { stage: "new", primary: null, actions: [], readOnly: null, prepaid: false, carrierManaged: false } as SellerOrderFlow,
    ...patch,
  }) as SellerOrderRow;

describe("orders export", () => {
  it("fills every column", () => {
    expect(Object.keys(orderExportRow(order(), labels))).toEqual([...ORDER_EXPORT_COLUMNS]);
  });

  it("writes Cairo time, labels, money as numbers and the phone as text", () => {
    const row = orderExportRow(order(), labels);
    expect(row).toMatchObject({
      date: "2026-10-30 12:05",
      channel: "Nest",
      stage: "stage:new",
      phone: "01001234567",
      items: "Product a × 2 | Product b × 1",
      quantity: 3,
      itemsTotal: 300,
      shipping: 50,
      total: 350,
      paymentMethod: "pm:cod",
      paymentStatus: "ps:pending",
      collect: 350,
    });
  });

  it("collects nothing once paid or not cash on delivery", () => {
    expect(orderExportRow(order({ paymentStatus: "collected" }), labels).collect).toBe(0);
    expect(orderExportRow(order({ paymentMethod: "instapay" }), labels).collect).toBe(0);
  });

  it("prefers the shipping address and names marketplace orders", () => {
    const row = orderExportRow(
      order({
        storeId: null,
        storeName: null,
        address: {
          fullName: "Mona A.",
          phone: "01112223334",
          line: "12 Tahrir St",
          area: "Cairo",
          country: "EG",
          instructions: null,
          latitude: null,
          longitude: null,
        },
      }),
      labels,
    );
    expect(row).toMatchObject({
      channel: "Tallaby marketplace",
      customer: "Mona A.",
      phone: "01112223334",
      address: "12 Tahrir St",
      area: "Cairo",
    });
  });
});
