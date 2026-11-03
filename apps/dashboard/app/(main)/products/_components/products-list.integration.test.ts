import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * The server-side products list (ROADMAP.md F-43a) against the staging
 * database. Creates its own products under one seller and removes them after.
 * Runs only when TEST_DATABASE_URL is set (it becomes DATABASE_URL for
 * @workspace/db); never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("products list (integration)", { timeout: 60_000 }, () => {
  const run = randomUUID().slice(0, 8);
  const ids = { a: randomUUID(), b: randomUUID(), c: randomUUID(), trashed: randomUUID(), other: randomUUID() };
  const mine = [ids.a, ids.b, ids.c];
  let sellerId = "";
  let otherSellerId = "";
  let categoryId = "";

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("./products-list.query")),
  });

  // Only this test's products, however many the staging seller already has.
  const onlyMine = (found: string[]) => found.filter((id) => (Object.values(ids) as string[]).includes(id));
  const filters = (over = {}) => ({ tab: "all", q: run, category: "", sort: "newest", page: 1, size: 20, ...over }) as const;

  beforeAll(async () => {
    const { db, products, productTranslations, sellers, categories } = await load();
    const found = await db.select({ id: sellers.id }).from(sellers).limit(2);
    sellerId = found[0]!.id;
    otherSellerId = found[1]!.id;
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
    categoryId = category!.id;

    const base = { categoryId, images: [] as string[] };
    await db.insert(products).values([
      // The three price shapes parsePriceJson reads: object, number and string.
      { ...base, id: ids.a, sellerId, status: "active", quantity: "50", price: { base: 500, final: 300 }, createdAt: "2026-01-01T00:00:00Z", sku: `SKU-${run}-A` },
      { ...base, id: ids.b, sellerId, status: "draft", quantity: "5", price: 100, createdAt: "2026-01-02T00:00:00Z", sku: `SKU-${run}-B` },
      { ...base, id: ids.c, sellerId, status: "active", quantity: "0", price: "200", createdAt: "2026-01-03T00:00:00Z", sku: `SKU-${run}-C` },
      { ...base, id: ids.trashed, sellerId, status: "draft", quantity: "1", price: 1, deletedAt: "2026-01-04T00:00:00Z", sku: `SKU-${run}-T` },
      { ...base, id: ids.other, sellerId: otherSellerId, status: "active", quantity: "1", price: 1, sku: `SKU-${run}-O` },
    ]);
    const translation = (productId: string, locale: "ar" | "en", title: string) => ({
      productId,
      locale,
      title,
      slug: `qa-${run}-${locale}-${productId.slice(0, 6)}`,
      description: `<p>Description ${title}</p>`,
    });
    await db.insert(productTranslations).values([
      translation(ids.a, "en", `Zebra ${run}`),
      translation(ids.a, "ar", `ألف ${run}`),
      translation(ids.b, "en", `Apple ${run} 50%`),
      translation(ids.c, "en", `Mango ${run}`),
      translation(ids.trashed, "en", `Trashed ${run}`),
      translation(ids.other, "en", `Other seller ${run}`),
    ]);
  }, 60_000);

  afterAll(async () => {
    const { db, inArray, products, productTranslations } = await load();
    const all = Object.values(ids);
    await db.delete(productTranslations).where(inArray(productTranslations.productId, all));
    await db.delete(products).where(inArray(products.id, all));
  }, 60_000);

  const page = async (over = {}, locale = "en") => {
    const { listSellerProductsPage } = await load();
    const result = await listSellerProductsPage(sellerId, filters(over), locale);
    return { ...result, ids: onlyMine(result.products.map((p) => p.id)) };
  };

  it("lists only this seller's products, without Trash, newest first", async () => {
    const result = await page();
    expect(result.ids).toEqual([ids.c, ids.b, ids.a]);
    expect(result.total).toBe(3);
  });

  it("finds a title in either language or a SKU, and treats % literally", async () => {
    expect((await page({ q: `ألف ${run}` })).ids).toEqual([ids.a]);
    expect((await page({ q: `SKU-${run}-B` })).ids).toEqual([ids.b]);
    expect((await page({ q: `${run} 50%` })).ids).toEqual([ids.b]);
    expect((await page({ q: `${run} 5_%` })).ids).toEqual([]);
  });

  it("filters by tab and category", async () => {
    expect((await page({ tab: "published" })).ids).toEqual([ids.c, ids.a]);
    expect((await page({ tab: "draft" })).ids).toEqual([ids.b]);
    expect((await page({ tab: "lowStock" })).ids).toEqual([ids.b]);
    expect((await page({ tab: "outOfStock" })).ids).toEqual([ids.c]);
    expect((await page({ category: categoryId })).ids).toEqual([ids.c, ids.b, ids.a]);
    expect((await page({ category: randomUUID() })).total).toBe(0);
  });

  it("sorts by the price a buyer pays, across all three price shapes", async () => {
    expect((await page({ sort: "priceAsc" })).ids).toEqual([ids.b, ids.c, ids.a]);
    expect((await page({ sort: "priceDesc" })).ids).toEqual([ids.a, ids.c, ids.b]);
  });

  it("sorts by stock and by the title in the dashboard language", async () => {
    expect((await page({ sort: "stockAsc" })).ids).toEqual([ids.c, ids.b, ids.a]);
    expect((await page({ sort: "name" }, "en")).ids).toEqual([ids.b, ids.c, ids.a]);
  });

  it("pages without repeating a product and clamps a page past the end", async () => {
    const first = await page({ size: 2, page: 1 });
    const second = await page({ size: 2, page: 2 });
    expect(first.ids).toEqual([ids.c, ids.b]);
    expect(second.ids).toEqual([ids.a]);
    expect(first.pages).toBe(2);
    const beyond = await page({ size: 2, page: 99 });
    expect(beyond.page).toBe(2);
    expect(beyond.ids).toEqual([ids.a]);
  });

  it("maps rows for the page, without loading descriptions", async () => {
    const result = await page({ q: `Zebra ${run}` }, "ar");
    const [row] = result.products;
    expect(row).toMatchObject({ id: ids.a, title: `ألف ${run}`, status: "active", quantity: 50, basePrice: 500, salePrice: 300 });
    expect(row!.description).toBeNull();
  });

  it("exports every filtered product with its description, across pages", async () => {
    const { listSellerProductsForExport, listSellerProductIds } = await load();
    const rows = await listSellerProductsForExport(sellerId, filters(), "en");
    expect(rows.map((r) => r.id)).toEqual([ids.c, ids.b, ids.a]);
    expect(rows[2]!.description).toContain(`Zebra ${run}`);
    expect(await listSellerProductIds(sellerId, filters(), "en")).toEqual([ids.c, ids.b, ids.a]);
  });

  it("never returns another seller's product, even by id", async () => {
    const { loadOwnProductStatuses, listSellerProductsPage } = await load();
    const statuses = await loadOwnProductStatuses(sellerId, [ids.a, ids.other, ids.trashed]);
    expect(statuses.map((s) => s.id)).toEqual([ids.a]);
    const theirs = await listSellerProductsPage(otherSellerId, filters(), "en");
    expect(theirs.products.map((p) => p.id)).toEqual([ids.other]);
  });

  it("counts tabs and lists categories for this seller", async () => {
    const { countSellerProductsByTab, listSellerProductCategories } = await load();
    const counts = await countSellerProductsByTab(sellerId);
    expect(counts.all).toBeGreaterThanOrEqual(3);
    expect(counts.published + counts.draft).toBe(counts.all);
    expect((await listSellerProductCategories(sellerId, "en")).map((c) => c.id)).toContain(categoryId);
  });

  it("keeps the ad picker light", async () => {
    const { listSellerProductOptions } = await load();
    const options = (await listSellerProductOptions(sellerId, "ar")).filter((p) => (mine as string[]).includes(p.id));
    expect(options).toHaveLength(3);
    expect(Object.keys(options[0]!).sort()).toEqual(["id", "image", "price", "status", "title"]);
    expect(options.find((p) => p.id === ids.a)?.title).toBe(`ألف ${run}`);
    expect(options.find((p) => p.id === ids.b)?.title).toBe(`Apple ${run} 50%`);
  });

});
