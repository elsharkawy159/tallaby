import { describe, expect, it } from "vitest";
import type { ProductAutofillOutput } from "@workspace/lib/products/autofill";
import {
  buildCreateInput,
  emptyStoreProductForm,
  formValuesFromAutofill,
  parseStoreProductsParams,
  sellerProductImagePath,
  storeProductImagePath,
  type StoreProductFormValues,
} from "./store-products.lib";

const STORE = "11111111-1111-4111-8111-111111111111";
const SELLER = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";
const CATEGORY = "44444444-4444-4444-8444-444444444444";
const SUPABASE = "https://abc.supabase.co";
const photo = (seller = SELLER, file = "1731400000000-mug.jpg") => `${SUPABASE}/storage/v1/object/public/products/${seller}/2026-11-12/${file}`;

const filled = (overrides: Partial<StoreProductFormValues> = {}): StoreProductFormValues => ({
  ...emptyStoreProductForm(),
  titleAr: "مج سيراميك",
  titleEn: "Ceramic mug",
  price: "250",
  quantity: "8",
  categoryId: CATEGORY,
  images: [photo()],
  ...overrides,
});

describe("parseStoreProductsParams", () => {
  it("keeps known filters and falls back on bad ones", () => {
    expect(parseStoreProductsParams({ q: "  mug ", status: "trash", page: "3" })).toEqual({ query: "mug", status: "trash", page: 3 });
    expect(parseStoreProductsParams({ status: "rejected", page: "-1" })).toEqual({ query: "", status: "all", page: 1 });
  });
});

describe("buildCreateInput", () => {
  it("builds the shared create input with the route's store and both languages", () => {
    const result = buildCreateInput(filled({ bulletsAr: "سعة 350 مل\n\n", bulletsEn: "350 ml", keywordsEn: "mug, cup ,", compareAtPrice: "300" }), STORE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input).toMatchObject({
      storeId: STORE,
      title: { ar: "مج سيراميك", en: "Ceramic mug" },
      price: 250,
      compareAtPrice: 300,
      quantity: 8,
      trackStock: true,
      categoryId: CATEGORY,
      bulletPoints: { ar: ["سعة 350 مل"], en: ["350 ml"] },
      seo: { en: { keywords: ["mug", "cup"] } },
      publish: true,
    });
  });

  it("refuses a title in one language only", () => {
    const result = buildCreateInput(filled({ titleAr: "" }), STORE);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toMatch(/Title/);
  });

  it("needs a price, a category and a photo", () => {
    expect(buildCreateInput(filled({ price: "" }), STORE)).toEqual({ ok: false, error: "Enter a price." });
    expect(buildCreateInput(filled({ categoryId: null }), STORE)).toEqual({ ok: false, error: "Pick a Tallaby category." });
    expect(buildCreateInput(filled({ images: [] }), STORE)).toEqual({ ok: false, error: "Add at least one photo." });
  });

  it("refuses a 'before' price that is not higher, and a negative price", () => {
    expect(buildCreateInput(filled({ compareAtPrice: "200" }), STORE)).toMatchObject({ ok: false });
    expect(buildCreateInput(filled({ price: "-5" }), STORE)).toMatchObject({ ok: false });
  });

  it("sends no stock for unlimited products and a new store category by name", () => {
    const result = buildCreateInput(filled({ trackStock: false, storeCategoryName: "مجات" }), STORE);
    expect(result.ok && result.input.quantity).toBe(undefined);
    expect(result.ok && result.input.storeCategoryName).toEqual({ ar: "مجات", en: "مجات" });
  });

  it("keeps a picked store category over a typed name", () => {
    const result = buildCreateInput(filled({ storeCategoryId: OTHER, storeCategoryName: "x" }), STORE);
    expect(result.ok && result.input.storeCategoryId).toBe(OTHER);
    expect(result.ok && result.input.storeCategoryName).toBe(undefined);
  });
});

describe("photo paths", () => {
  it("signs only Admin file names into the seller's dated folder", () => {
    expect(storeProductImagePath(SELLER, "1731400000000-mug.jpg", new Date("2026-11-12T10:00:00Z"))).toBe(`${SELLER}/2026-11-12/1731400000000-mug.jpg`);
    expect(storeProductImagePath(SELLER, "../x.jpg")).toBeNull();
    expect(storeProductImagePath("not-a-uuid", "1731400000000-mug.jpg")).toBeNull();
  });

  it("accepts only this seller's uploaded photos", () => {
    expect(sellerProductImagePath(photo(), { supabaseUrl: SUPABASE, sellerId: SELLER })).toBe(`${SELLER}/2026-11-12/1731400000000-mug.jpg`);
    expect(sellerProductImagePath(photo(OTHER), { supabaseUrl: SUPABASE, sellerId: SELLER })).toBeNull();
    expect(sellerProductImagePath("https://evil.example/products/x.jpg", { supabaseUrl: SUPABASE, sellerId: SELLER })).toBeNull();
    expect(sellerProductImagePath(`${SUPABASE}/storage/v1/object/public/products/${SELLER}/2026-11-12/a/../../x.jpg`, { supabaseUrl: SUPABASE, sellerId: SELLER })).toBeNull();
    expect(sellerProductImagePath(photo(), { supabaseUrl: null, sellerId: SELLER })).toBeNull();
  });
});

describe("formValuesFromAutofill", () => {
  const localized = (title: string) => ({
    title,
    description: "First.\n\nSecond.",
    bulletPoints: ["One", "Two"],
    metaKeywords: ["mug", "cup"],
    metaTitle: title,
    metaDescription: "First.",
    contentBlocks: [
      { kind: "heading", text: title, items: [] },
      { kind: "paragraph", text: "Intro", items: [] },
    ],
  });
  const output = (price: ProductAutofillOutput["price"], extra: Partial<ProductAutofillOutput> = {}) =>
    ({
      localized: { ar: localized("مج"), en: localized("Mug") },
      categoryHint: "mugs",
      brandName: null,
      storeCategoryName: "مجات",
      price,
      showLiveViews: null,
      quantity: 5,
      sku: null,
      condition: null,
      dimensions: { length: null, width: null, height: null, unit: null, weight: null, weightUnit: null },
      variantTypes: [],
      reviews: [],
      productPhotos: [1],
      missing: [],
      warnings: [],
      ...extra,
    }) as ProductAutofillOutput;

  it("uses the sale price as the price and the regular price as the 'before' price", () => {
    const values = formValuesFromAutofill(output({ list: 300, final: 250, discountPercent: null, discountEndsAt: null }), { imageUrls: ["a", "https://x/b.jpg"] });
    expect(values).toMatchObject({ price: "250", compareAtPrice: "300", quantity: "5", titleEn: "Mug", titleAr: "مج", bulletsEn: "One\nTwo", keywordsEn: "mug, cup", storeCategoryName: "مجات" });
    // Only the product photos the model picked go into the long description.
    expect(values.contentEn).toContain('<img src="https://x/b.jpg"');
    expect(values.contentEn).toContain("<h2>Mug</h2>");
  });

  it("leaves the price empty when the seller gave none", () => {
    const values = formValuesFromAutofill(output({ list: null, final: null, discountPercent: null, discountEndsAt: null }, { quantity: null }), { imageUrls: [] });
    expect(values.price).toBe("");
    expect(values.compareAtPrice).toBe("");
    expect(values.quantity).toBe("");
  });
});
