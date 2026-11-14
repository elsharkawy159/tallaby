import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/brands", () => ({ searchBrands: async () => ({ success: true, data: [] }) }));

import { applyBulkOptions, checkBulkValues, completeBulkValues, type BulkApplyContext } from "./bulk-apply.lib";
import { buildFormValuesFromImport } from "./build-form-values-from-import.lib";
import { buildParsedImportFromScrape } from "./parse-product-import.lib";
import { indexTallabyCategories } from "./category-search.lib";
import type { AddProductFormData, CategoryOption } from "./add-product.schema";
import type { SellerTaxonomyOption } from "../categories-brands/categories-brands.dto";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";

const CATEGORIES: CategoryOption[] = [
  { id: "electronics", name: "Electronics", nameAr: "إلكترونيات", slug: "electronics", level: 0 },
  { id: "mice", name: "Computer Mice", nameAr: "فأرة كمبيوتر", slug: "mice", level: 1, parentId: "electronics" },
  { id: "kitchen", name: "Kitchen Tools", nameAr: "أدوات المطبخ", slug: "kitchen", level: 1, parentId: "electronics" },
  { id: "other", name: "Other", nameAr: "أخرى", slug: "other", level: 0 },
];

const STORE: SellerTaxonomyOption[] = [
  { id: "s-gifts", name: "Gifts", nameAr: "هدايا", sourceId: null },
  { id: "s-kitchen", name: "Kitchen Tools", nameAr: "أدوات المطبخ", sourceId: "kitchen" },
  { id: "s-sub", name: "Cups", nameAr: "أكواب", sourceId: null, parentId: "s-gifts", parentName: "Gifts", parentNameAr: "هدايا" },
];

const ctx: BulkApplyContext = {
  categories: CATEGORIES,
  tallaby: indexTallabyCategories(CATEGORIES, "en"),
  store: STORE,
  locale: "en",
};

const PRICING = { commissionRate: 5, isCommissionExempt: false } as SellerPricingSettings;

/** A row as the bulk list builds it from one fetched page (the image import is mocked). */
async function fetchedRow (page: { title: string; description?: string; price?: string }) {
  const parsed = buildParsedImportFromScrape(
    { title: page.title, description: page.description ?? "A product.", images: ["https://cdn.shop.com/a.jpg"], price: page.price ?? "450" },
    { title: "", description: "" }
  );
  const { values } = await buildFormValuesFromImport(parsed, { sellerPricing: PRICING, categories: CATEGORIES });
  return values;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ paths: ["seller/2026-11-14/a.jpg"], skipped: [] }), { status: 200 }))
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("Save all on fetched products (the 'products need fixes' bug)", () => {
  it("names what a row the seller never opened is missing: here the required category", async () => {
    // No Tallaby category scores high enough for this name, so the fetch leaves categoryId empty.
    const values = await fetchedRow({ title: "Handmade Ceramic Mug Set" });
    expect(values.categoryId).toBe("");
    const check = checkBulkValues(completeBulkValues(values));
    expect(check.data).toBeNull();
    expect(check.issues).toEqual(["category"]);
  });

  it("saves once a store category is applied: its Tallaby category is matched without asking", async () => {
    const values = await fetchedRow({ title: "Handmade Ceramic Mug Set" });
    const applied = applyBulkOptions(values, undefined, { category: { kind: "store", option: STORE[0]! } }, ctx);
    expect(applied).toMatchObject({ sellerCategoryId: "s-gifts", sellerCategoryName: "", categoryId: "other" });
    expect(checkBulkValues(completeBulkValues(applied)).data).not.toBeNull();
  });

  it("cuts a fetched name longer than the form allows instead of failing on it", async () => {
    const long = `Computer Mice ${"wireless ergonomic ".repeat(20)}`;
    const values = await fetchedRow({ title: long });
    expect(values.localized.en.title.length).toBeLessThanOrEqual(255);
    const raw = { ...values, localized: { ...values.localized, en: { ...values.localized.en, title: long } } } as AddProductFormData;
    expect(checkBulkValues(raw).issues).toContain("name");
    expect(checkBulkValues(completeBulkValues(raw)).data).not.toBeNull();
  });

  it("fills the link from the Arabic name and the sale price from the price", async () => {
    const values = await fetchedRow({ title: "Computer Mice M185" });
    const row = {
      ...values,
      localized: { en: { ...values.localized.en, title: "", slug: "" }, ar: { ...values.localized.ar, title: "فأرة لاسلكية", description: "فأرة" } },
      price: { ...values.price, final: undefined as unknown as number },
    } as AddProductFormData;
    const done = completeBulkValues(row);
    expect(done.localized.en.slug).not.toBe("");
    expect(done.price.final).toBe(done.price.list);
    expect(checkBulkValues(done).data).not.toBeNull();
  });

  it("asks for a price and a photo when the page had none", async () => {
    const values = await fetchedRow({ title: "Computer Mice M185", price: "" });
    const check = checkBulkValues(completeBulkValues({ ...values, images: [] }));
    expect(check.issues).toEqual(["images", "price"]);
  });

  it("points to English when the only language problem is there", async () => {
    const values = await fetchedRow({ title: "Computer Mice M185" });
    const row = { ...values, localized: { ...values.localized, en: { ...values.localized.en, metaTitle: "x".repeat(61) } } };
    expect(checkBulkValues(row as AddProductFormData)).toMatchObject({ issues: ["other"], locale: "en" });
  });
});

describe("applyBulkOptions", () => {
  it("links the store's copy of a Tallaby category, and maps a copied store category back to it", async () => {
    const values = await fetchedRow({ title: "Chef knife" });
    expect(applyBulkOptions(values, undefined, { category: { kind: "tallaby", id: "kitchen" } }, ctx)).toMatchObject({
      categoryId: "kitchen",
      sellerCategoryId: "s-kitchen",
    });
    expect(applyBulkOptions(values, undefined, { category: { kind: "store", option: STORE[1]! } }, ctx)).toMatchObject({
      categoryId: "kitchen",
      sellerCategoryId: "s-kitchen",
    });
  });

  it("matches a sub-category on its own name, and a new name to the closest Tallaby category", async () => {
    const values = await fetchedRow({ title: "Chef knife" });
    const sub = applyBulkOptions(values, undefined, { category: { kind: "store", option: STORE[2]! } }, ctx);
    expect(sub).toMatchObject({ sellerCategoryId: "s-sub", categoryId: "other" });
    const typed = applyBulkOptions(values, undefined, { category: { kind: "new", name: "  Kitchen   Tools  " } }, ctx);
    expect(typed).toMatchObject({ sellerCategoryId: "", sellerCategoryName: "Kitchen Tools", categoryId: "kitchen" });
  });

  it("changes the fetched price by a percent or an amount, never on top of an earlier change", async () => {
    const values = await fetchedRow({ title: "Computer Mice M185", price: "200" });
    const source = { list: 200, final: 200 };
    const up = applyBulkOptions(values, source, { priceChange: { mode: "percent", value: 15 } }, ctx);
    expect(up.price).toMatchObject({ list: 230, final: 230, base: 230 });
    const again = applyBulkOptions(up, source, { priceChange: { mode: "percent", value: 15 } }, ctx);
    expect(again.price.list).toBe(230);
    const off = applyBulkOptions(values, source, { priceChange: { mode: "amount", value: -25.5 } }, ctx);
    expect(off.price).toMatchObject({ list: 174.5, final: 174.5 });
  });

  it("keeps a sale when the page had one", async () => {
    const values = await fetchedRow({ title: "Computer Mice M185" });
    const applied = applyBulkOptions(values, { list: 100, final: 80 }, { priceChange: { mode: "percent", value: 10 } }, ctx);
    expect(applied.price).toMatchObject({ list: 110, final: 88, discountValue: 22, discountType: "amount" });
  });

  it("sets stock tracking and quantity, and leaves everything else alone", async () => {
    const values = await fetchedRow({ title: "Computer Mice M185" });
    const applied = applyBulkOptions(values, undefined, { trackStock: false, quantity: 7 }, ctx);
    expect(applied).toMatchObject({ trackStock: false, quantity: 7, categoryId: values.categoryId, price: values.price });
    expect(applied.localized).toBe(values.localized);
    const withVariants = { ...values, variants: [{ title: "Red", sku: "R", price: 10, stock: 3 }] } as AddProductFormData;
    expect(applyBulkOptions(withVariants, undefined, { quantity: 9 }, ctx).quantity).toBe(values.quantity);
  });
});
