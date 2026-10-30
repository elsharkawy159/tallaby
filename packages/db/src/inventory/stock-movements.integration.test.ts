import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, asc, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "../drizzle/schema";
import * as DB_RELATIONS from "../drizzle/relations";
import { decrementStock, restoreStock } from "./stock";
import { setStockContext } from "./stock-context";

const schema = { ...DB_SCHEMA, ...DB_RELATIONS };

/**
 * Stock history + low-stock alert triggers (0125, ROADMAP.md F-10) against a
 * real Postgres with 0125 applied. Skipped without TEST_DATABASE_URL. Creates
 * and deletes its own users/sellers/categories/products rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("stock movements (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused");
  const db = drizzle(client, { schema });

  let sellerId: string;
  let categoryId: string;

  async function makeProduct(quantity: number, threshold: number | null = null) {
    const id = randomUUID();
    await db.insert(schema.products).values({
      id,
      sellerId,
      categoryId,
      sku: `test-${id}`,
      quantity: String(quantity),
      status: "active",
      price: { base: 10, list: 10, final: 10 },
      lowStockThreshold: threshold,
    });
    return id;
  }

  const setQuantity = (productId: string, quantity: number) =>
    db.update(schema.products).set({ quantity: String(quantity) }).where(eq(schema.products.id, productId));

  // One statement per transaction here, so created_at orders them.
  const movements = (productId: string) =>
    db
      .select()
      .from(schema.stockMovements)
      .where(eq(schema.stockMovements.productId, productId))
      .orderBy(asc(schema.stockMovements.createdAt));

  const lowStockAlerts = (id: string) =>
    db
      .select()
      .from(schema.sellerNotifications)
      .where(
        and(
          eq(schema.sellerNotifications.sellerId, sellerId),
          eq(schema.sellerNotifications.type, "low_stock"),
          sql`${schema.sellerNotifications.dedupeKey} LIKE ${`low_stock:${id}:%`}`,
        ),
      );

  beforeAll(async () => {
    sellerId = randomUUID();
    await db.insert(schema.users).values({ id: sellerId, isGuest: true });
    await db.insert(schema.sellers).values({
      id: sellerId,
      businessName: "Test Seller",
      displayName: "Test Seller",
      slug: `test-seller-${randomUUID()}`,
      businessType: "individual",
      legalAddress: {},
      supportEmail: "test@example.com",
    });
    categoryId = randomUUID();
    await db.insert(schema.categories).values({ id: categoryId, name: "Test Category", slug: `test-cat-${categoryId}` });
  });

  afterAll(async () => {
    await db.delete(schema.products).where(eq(schema.products.sellerId, sellerId));
    await db.delete(schema.sellers).where(eq(schema.sellers.id, sellerId));
    await db.delete(schema.users).where(eq(schema.users.id, sellerId));
    await db.delete(schema.categories).where(eq(schema.categories.id, categoryId));
    await client.end();
  });

  it("records the initial stock, an edit with its actor, and an order decrement", async () => {
    const productId = await makeProduct(20);
    await db.transaction(async (tx) => {
      await setStockContext(tx, { reason: "edit", actorId: sellerId });
      await tx.update(schema.products).set({ quantity: "12" }).where(eq(schema.products.id, productId));
    });
    await db.transaction((tx) => decrementStock(tx, [{ kind: "product", id: productId, quantity: 2 }]));
    // The context is transaction-local: a later write is 'other'.
    await setQuantity(productId, 11);

    const rows = await movements(productId);
    expect(rows.map((r) => [r.reason, r.delta, r.stockAfter])).toEqual([
      ["other", 20, 20],
      ["edit", -8, 12],
      ["order", -2, 10],
      ["other", 1, 11],
    ]);
    expect(rows[1]!.actorUserId).toBe(sellerId);
    expect(rows.every((r) => r.sellerId === sellerId)).toBe(true);
  });

  it("skips unchanged writes and labels a restore as cancel", async () => {
    const productId = await makeProduct(5);
    await setQuantity(productId, 5);
    await db.transaction((tx) => restoreStock(tx, [{ kind: "product", id: productId, quantity: 3 }]));
    const rows = await movements(productId);
    expect(rows.map((r) => [r.reason, r.delta])).toEqual([
      ["other", 5],
      ["cancel", 3],
    ]);
  });

  it("alerts once when stock crosses down to the threshold, not again the same day", async () => {
    const productId = await makeProduct(10, 3);
    await setQuantity(productId, 4);
    expect(await lowStockAlerts(productId)).toHaveLength(0);
    await setQuantity(productId, 3);
    await setQuantity(productId, 9);
    await setQuantity(productId, 1);
    const alerts = await lowStockAlerts(productId);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.data).toMatchObject({ productId, stock: 3, threshold: 3 });
  });

  it("tracks variants (product count ignored) and alerts per variant with the product threshold", async () => {
    const productId = await makeProduct(0);
    const variantId = randomUUID();
    await db.insert(schema.productVariants).values({ id: variantId, productId, title: "Red", stock: 8 });
    await setQuantity(productId, 50);
    await db.transaction((tx) => decrementStock(tx, [{ kind: "variant", id: variantId, quantity: 4 }]));

    const rows = await movements(productId);
    expect(rows.map((r) => [r.variantId, r.reason, r.delta, r.stockAfter])).toEqual([
      [variantId, "other", 8, 8],
      [variantId, "order", -4, 4],
    ]);
    const alerts = await lowStockAlerts(variantId);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.data).toMatchObject({ productId, variantId, variantTitle: "Red", stock: 4, threshold: 5 });
  });

  it("does not alert for a product in Trash", async () => {
    const productId = await makeProduct(10);
    await db
      .update(schema.products)
      .set({ status: "draft", deletedAt: new Date().toISOString() })
      .where(eq(schema.products.id, productId));
    await setQuantity(productId, 1);
    expect(await lowStockAlerts(productId)).toHaveLength(0);
  });
});
