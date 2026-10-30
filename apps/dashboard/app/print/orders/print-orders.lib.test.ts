import { describe, expect, it } from "vitest";
import {
  PRINT_MAX_ORDERS,
  amountToCollect,
  parsePrintDoc,
  parsePrintIds,
  parsePrintLocale,
  pickingList,
  printOrdersHref,
} from "./print-orders.lib";

const A = "0b6f1c2e-6a52-4c39-9a3f-2f1d3e4a5b6c";
const B = "1c7a2d3f-7b63-4d4a-8b4a-3a2e4f5b6c7d";

describe("parsePrintIds", () => {
  it("keeps valid UUIDs once, in order, lower-cased", () => {
    expect(parsePrintIds(`${A}, ${B.toUpperCase()},${A},nope,`)).toEqual([A, B]);
  });

  it("returns nothing for missing or bad input", () => {
    expect(parsePrintIds(undefined)).toEqual([]);
    expect(parsePrintIds("1 OR 1=1")).toEqual([]);
  });

  it("accepts a repeated param and caps the count", () => {
    expect(parsePrintIds([A, B])).toEqual([A, B]);
    const many = Array.from({ length: PRINT_MAX_ORDERS + 5 }, (_, i) =>
      `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    );
    expect(parsePrintIds(many.join(","))).toHaveLength(PRINT_MAX_ORDERS);
  });
});

describe("parsePrintDoc / parsePrintLocale", () => {
  it("defaults to the invoice and the fallback locale", () => {
    expect(parsePrintDoc("slip")).toBe("slip");
    expect(parsePrintDoc("picking")).toBe("picking");
    expect(parsePrintDoc("x")).toBe("invoice");
    expect(parsePrintLocale("en", "ar")).toBe("en");
    expect(parsePrintLocale("fr", "ar")).toBe("ar");
  });
});

describe("printOrdersHref", () => {
  it("builds the print URL", () => {
    expect(printOrdersHref("slip", [A, B])).toBe(`/print/orders?doc=slip&ids=${A}%2C${B}`);
    expect(printOrdersHref("invoice", [A], true)).toBe(`/print/orders?doc=invoice&ids=${A}&print=1`);
  });
});

describe("amountToCollect", () => {
  it("is the total for an unpaid cash order", () => {
    expect(amountToCollect({ paymentMethod: "cod", paymentStatus: "pending", totalAmount: "250.00" })).toBe("250.00");
    expect(amountToCollect({ paymentMethod: "cash_on_delivery", paymentStatus: null, totalAmount: "90.00" })).toBe("90.00");
  });

  it("is null once paid or for other methods", () => {
    expect(amountToCollect({ paymentMethod: "cod", paymentStatus: "collected", totalAmount: "250.00" })).toBeNull();
    expect(amountToCollect({ paymentMethod: "instapay", paymentStatus: "pending", totalAmount: "250.00" })).toBeNull();
    expect(amountToCollect({ paymentMethod: null, paymentStatus: null, totalAmount: "250.00" })).toBeNull();
  });
});

describe("pickingList", () => {
  const line = (productId: string | null, variantId: string | null, productName: string, variantName: string | null, quantity: number) => ({
    productId,
    variantId,
    productName,
    variantName,
    sku: null,
    quantity,
  });

  it("adds up the same product and variant across orders", () => {
    const rows = pickingList(
      [
        { orderNumber: "TL-1", lines: [line("p1", "v1", "Shirt", "Red / M", 2), line("p2", null, "Mug", null, 1)] },
        { orderNumber: "TL-2", lines: [line("p1", "v1", "Shirt", "Red / M", 1), line("p1", "v2", "Shirt", "Blue / L", 3)] },
        { orderNumber: "TL-3", lines: [line("p2", null, "Mug", null, 4)] },
      ],
      "en",
    );
    expect(rows.map((r) => [r.productName, r.variantName, r.quantity, r.orderNumbers])).toEqual([
      ["Mug", null, 5, ["TL-1", "TL-3"]],
      ["Shirt", "Blue / L", 3, ["TL-2"]],
      ["Shirt", "Red / M", 3, ["TL-1", "TL-2"]],
    ]);
  });

  it("lists an order once even when it has the item on two lines", () => {
    const rows = pickingList([{ orderNumber: "TL-9", lines: [line("p1", null, "Cap", null, 1), line("p1", null, "Cap", null, 2)] }], "ar");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ quantity: 3, orderNumbers: ["TL-9"] });
  });

  it("groups lines without a product id by name", () => {
    const rows = pickingList(
      [
        { orderNumber: "TL-1", lines: [line(null, null, "Old item", null, 1)] },
        { orderNumber: "TL-2", lines: [line(null, null, "Old item", null, 1), line(null, null, "Old item", "XL", 1)] },
      ],
      "en",
    );
    expect(rows.map((r) => [r.variantName, r.quantity])).toEqual([
      [null, 2],
      ["XL", 1],
    ]);
  });
});
