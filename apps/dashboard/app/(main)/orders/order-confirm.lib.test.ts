import { describe, expect, it } from "vitest";
import {
  ORDER_CONFIRM_DEFAULTS,
  UNCONFIRMED_AFTER_HOURS,
  parseOrderConfirmTemplate,
  renderOrderConfirmMessage,
  unconfirmedHours,
} from "./order-confirm.lib";

const order = {
  customerName: "منى",
  orderNumber: "1042",
  totalAmount: "355.5",
  lines: [
    { productName: "باور بانك", variantName: "أسود", quantity: 1 },
    { productName: "وصلة شاحن", variantName: null, quantity: 2 },
  ],
  address: { line: "12 شارع النصر", area: "مدينة نصر, القاهرة" },
};

describe("renderOrderConfirmMessage", () => {
  it("fills every placeholder of the Arabic default", () => {
    const text = renderOrderConfirmMessage(null, { order, storeName: "متجر سارة", locale: "ar" });
    expect(text).toContain("منى");
    expect(text).toContain("#1042");
    expect(text).toContain("• باور بانك (أسود) × 1");
    expect(text).toContain("• وصلة شاحن × 2");
    expect(text).toContain("355.50 ج.م");
    expect(text).toContain("12 شارع النصر، مدينة نصر, القاهرة");
    expect(text).toContain("متجر سارة");
    expect(text).not.toMatch(/\{\w+\}/);
  });

  it("uses the store's own template and English money", () => {
    const text = renderOrderConfirmMessage("Hi {name}, confirm #{number} for {total}? {unknown}", {
      order,
      storeName: "S",
      locale: "en",
    });
    expect(text).toBe("Hi منى, confirm #1042 for EGP 355.50? {unknown}");
  });

  it("falls back when the name or address is missing", () => {
    const text = renderOrderConfirmMessage("{name}|{address}", {
      order: { ...order, customerName: "", address: null },
      storeName: "S",
      locale: "en",
    });
    expect(text).toBe("there|—");
  });
});

describe("parseOrderConfirmTemplate", () => {
  it("reads a saved template and ignores anything else", () => {
    expect(parseOrderConfirmTemplate({ orderConfirm: { template: " Hi {name} " } })).toBe("Hi {name}");
    expect(parseOrderConfirmTemplate({ orderConfirm: { template: "" } })).toBeNull();
    expect(parseOrderConfirmTemplate({ orderConfirm: "x" })).toBeNull();
    expect(parseOrderConfirmTemplate(null)).toBeNull();
  });
});

describe("unconfirmedHours", () => {
  const now = Date.parse("2026-10-29T12:00:00Z");
  it("counts whole hours only for new orders past the limit", () => {
    expect(unconfirmedHours("new", "2026-10-28T10:00:00Z", now)).toBe(26);
    expect(unconfirmedHours("new", "2026-10-29T00:00:00Z", now)).toBeNull();
    expect(unconfirmedHours("to_ship", "2026-10-20T00:00:00Z", now)).toBeNull();
    expect(UNCONFIRMED_AFTER_HOURS).toBe(24);
  });
});

it("ships a default in both languages", () => {
  expect(Object.keys(ORDER_CONFIRM_DEFAULTS).sort()).toEqual(["ar", "en"]);
});

it("writes the order's own currency in the message", () => {
  const render = (locale: "ar" | "en", currency?: string | null) =>
    renderOrderConfirmMessage("{total}", { order: { ...order, currency }, storeName: "S", locale });
  expect(render("en", "SAR")).toBe("SAR 355.50");
  expect(render("ar", "SAR")).toBe("355.50 ر.س");
  expect(render("en", "AED")).toBe("AED 355.50");
  // An EGP order, or one with no currency, reads as it always did.
  expect(render("en", "EGP")).toBe("EGP 355.50");
  expect(render("ar", null)).toBe("355.50 ج.م");
});
