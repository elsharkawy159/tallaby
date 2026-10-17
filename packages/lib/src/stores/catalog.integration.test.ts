import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as s from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "./isolation.fixtures";
import { archiveStore, cartProductsOutsideStoreCatalog, getStoreCatalog, setStoreCatalog, storeSellsProduct } from "./server";

/**
 * Store catalog (PLAN.md D24, P4-07) and tenant isolation test 4 (§17):
 * B's products never reach A's stores, a "selected" store sells only its
 * picks, and the selection is the seller's own. Skipped without TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("store catalog (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: s });
  let w: IsolationWorld;
  let categoryId: string;
  const p = { a1: "", a2: "", aDraft: "", b1: "" };

  async function insertProduct(sellerId: string, status: "active" | "draft") {
    const [row] = await db
      .insert(s.products)
      .values({ sellerId, categoryId, status, quantity: "5", sku: `cat-${randomUUID().slice(0, 8)}` })
      .returning({ id: s.products.id });
    return row!.id;
  }

  beforeAll(async () => {
    w = await createIsolationWorld(db);
    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1);
    categoryId = category!.id;
    p.a1 = await insertProduct(w.a.sellerId, "active");
    p.a2 = await insertProduct(w.a.sellerId, "active");
    p.aDraft = await insertProduct(w.a.sellerId, "draft");
    p.b1 = await insertProduct(w.b.sellerId, "active");
  }, 60_000);

  afterAll(async () => {
    if (w) {
      await db.delete(s.products).where(inArray(s.products.sellerId, [w.a.sellerId, w.b.sellerId]));
      await w.cleanup();
    }
    await client.end();
  });

  it("starts in 'all' mode with no selection", async () => {
    expect(await getStoreCatalog(w.a.sellerId, w.a.a2, db)).toEqual({ mode: "all", productIds: [] });
  });

  it("4. A store in 'all' mode sells only its own seller's active products", async () => {
    expect(await storeSellsProduct(w.a.a1, p.a1, db)).toBe(true);
    expect(await storeSellsProduct(w.a.a1, p.b1, db)).toBe(false);
    expect(await storeSellsProduct(w.a.a1, p.aDraft, db)).toBe(false);
    expect(await storeSellsProduct(w.b.b1, p.a1, db)).toBe(false);
  });

  it("4. A cannot select B's products, and B cannot change A's catalog", async () => {
    expect(await setStoreCatalog(w.a.sellerId, w.a.a2, { mode: "selected", productIds: [p.a1, p.b1] }, db)).toEqual({
      success: false,
      error: "invalid_product",
    });
    expect(await setStoreCatalog(w.b.sellerId, w.a.a2, { mode: "selected", productIds: [p.b1] }, db)).toEqual({
      success: false,
      error: "not_found",
    });
    expect(await getStoreCatalog(w.b.sellerId, w.a.a2, db)).toBeNull();
    expect(await getStoreCatalog(w.a.sellerId, w.a.a2, db)).toEqual({ mode: "all", productIds: [] });
  });

  it("4. In 'selected' mode A2 sells only its picks; A1 is unaffected", async () => {
    const saved = await setStoreCatalog(w.a.sellerId, w.a.a2, { mode: "selected", productIds: [p.a2, p.aDraft] }, db);
    expect(saved.success).toBe(true);
    expect(await getStoreCatalog(w.a.sellerId, w.a.a2, db)).toEqual({ mode: "selected", productIds: [p.a2, p.aDraft] });

    expect(await storeSellsProduct(w.a.a2, p.a2, db)).toBe(true);
    expect(await storeSellsProduct(w.a.a2, p.a1, db)).toBe(false); // not picked
    expect(await storeSellsProduct(w.a.a2, p.aDraft, db)).toBe(false); // picked, not active yet
    expect(await storeSellsProduct(w.a.a1, p.a1, db)).toBe(true); // sibling store still 'all'
    expect(await getStoreCatalog(w.a.sellerId, w.a.a1, db)).toEqual({ mode: "all", productIds: [] });
  });

  it("replaces the selection in the given order, and keeps it when switching back to 'all'", async () => {
    await setStoreCatalog(w.a.sellerId, w.a.a2, { mode: "selected", productIds: [p.a1, p.a2] }, db);
    expect((await getStoreCatalog(w.a.sellerId, w.a.a2, db))?.productIds).toEqual([p.a1, p.a2]);
    await setStoreCatalog(w.a.sellerId, w.a.a2, { mode: "selected", productIds: [p.a2, p.a1] }, db);
    expect((await getStoreCatalog(w.a.sellerId, w.a.a2, db))?.productIds).toEqual([p.a2, p.a1]);

    await setStoreCatalog(w.a.sellerId, w.a.a2, { mode: "all", productIds: [p.a2, p.a1] }, db);
    expect(await getStoreCatalog(w.a.sellerId, w.a.a2, db)).toEqual({ mode: "all", productIds: [p.a2, p.a1] });
    expect(await storeSellsProduct(w.a.a2, p.a1, db)).toBe(true);
  });

  it("checkout guard: lists cart products the store stopped showing", async () => {
    const [cart] = await db
      .insert(s.carts)
      .values({ userId: w.a.sellerId, storeId: w.a.a2, storeSellerId: w.a.sellerId, status: "active", currency: "EGP" })
      .returning({ id: s.carts.id });
    await db.insert(s.cartItems).values([
      { cartId: cart!.id, productId: p.a1, sellerId: w.a.sellerId, quantity: 1, price: "10" },
      { cartId: cart!.id, productId: p.a2, sellerId: w.a.sellerId, quantity: 1, price: "10" },
    ]);
    try {
      await setStoreCatalog(w.a.sellerId, w.a.a2, { mode: "all", productIds: [p.a2] }, db);
      expect(await cartProductsOutsideStoreCatalog(cart!.id, db)).toEqual([]);
      await setStoreCatalog(w.a.sellerId, w.a.a2, { mode: "selected", productIds: [p.a2] }, db);
      expect(await cartProductsOutsideStoreCatalog(cart!.id, db)).toEqual([p.a1]);
    } finally {
      await db.delete(s.carts).where(eq(s.carts.id, cart!.id));
    }
  });

  it("refuses an empty selection and writes to archived stores", async () => {
    expect(await setStoreCatalog(w.a.sellerId, w.a.a2, { mode: "selected", productIds: [] }, db)).toEqual({
      success: false,
      error: "empty_selection",
    });
    expect((await archiveStore(w.a.sellerId, w.a.a2, db)).success).toBe(true);
    expect(await setStoreCatalog(w.a.sellerId, w.a.a2, { mode: "selected", productIds: [p.a1] }, db)).toEqual({
      success: false,
      error: "store_read_only",
    });
    await db.update(s.stores).set({ status: "active" }).where(eq(s.stores.id, w.a.a2));
  });
});
