import { describe, expect, it } from "vitest";
import { agentCreateProductSchema, agentUpdateProductSchema } from "./agent-products.dto";
import {
  buildAgentPrice,
  buildVariantRows,
  checkAgentVariants,
  cleanAgentKeywords,
  existingImagePath,
  nextAgentProductStatus,
  productImageUrl,
  readAgentPrice,
  slugifyTitle,
  textToHtml,
  variantStockTotal,
} from "./agent-products.lib";

const STORE = "11111111-1111-4111-8111-111111111111";
const option = (en: string, ar: string, valueEn: string, valueAr: string) => ({ name: { en, ar }, value: { en: valueEn, ar: valueAr } });

describe("buildAgentPrice", () => {
  it("keeps a real discount as an amount off the compare-at price", () => {
    expect(buildAgentPrice(450, 600, "2026-12-01T00:00:00.000Z")).toEqual({
      base: 600,
      list: 600,
      final: 450,
      discountType: "amount",
      discountValue: 150,
      discountEndsAt: "2026-12-01T00:00:00.000Z",
    });
  });

  it("ignores a compare-at price that is not higher (no fake discounts)", () => {
    expect(buildAgentPrice(500, 400)).toMatchObject({ list: 500, final: 500, discountType: null, discountValue: null, discountEndsAt: null });
  });

  it("keeps prices to the piastre", () => {
    expect(buildAgentPrice(99.999).final).toBe(100);
    expect(buildAgentPrice(12.345).final).toBeCloseTo(12.35, 2);
  });

  it("reads a stored price back", () => {
    expect(readAgentPrice(buildAgentPrice(450, 600))).toEqual({ price: 450, compareAtPrice: 600, discountEndsAt: null });
    expect(readAgentPrice({ base: "300", list: "300", final: "300" })).toEqual({ price: 300, compareAtPrice: null, discountEndsAt: null });
    expect(readAgentPrice(null).price).toBe(0);
  });
});

describe("nextAgentProductStatus", () => {
  it("goes live with a photo for an approved seller", () => {
    expect(nextAgentProductStatus({ previous: null, hasImage: true, canPublish: true })).toBe("active");
  });
  it("stays a draft without a photo, for a restricted seller, or on request", () => {
    expect(nextAgentProductStatus({ previous: null, hasImage: false, canPublish: true })).toBe("draft");
    expect(nextAgentProductStatus({ previous: null, hasImage: true, canPublish: false })).toBe("draft");
    expect(nextAgentProductStatus({ previous: null, hasImage: true, canPublish: true, wantDraft: true })).toBe("draft");
  });
  it("never lifts an admin takedown and keeps drafts drafts", () => {
    expect(nextAgentProductStatus({ previous: "rejected", hasImage: true, canPublish: true })).toBe("rejected");
    expect(nextAgentProductStatus({ previous: "draft", hasImage: true, canPublish: true })).toBe("draft");
  });
});

describe("slugifyTitle", () => {
  it("makes a URL slug from the English title", () => {
    expect(slugifyTitle("Café Mug — 350 ml & Lid", "x")).toBe("cafe-mug-350-ml-and-lid");
  });
  it("never returns an empty slug", () => {
    expect(slugifyTitle("كوب قهوة", "ab12")).toBe("product-ab12");
  });
});

describe("variants", () => {
  const variants = [
    { ...{ options: [option("Size", "المقاس", "S", "صغير"), option("Color", "اللون", "Red", "أحمر")] }, price: 200, stock: 3 },
    { options: [option("Size", "المقاس", "M", "وسط"), { name: { en: "Color", ar: "اللون" }, value: { en: "Blue", ar: "أزرق", swatch: "#1d4ed8" } }], price: 220, compareAtPrice: 250, stock: 5, sku: "TEE-M-B" },
  ];

  it("accepts consistent variants and rejects mismatched, duplicate or same-SKU ones", () => {
    expect(checkAgentVariants(variants)).toBeNull();
    expect(checkAgentVariants([variants[0]!, { ...variants[1]!, options: [variants[1]!.options[0]!] }])).toBe("options_mismatch");
    expect(checkAgentVariants([variants[0]!, variants[0]!])).toBe("duplicate_variant");
    expect(checkAgentVariants([{ ...variants[0]!, sku: "A" }, { ...variants[1]!, sku: "a" }])).toBe("duplicate_sku");
  });

  it("builds rows in the dashboard form's format", () => {
    const rows = buildVariantRows(variants, { productSku: "TEE", productImages: ["p/1.jpg", "p/2.jpg"], variantImages: [null, "p/blue.jpg"], discountEndsAt: null });
    expect(rows[0]).toMatchObject({
      title: "S / Red",
      sku: "TEE-1",
      option1: "Size: S",
      option2: "Color: Red",
      option3: null,
      isDefault: true,
      images: ["p/1.jpg", "p/2.jpg"],
      imageUrl: "p/1.jpg",
      stock: 3,
      position: 1,
      price: { final: 200, list: 200, discountType: null },
      localized: {
        en: { title: "S / Red", option1: "Size: S", option2: "Color: Red" },
        ar: { title: "صغير / أحمر", option1: "المقاس: صغير", option2: "اللون: أحمر" },
        optionMeta: [{ kind: "size" }, { kind: "color" }],
      },
    });
    expect(rows[1]).toMatchObject({
      sku: "TEE-M-B",
      isDefault: false,
      images: ["p/blue.jpg"],
      price: { final: 220, list: 250, discountType: "amount", discountValue: 30 },
      localized: { optionMeta: [{ kind: "size" }, { kind: "color", swatch: "#1d4ed8" }] },
    });
    expect(variantStockTotal(rows)).toBe(8);
  });

  it("uses the flagged default variant for the product photos", () => {
    const rows = buildVariantRows([variants[0]!, { ...variants[1]!, isDefault: true }], { productSku: "T", productImages: ["p/1.jpg"], variantImages: [null, null], discountEndsAt: null });
    expect(rows.map((r) => r.isDefault)).toEqual([false, true]);
    expect(rows[1]!.images).toEqual(["p/1.jpg"]);
    expect(rows[0]!.images).toBeNull();
  });
});

describe("images", () => {
  const prefix = "https://x.supabase.co/storage/v1/object/public/products/";
  it("keeps only images the product already has, by path or public URL", () => {
    expect(existingImagePath("2026-10-31/a.jpg", ["2026-10-31/a.jpg"], prefix)).toBe("2026-10-31/a.jpg");
    expect(existingImagePath(`${prefix}2026-10-31/a.jpg`, ["2026-10-31/a.jpg"], prefix)).toBe("2026-10-31/a.jpg");
    expect(existingImagePath(`${prefix}someone-else/b.jpg`, ["2026-10-31/a.jpg"], prefix)).toBeNull();
    expect(existingImagePath("https://cdn.example.com/a.jpg", [], prefix)).toBeNull();
  });
  it("builds public URLs and passes full URLs through", () => {
    expect(productImageUrl("2026-10-31/a b.jpg", "https://x.supabase.co/")).toBe(`${prefix}2026-10-31/a%20b.jpg`);
    expect(productImageUrl("https://cdn.example.com/a.jpg", "https://x.supabase.co")).toBe("https://cdn.example.com/a.jpg");
  });
});

describe("copy helpers", () => {
  it("cleans keywords like the dashboard", () => {
    expect(cleanAgentKeywords(["  mug ", "Mug", "", "coffee   cup"])).toEqual(["mug", "coffee cup"]);
  });
  it("turns plain text into escaped paragraphs and leaves HTML alone", () => {
    expect(textToHtml("Line <1>\n\nLine 2")).toBe("<p>Line &lt;1&gt;</p><p>Line 2</p>");
    expect(textToHtml("<p>Hi</p>")).toBe("<p>Hi</p>");
  });
});

describe("schemas", () => {
  const base = { storeId: STORE, title: { ar: "كوب", en: "Mug" }, price: 150, images: ["https://cdn.example.com/a.jpg"] };

  it("needs both languages for copy", () => {
    expect(agentCreateProductSchema.safeParse(base).success).toBe(true);
    expect(agentCreateProductSchema.safeParse({ ...base, title: { en: "Mug" } }).success).toBe(false);
    expect(agentUpdateProductSchema.safeParse({ storeId: STORE, productId: STORE, description: { en: "Only English" } }).success).toBe(false);
  });

  it("rejects unknown fields, seller ids and bad numbers", () => {
    expect(agentCreateProductSchema.safeParse({ ...base, sellerId: STORE }).success).toBe(false);
    expect(agentCreateProductSchema.safeParse({ ...base, price: 0 }).success).toBe(false);
    expect(agentCreateProductSchema.safeParse({ ...base, images: [] }).success).toBe(false);
    expect(agentCreateProductSchema.safeParse({ ...base, quantity: -1 }).success).toBe(false);
  });
});
