import { describe, expect, it } from "vitest";

import {
  buildParsedImportFromScrape,
  detectImportFormat,
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

describe("detectImportFormat", () => {
  it("detects URLs", () => {
    expect(detectImportFormat("https://amazon.com/product")).toBe("url");
    expect(detectImportFormat("http://example.com")).toBe("url");
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
  });
});
