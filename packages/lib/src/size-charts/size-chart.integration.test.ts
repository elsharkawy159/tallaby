import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sizeChartFromTemplate } from "./size-chart.lib";

/**
 * Size Chart app against staging (ROADMAP.md F-92, 0169): store scoping of
 * targets and the storefront read. Two throwaway sellers, each with its
 * primary store (the 0050 trigger) and one product. Runs only when
 * TEST_DATABASE_URL is set (and 0169 is applied there); never point it at
 * production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("size charts (integration)", { timeout: 120_000 }, () => {
  const sellerA = randomUUID();
  const sellerB = randomUUID();
  const world = { storeA: "", storeB: "", productA: "", productA2: "", productB: "", categoryA: "" };

  const load = async () => ({ ...(await import("@workspace/db")), ...(await import("./size-chart.server")) });

  const makeSeller = async (id: string) => {
    const { db, sql, stores, eq } = await load();
    const email = `qa-sc-${id.slice(0, 8)}@example.test`;
    await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${email}, 'authenticated', 'authenticated')`);
    await db.execute(sql`INSERT INTO users (id, email, is_guest) VALUES (${id}, ${email}, false) ON CONFLICT DO NOTHING`);
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, business_type, legal_address, support_email, status)
      SELECT ${id}, 'QA size', 'QA size', ${`qa-sc-${id.slice(0, 8)}`}, business_type, legal_address, ${email}, 'approved'
      FROM sellers LIMIT 1`);
    const [store] = await db.select({ id: stores.id }).from(stores).where(eq(stores.sellerId, id));
    return store!.id;
  };
  const makeProduct = async (sellerId: string, storeId: string, sellerCategoryId: string | null = null) => {
    const { db, sql } = await load();
    const rows = await db.execute(sql`
      INSERT INTO products (seller_id, store_id, category_id, seller_category_id, status, quantity, sku)
      SELECT ${sellerId}, ${storeId}, id, ${sellerCategoryId}, 'active', 5, ${`qa-sc-${randomUUID().slice(0, 8)}`} FROM categories LIMIT 1
      RETURNING id`);
    return (rows as unknown as { id: string }[])[0]!.id;
  };

  beforeAll(async () => {
    const { db, sql } = await load();
    world.storeA = await makeSeller(sellerA);
    world.storeB = await makeSeller(sellerB);
    const cat = await db.execute(sql`
      INSERT INTO seller_product_categories (seller_id, store_id, name) VALUES (${sellerA}, ${world.storeA}, 'QA tops') RETURNING id`);
    world.categoryA = (cat as unknown as { id: string }[])[0]!.id;
    world.productA = await makeProduct(sellerA, world.storeA, world.categoryA);
    world.productA2 = await makeProduct(sellerA, world.storeA, world.categoryA);
    world.productB = await makeProduct(sellerB, world.storeB);
  }, 120_000);

  afterAll(async () => {
    const { db, sql } = await load();
    // Deleting the auth users cascades every row this test made (0134).
    await db.execute(sql`DELETE FROM auth.users WHERE id IN (${sellerA}, ${sellerB})`);
  }, 120_000);

  it("applies charts only to this store's products and categories; the product's own chart wins", async () => {
    const { createStoreSizeChart, setSizeChartTargets, loadProductSizeChart, db, storeAppInstalls } = await load();
    const scope = { sellerId: sellerA, storeId: world.storeA };
    const tops = await createStoreSizeChart({ ...scope, actorId: sellerA }, sizeChartFromTemplate("tops"));
    const shoes = await createStoreSizeChart({ ...scope, actorId: sellerA }, sizeChartFromTemplate("shoes"));
    if (!tops.success || !shoes.success) throw new Error("create failed");

    // Another seller's product is refused, and nothing is saved.
    const split = { ...scope, catalogSplit: true };
    expect(await setSizeChartTargets(split, tops.data.id, { productIds: [world.productB], categoryIds: [] })).toEqual({ success: false, error: "invalid_targets" });
    // Seller B can't touch seller A's chart.
    expect(await setSizeChartTargets({ sellerId: sellerB, storeId: world.storeB, catalogSplit: true }, tops.data.id, { productIds: [], categoryIds: [] })).toEqual({ success: false, error: "not_found" });

    expect(await setSizeChartTargets(split, tops.data.id, { productIds: [], categoryIds: [world.categoryA] })).toEqual({ success: true, data: { moved: 0 } });
    expect(await setSizeChartTargets(split, shoes.data.id, { productIds: [world.productA], categoryIds: [] })).toEqual({ success: true, data: { moved: 0 } });

    // App not installed: the storefront shows nothing.
    expect(await loadProductSizeChart(scope, { id: world.productA, categoryId: world.categoryA })).toBeNull();
    await db.insert(storeAppInstalls).values({ sellerId: sellerA, storeId: world.storeA, appKey: "size_chart", pricingModel: "free", priceUsdCents: 0 });

    expect((await loadProductSizeChart(scope, { id: world.productA, categoryId: world.categoryA }))?.id).toBe(shoes.data.id);
    expect((await loadProductSizeChart(scope, { id: world.productA2, categoryId: world.categoryA }))?.id).toBe(tops.data.id);
    // The same product id read through another store finds nothing.
    expect(await loadProductSizeChart({ sellerId: sellerB, storeId: world.storeB }, { id: world.productA, categoryId: world.categoryA })).toBeNull();

    // Applying product A to tops moves it off shoes.
    expect(await setSizeChartTargets(split, tops.data.id, { productIds: [world.productA], categoryIds: [world.categoryA] })).toEqual({ success: true, data: { moved: 1 } });
    expect((await loadProductSizeChart(scope, { id: world.productA, categoryId: world.categoryA }))?.id).toBe(tops.data.id);
  });
});
