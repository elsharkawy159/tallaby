import { describe, expect, it } from "vitest";

import {
  buildParsedImportFromScrape,
  detectImportFormat,
  extractProductUrls,
  parseProductImport,
  parseProductImportJson,
  parseProductImportText,
} from "./parse-product-import.lib";

const FAN_JSON = JSON.stringify({
  version: "1",
  localized: {
    en: {
      title: "Jsdoin Portable Handheld Fan, 5 Speeds, LED Display",
      description: "Portable Jsdoin fan with 5 speeds.",
      bulletPoints: ["5 Wind Speeds", "5000mAh Battery"],
    },
    ar: {
      title: "مروحة Jsdoin محمولة",
      description: "مروحة محمولة بـ5 سرعات.",
      bulletPoints: ["5 سرعات للهواء", "بطارية 5000mAh"],
    },
  },
  price: { list: 300, final: 150 },
  sku: "PROD_132",
  quantity: 17,
  variantTypes: [
    {
      localized: {
        en: { name: "Color", values: ["Red", "Blue", "Black"] },
        ar: { name: "اللون", values: ["أحمر", "أزرق", "أسود"] },
      },
    },
  ],
});

const FAN_TEXT = `
[Product Name]
EN: Jsdoin Portable Handheld Fan, 5 Speeds, LED Display
AR: مروحة Jsdoin محمولة قابلة للطي بـ5 سرعات وشاشة LED

[Product Description]
EN: Portable Jsdoin fan with 5 speeds.
AR: مروحة Jsdoin محمولة وقابلة للطي.

[Bullet Points]
EN:
- 5 Wind Speeds: Adjust the airflow.
- 5000mAh Battery: Built-in rechargeable battery.
AR:
- 5 سرعات للهواء: تحكم في قوة الهواء.
- بطارية 5000mAh: بطارية مدمجة.

[Pricing]
List Price: 300
Final Price: 150

[Inventory]
SKU: PROD_132
Quantity: 17

[Variants]
Color EN: Red, Blue, Black
Color AR: أحمر, أزرق, أسود
`;

const FAN_EMOJI_TEXT = `
Product Name
🇬🇧 English
Jsdoin Portable Handheld Fan
🇪🇬 Arabic
مروحة Jsdoin محمولة

Product Description
🇬🇧 English
Portable fan with 5 speeds.
🇪🇬 Arabic
مروحة محمولة بـ5 سرعات.

Bullet Points & Attributes
🇬🇧 English
- 5 Wind Speeds: Adjust airflow.
🇪🇬 Arabic
- 5 سرعات للهواء: تحكم في الهواء.

Product Price: 300
Final Price: 150
SKU: PROD_132
Quantity: 17
Product Variants:
Color: Red, Blue, Black
`;

describe("extractProductUrls", () => {
  it("extracts unique http(s) URLs one per line", () => {
    const input = `
https://amazon.eg/dp/A1
https://amazon.eg/dp/B2
not-a-url
https://amazon.eg/dp/A1
http://example.com/c
`;
    expect(extractProductUrls(input)).toEqual([
      "https://amazon.eg/dp/A1",
      "https://amazon.eg/dp/B2",
      "http://example.com/c",
    ]);
  });
});

describe("detectImportFormat", () => {
  it("detects URLs", () => {
    expect(detectImportFormat("https://amazon.com/product")).toBe("url");
    expect(detectImportFormat("http://example.com")).toBe("url");
  });

  it("detects url_bulk for multi-line URLs", () => {
    const multi = [
      "https://amazon.eg/dp/A1",
      "https://amazon.eg/dp/B2",
      "https://chromewebstore.google.com/detail/x",
    ].join("\n");
    expect(detectImportFormat(multi)).toBe("url_bulk");
  });

  it("detects JSON", () => {
    expect(detectImportFormat('{"title": "Test"}')).toBe("json");
  });

  it("detects text format", () => {
    expect(detectImportFormat(FAN_TEXT)).toBe("text");
    expect(detectImportFormat(FAN_EMOJI_TEXT)).toBe("text");
  });

  it("returns unknown for empty or random text", () => {
    expect(detectImportFormat("")).toBe("unknown");
    expect(detectImportFormat("hello world")).toBe("unknown");
  });
});

describe("parseProductImportJson", () => {
  it("parses full fan JSON", () => {
    const result = parseProductImportJson(FAN_JSON);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.localized?.en?.title).toContain("Jsdoin");
    expect(result.data.localized?.ar?.title).toContain("مروحة");
    expect(result.data.price?.list).toBe(300);
    expect(result.data.price?.final).toBe(150);
    expect(result.data.sku).toBe("PROD_132");
    expect(result.data.quantity).toBe(17);
    expect(result.data.variantTypes).toHaveLength(1);
    expect(result.data.variantTypes?.[0]?.localized.en.values).toEqual([
      "Red",
      "Blue",
      "Black",
    ]);
  });

  it("fails when EN title is missing", () => {
    const result = parseProductImportJson(
      JSON.stringify({ localized: { en: { description: "no title" } } })
    );
    expect(result.success).toBe(false);
  });

  it("fails on invalid JSON", () => {
    const result = parseProductImportJson("{ invalid");
    expect(result.success).toBe(false);
  });

  it("parses variant rows with stock, sku and price", () => {
    const result = parseProductImportJson(
      JSON.stringify({
        localized: { en: { title: "Tee" } },
        variantTypes: [
          {
            kind: "color",
            swatches: ["#ff0000", "#000000"],
            localized: {
              en: { name: "Color", values: ["Red", "Black"] },
              ar: { name: "اللون", values: ["أحمر", "أسود"] },
            },
          },
        ],
        variants: [
          {
            options: { en: ["Red"], ar: ["أحمر"] },
            sku: "TEE-RED",
            stock: 12,
            price: { list: 300, final: 199 },
            isDefault: true,
          },
          { options: { en: ["Black"], ar: ["أسود"] }, stock: 4 },
        ],
      })
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.variantTypes?.[0]?.kind).toBe("color");
    expect(result.data.variantTypes?.[0]?.swatches).toEqual([
      "#ff0000",
      "#000000",
    ]);
    expect(result.data.variants).toHaveLength(2);
    expect(result.data.variants?.[0]).toMatchObject({
      sku: "TEE-RED",
      stock: 12,
      isDefault: true,
    });
    expect(result.data.variants?.[0]?.price?.final).toBe(199);
    expect(result.data.variants?.[1]?.stock).toBe(4);
  });

  it("fails when a variant does not cover every variant type", () => {
    const result = parseProductImportJson(
      JSON.stringify({
        localized: { en: { title: "Tee" } },
        variantTypes: [
          {
            localized: {
              en: { name: "Color", values: ["Red"] },
              ar: { name: "اللون", values: ["أحمر"] },
            },
          },
          {
            localized: {
              en: { name: "Size", values: ["S", "M"] },
              ar: { name: "المقاس", values: ["S", "M"] },
            },
          },
        ],
        variants: [{ options: { en: ["Red"], ar: ["أحمر"] }, stock: 3 }],
      })
    );

    expect(result.success).toBe(false);
  });

  it("reads shipping options from a nested shipping block", () => {
    const result = parseProductImportJson(
      JSON.stringify({
        localized: { en: { title: "Tee" } },
        shipping: {
          fulfillmentType: "platform_fulfilled",
          freeDelivery: true,
          handlingTime: 2,
          weight: 0.4,
          weightUnit: "kg",
          length: 20,
          width: 15,
          height: 3,
          unit: "cm",
        },
      })
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.fulfillmentType).toBe("platform_fulfilled");
    expect(result.data.freeDelivery).toBe(true);
    expect(result.data.handlingTime).toBe(2);
    expect(result.data.dimensions).toMatchObject({
      weight: 0.4,
      weightUnit: "kg",
      length: 20,
      unit: "cm",
    });
  });

  it("still accepts legacy option definitions under `variants`", () => {
    const result = parseProductImportJson(
      JSON.stringify({
        localized: { en: { title: "Tee" } },
        variants: [{ name: "Color", values: ["Red", "Black"] }],
      })
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.variantTypes?.[0]?.localized.en.name).toBe("Color");
    expect(result.data.variants).toBeUndefined();
  });
});

describe("parseProductImportText", () => {
  it("parses bracket text format", () => {
    const result = parseProductImportText(FAN_TEXT);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.localized?.en?.title).toContain("Jsdoin");
    expect(result.data.localized?.ar?.title).toContain("مروحة");
    expect(result.data.localized?.en?.bulletPoints).toHaveLength(2);
    expect(result.data.price?.list).toBe(300);
    expect(result.data.price?.final).toBe(150);
    expect(result.data.sku).toBe("PROD_132");
    expect(result.data.quantity).toBe(17);
    expect(result.data.variantTypes?.[0]?.localized.en.name).toBe("Color");
    expect(result.data.variantTypes?.[0]?.localized.en.values).toEqual([
      "Red",
      "Blue",
      "Black",
    ]);
  });

  it("parses emoji-style text format", () => {
    const result = parseProductImportText(FAN_EMOJI_TEXT);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.localized?.en?.title).toContain("Jsdoin");
    expect(result.data.localized?.ar?.title).toContain("مروحة");
    expect(result.data.price?.list).toBe(300);
    expect(result.data.price?.final).toBe(150);
    expect(result.data.sku).toBe("PROD_132");
    expect(result.data.variantTypes?.[0]?.localized.en.values).toEqual([
      "Red",
      "Blue",
      "Black",
    ]);
  });

  it("parses EN-only variants", () => {
    const result = parseProductImportText(`
[Product Name]
EN: Test Product

[Variants]
Size: Small, Medium, Large
`);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.variantTypes?.[0]?.localized.en.name).toBe("Size");
    expect(result.data.variantTypes?.[0]?.localized.en.values).toEqual([
      "Small",
      "Medium",
      "Large",
    ]);
  });
});

describe("parseProductImport", () => {
  it("routes JSON input correctly", () => {
    const result = parseProductImport(FAN_JSON);
    expect(result.success).toBe(true);
    expect(result.format).toBe("json");
  });

  it("routes text input correctly", () => {
    const result = parseProductImport(FAN_TEXT);
    expect(result.success).toBe(true);
    expect(result.format).toBe("text");
  });

  it("maps discountType percentage to percent", () => {
    const result = parseProductImportJson(
      JSON.stringify({
        version: "1",
        localized: {
          en: { title: "Discounted Product" },
          ar: { title: "منتج مخفض" },
        },
        price: {
          list: 369,
          final: 339,
          discountType: "percentage",
          discountValue: 8,
        },
        shipping: { weight: 200, weightUnit: "g" },
      })
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.price?.discountType).toBe("percent");
    expect(result.data.price?.discountValue).toBe(8);
    expect(result.data.price?.list).toBe(369);
    expect(result.data.price?.final).toBe(339);
  });
});

describe("buildParsedImportFromScrape", () => {
  it("builds import from EN and AR scrape data", () => {
    const parsed = buildParsedImportFromScrape(
      {
        title: "English Title",
        description: "English desc",
        bulletPoints: ["Feature 1"],
        priceAmount: 199,
        images: ["https://example.com/img.jpg"],
      },
      {
        title: "عنوان عربي",
        description: "وصف عربي",
        bulletPoints: ["ميزة 1"],
      }
    );

    expect(parsed.localized?.en?.title).toBe("English Title");
    expect(parsed.localized?.ar?.title).toBe("عنوان عربي");
    expect(parsed.price?.list).toBe(199);
    expect(parsed.images).toEqual(["https://example.com/img.jpg"]);
    expect(parsed.quantity).toBe(25);
    expect(parsed.dimensions?.weight).toBe(999);
    expect(parsed.dimensions?.weightUnit).toBe("g");
    expect(parsed.fulfillmentType).toBe("platform_fulfilled");
    expect(parsed.handlingTime).toBe(1);
    expect(parsed.freeDelivery).toBe(false);
  });

  it("uses scraped weight and dimensions when present", () => {
    const parsed = buildParsedImportFromScrape(
      {
        title: "Weighted Product",
        weight: 1.5,
        weightUnit: "kg",
        dimensions: {
          length: 30,
          width: 20,
          height: 5,
          unit: "cm",
          weight: 1.5,
          weightUnit: "kg",
        },
      },
      { title: "منتج" }
    );

    expect(parsed.dimensions?.weight).toBe(1.5);
    expect(parsed.dimensions?.weightUnit).toBe("kg");
    expect(parsed.dimensions?.length).toBe(30);
    expect(parsed.dimensions?.width).toBe(20);
    expect(parsed.dimensions?.height).toBe(5);
    expect(parsed.dimensions?.unit).toBe("cm");
  });

  it("parses weight from bullet points when structured weight is missing", () => {
    const parsed = buildParsedImportFromScrape(
      {
        title: "Bullet Weight Product",
        bulletPoints: ["Item Weight: 250 g", "Color: Black"],
      },
      { title: "منتج" }
    );

    expect(parsed.dimensions?.weight).toBe(250);
    expect(parsed.dimensions?.weightUnit).toBe("g");
  });
});
