import { describe, expect, it } from "vitest";
import {
  ORDER_CONFIRM_DEFAULTS,
  ORDER_CONFIRM_PLACEHOLDERS,
  UNCONFIRMED_AFTER_HOURS,
  parseOrderConfirmTemplate,
  renderOrderConfirmMessage,
  renderOrderDetailsMessage,
  unconfirmedHours,
} from "./order-confirm.lib";

const order = {
  customerName: "منى",
  orderNumber: "1042",
  subtotal: "330.5",
  shippingCost: "25",
  discountAmount: "0",
  totalAmount: "355.5",
  lines: [
    { productName: "باور بانك", variantName: "أسود", quantity: 1 },
    { productName: "وصلة شاحن", variantName: null, quantity: 2 },
  ],
  address: { line: "12 شارع النصر", area: "مدينة نصر, القاهرة" },
};

describe("renderOrderConfirmMessage", () => {
  it("renders the owner's Arabic sample exactly", () => {
    const text = renderOrderConfirmMessage(null, {
      order: {
        customerName: "  Tamer Sarhan ",
        orderNumber: "ORD-261001-5D1B72",
        subtotal: "1750",
        shippingCost: "75",
        discountAmount: "0",
        totalAmount: "1825",
        currency: "EGP",
        lines: [{ productName: "سماعة أذن لاسلكية ساوندكور R60i NC", variantName: "أسود - بدون ضمان", quantity: 1 }],
        address: { line: "", area: "منيا القمح , الشرقية" },
      },
      storeName: "FASTER",
      locale: "ar",
    });
    expect(text).toBe(
      [
        "*FASTER*",
        "",
        "مرحباً *Tamer Sarhan*",
        "",
        "تفاصيل طلبك رقم #ORD-261001-5D1B72",
        "",
        "المنتجات المطلوبة:",
        "- سماعة أذن لاسلكية ساوندكور R60i NC - أسود - بدون ضمان x1",
        "",
        "*ملخص الفاتورة:*",
        "المجموع الفرعي: 1750.00 EGP",
        "رسوم التوصيل: 75.00 EGP",
        "الإجمالي: *1825.00 EGP*",
        "",
        "*عنوان التوصيل:*",
        "منيا القمح , الشرقية",
        "",
        "من فضلك أكد الطلب بالرد بكلمة *نعم*",
      ].join("\n"),
    );
  });

  it("fills every placeholder of both defaults", () => {
    for (const locale of ["ar", "en"] as const) {
      const text = renderOrderConfirmMessage(null, { order, storeName: "متجر سارة", locale });
      expect(text).not.toMatch(/\{\w+\}/);
      expect(text).toContain("- باور بانك - أسود x1");
      expect(text).toContain("- وصلة شاحن x2");
      expect(text).toContain("12 شارع النصر , مدينة نصر, القاهرة");
    }
    const en = renderOrderConfirmMessage(null, { order, storeName: "S", locale: "en" });
    expect(en).toContain("Subtotal: 330.50 EGP\nDelivery fee: 25.00 EGP\nTotal: *355.50 EGP*");
    expect(en.endsWith("Please confirm the order by replying *Yes*")).toBe(true);
  });

  it("adds a discount line only when there is a discount", () => {
    const withDiscount = renderOrderConfirmMessage(null, {
      order: { ...order, subtotal: "380.5", discountAmount: "50" },
      storeName: "S",
      locale: "ar",
    });
    expect(withDiscount).toContain("رسوم التوصيل: 25.00 EGP\nالخصم: -50.00 EGP\nالإجمالي: *355.50 EGP*");
    const en = renderOrderConfirmMessage(null, { order: { ...order, discountAmount: "50" }, storeName: "S", locale: "en" });
    expect(en).toContain("Delivery fee: 25.00 EGP\nDiscount: -50.00 EGP\nTotal:");
    const none = renderOrderConfirmMessage(null, { order, storeName: "S", locale: "ar" });
    expect(none).not.toContain("الخصم");
    expect(none).toContain("رسوم التوصيل: 25.00 EGP\nالإجمالي:");
  });

  it("lists every placeholder of the default", () => {
    for (const key of ORDER_CONFIRM_PLACEHOLDERS) expect(ORDER_CONFIRM_DEFAULTS.ar).toContain(`{${key}}`);
  });

  it("uses the store's own template and English money", () => {
    const text = renderOrderConfirmMessage("Hi {name}, confirm #{number} for {total}? {unknown}", {
      order,
      storeName: "S",
      locale: "en",
    });
    expect(text).toBe("Hi منى, confirm #1042 for 355.50 EGP? {unknown}");
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

it("writes the order's own currency code in the message", () => {
  const render = (locale: "ar" | "en", currency?: string | null) =>
    renderOrderConfirmMessage("{total}", { order: { ...order, currency }, storeName: "S", locale });
  expect(render("en", "SAR")).toBe("355.50 SAR");
  expect(render("ar", "SAR")).toBe("355.50 SAR");
  expect(render("en", "AED")).toBe("355.50 AED");
  // An order with no currency is in EGP.
  expect(render("en", "EGP")).toBe("355.50 EGP");
  expect(render("ar", null)).toBe("355.50 EGP");
});

describe("renderOrderDetailsMessage", () => {
  it("is the default without the confirm request", () => {
    for (const locale of ["ar", "en"] as const) {
      const details = renderOrderDetailsMessage({ order, storeName: "S", locale });
      const confirm = renderOrderConfirmMessage(null, { order, storeName: "S", locale });
      expect(confirm.startsWith(`${details}\n\n`)).toBe(true);
      expect(details).not.toMatch(/نعم|Yes/);
      expect(details.endsWith("12 شارع النصر , مدينة نصر, القاهرة")).toBe(true);
    }
  });

  it("drops the variant part when a line has none", () => {
    const text = renderOrderDetailsMessage({
      order: { ...order, lines: [{ productName: "كابل", variantName: null, quantity: 3 }] },
      storeName: "S",
      locale: "ar",
    });
    expect(text).toContain("المنتجات المطلوبة:\n- كابل x3\n");
  });
});
