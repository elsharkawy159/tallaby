import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as s from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "./isolation.fixtures";
import { setStoreCatalog } from "./catalog.server";
import { isSwitchOn } from "./platform-switches.server";
import {
  assertStoreProduct,
  primaryStoreId,
  productInStore,
  storeHasProduct,
  storeOwnedBy,
  type ProductStoreScope,
} from "./store-scope.server";

/**
 * Fully separate stores, tenant isolation suite (ROADMAP.md F-87a; plan §4).
 * World: seller S1 with stores A (primary) and B, seller S2 with one store.
 * Phase A checks the guards on today's data (before the catalog split, so
 * `catalogSplit: false`); later phases add a case per store-scoped path
 * (products, taxonomy, coupons, wallet, top-ups, activation).
 * Skipped without TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("store separation isolation (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: s });
  let w: IsolationWorld;
  let categoryId: string;
  const ids = { s1: "", storeA: "", storeB: "", s2: "", storeS2: "" };
  const p = { s1a: "", s1b: "", s2: "" };

  async function insertProduct(sellerId: string) {
    const [row] = await db
      .insert(s.products)
      .values({ sellerId, categoryId, status: "active", quantity: "3", sku: `sep-${randomUUID().slice(0, 8)}` })
      .returning({ id: s.products.id });
    return row!.id;
  }

  beforeAll(async () => {
    w = await createIsolationWorld(db);
    ids.s1 = w.a.sellerId;
    ids.storeA = w.a.a1;
    ids.storeB = w.a.a2;
    ids.s2 = w.b.sellerId;
    ids.storeS2 = w.b.b1;
    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1);
    categoryId = category!.id;
    p.s1a = await insertProduct(ids.s1);
    p.s1b = await insertProduct(ids.s1);
    p.s2 = await insertProduct(ids.s2);
    // Store B shows only s1b; store A stays in 'all' mode.
    const picked = await setStoreCatalog(ids.s1, ids.storeB, { mode: "selected", productIds: [p.s1b] }, db);
    if (!picked.success) throw new Error(`fixture catalog failed: ${picked.error}`);
  }, 60_000);

  afterAll(async () => {
    if (w) {
      await db.delete(s.products).where(inArray(s.products.sellerId, [ids.s1, ids.s2]));
      await w.cleanup();
    }
    await client.end();
  });

  it("primaryStoreId returns each seller's own primary store", async () => {
    expect(await primaryStoreId(db, ids.s1)).toBe(ids.storeA);
    expect(await primaryStoreId(db, ids.s2)).toBe(ids.storeS2);
    expect(await primaryStoreId(db, randomUUID())).toBeNull();
  });

  it("the stores_one_primary index that serves primaryStoreId exists", async () => {
    const rows = await db.execute(
      sql`SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'stores_one_primary'`,
    );
    expect(JSON.stringify(rows)).toContain("WHERE is_primary");
  });

  it("storeOwnedBy: S1 owns A and B, not S2's store; S2 owns none of S1's", async () => {
    expect(await storeOwnedBy(ids.s1, ids.storeA, db)).toBe(true);
    expect(await storeOwnedBy(ids.s1, ids.storeB, db)).toBe(true);
    expect(await storeOwnedBy(ids.s1, ids.storeS2, db)).toBe(false);
    expect(await storeOwnedBy(ids.s2, ids.storeA, db)).toBe(false);
    expect(await storeOwnedBy(ids.s2, ids.storeB, db)).toBe(false);
  });

  it("assertStoreProduct (before the split): 'all' store has every S1 product, 'selected' only its picks", async () => {
    const before = { q: db, catalogSplit: false };
    expect(await storeHasProduct(ids.storeA, p.s1a, before)).toBe(true);
    expect(await storeHasProduct(ids.storeA, p.s1b, before)).toBe(true);
    expect(await storeHasProduct(ids.storeB, p.s1b, before)).toBe(true);
    expect(await storeHasProduct(ids.storeB, p.s1a, before)).toBe(false);
    await expect(assertStoreProduct(ids.storeB, p.s1a, before)).rejects.toMatchObject({ code: "product_not_in_store" });
  });

  it("assertStoreProduct never crosses sellers", async () => {
    const before = { q: db, catalogSplit: false };
    expect(await storeHasProduct(ids.storeA, p.s2, before)).toBe(false);
    expect(await storeHasProduct(ids.storeS2, p.s1a, before)).toBe(false);
    await expect(assertStoreProduct(ids.storeS2, p.s1a, before)).rejects.toMatchObject({ code: "product_not_in_store" });
  });

  it("after the split the guard reads products.store_id (none set yet, so nothing matches)", async () => {
    expect(await storeHasProduct(ids.storeA, p.s1a, { q: db, catalogSplit: true })).toBe(false);
  });

  // ── F-87c slice 1: dashboard product writes ─────────────────────────────
  // The dashboard runs requireStore (storeOwnedBy for the session seller), then
  // puts productInStore(store, { scope: "managed" }) in the WHERE of every
  // update, status, trash, restore and bulk edit write (product-store.server.ts,
  // trash.server.ts, bulk-edit.server.ts). These run that same WHERE.

  /** One guarded write as the actions do it; returns the ids it changed. */
  async function guardedWrite(
    sellerId: string,
    storeId: string,
    productIds: string[],
    kind: "update" | "status" | "trash" | "restore" | "bulk",
    { catalogSplit = false, scope = "managed" as ProductStoreScope } = {},
  ): Promise<string[]> {
    // requireStore first: a store that is not the session seller's is refused before any write.
    if (!(await storeOwnedBy(sellerId, storeId, db))) return [];
    const inStore = productInStore(storeId, { catalogSplit, scope });
    const now = new Date().toISOString();
    const set =
      kind === "trash"
        ? { trashedStatus: sql`${s.products.status}`, status: "draft" as const, deletedAt: now, updatedAt: now }
        : kind === "restore"
          ? { status: "active" as const, deletedAt: null, trashedStatus: null, updatedAt: now }
          : kind === "status"
            ? { status: "draft" as const, updatedAt: now }
            : { quantity: "7", updatedAt: now };
    const trashState =
      kind === "restore" ? isNotNull(s.products.deletedAt) : isNull(s.products.deletedAt);
    const rows = await db
      .update(s.products)
      .set(set)
      .where(and(eq(s.products.sellerId, sellerId), inArray(s.products.id, productIds), trashState, inStore))
      .returning({ id: s.products.id });
    return rows.map((r) => r.id);
  }

  it("S1 cannot update, set status, trash, restore or bulk edit S2's product through its own stores", async () => {
    for (const store of [ids.storeA, ids.storeB]) {
      for (const kind of ["update", "status", "trash", "bulk"] as const) {
        expect(await guardedWrite(ids.s1, store, [p.s2], kind)).toEqual([]);
      }
    }
    // Restore: put S2's product in Trash as S2 (its own store), then S1 tries to restore it.
    expect(await guardedWrite(ids.s2, ids.storeS2, [p.s2], "trash")).toEqual([p.s2]);
    expect(await guardedWrite(ids.s1, ids.storeA, [p.s2], "restore")).toEqual([]);
    expect(await guardedWrite(ids.s2, ids.storeS2, [p.s2], "restore")).toEqual([p.s2]);
  });

  it("a forged storeId that is S2's is refused for S1, even with S1's own product ids", async () => {
    expect(await storeOwnedBy(ids.s1, ids.storeS2, db)).toBe(false);
    for (const kind of ["update", "status", "trash", "bulk"] as const) {
      expect(await guardedWrite(ids.s1, ids.storeS2, [p.s1a, p.s1b], kind)).toEqual([]);
    }
    // And the condition alone (no session check) still never crosses sellers.
    const crossed = await db
      .select({ id: s.products.id })
      .from(s.products)
      .where(and(inArray(s.products.id, [p.s1a, p.s1b]), productInStore(ids.storeS2, { catalogSplit: false, scope: "managed" })));
    expect(crossed).toEqual([]);
  });

  it("before the split, managed scope keeps today's account rule: store B (selected mode) manages every S1 product", async () => {
    expect(await storeHasProduct(ids.storeB, p.s1a, { q: db, catalogSplit: false, scope: "managed" })).toBe(true);
    expect((await guardedWrite(ids.s1, ids.storeB, [p.s1a, p.s1b, p.s2], "bulk")).sort()).toEqual([p.s1a, p.s1b].sort());
    // The storefront meaning (shown) still follows the picks.
    expect(await storeHasProduct(ids.storeB, p.s1a, { q: db, catalogSplit: false, scope: "shown" })).toBe(false);
  });

  it("after the split (catalogSplit: true): a store A product cannot be changed through store B", async () => {
    await db.update(s.products).set({ storeId: ids.storeA }).where(eq(s.products.id, p.s1a));
    await db.update(s.products).set({ storeId: ids.storeB }).where(eq(s.products.id, p.s1b));
    const split = { catalogSplit: true };
    for (const kind of ["update", "status", "trash", "bulk"] as const) {
      expect(await guardedWrite(ids.s1, ids.storeB, [p.s1a], kind, split)).toEqual([]);
    }
    expect(await storeHasProduct(ids.storeB, p.s1a, { q: db, catalogSplit: true, scope: "managed" })).toBe(false);
    expect(await storeHasProduct(ids.storeA, p.s1a, { q: db, catalogSplit: true, scope: "managed" })).toBe(true);
    // Bulk with both ids through B touches only B's product.
    expect(await guardedWrite(ids.s1, ids.storeB, [p.s1a, p.s1b], "bulk", split)).toEqual([p.s1b]);
    // A store_id forged onto another seller's store still fails the seller match.
    await db.update(s.products).set({ storeId: ids.storeS2 }).where(eq(s.products.id, p.s1b)).catch(() => {});
    expect(await storeHasProduct(ids.storeS2, p.s1b, { q: db, catalogSplit: true })).toBe(false);
    await db.update(s.products).set({ storeId: null }).where(inArray(s.products.id, [p.s1a, p.s1b]));
  });

  // ── F-87c slice 2: dashboard product reads ──────────────────────────────
  // The /stores/[storeId]/products pages (list, tab counts, export, ids, search,
  // sidebar count, inventory, trash) put the same `inStore` next to the
  // seller's own conditions (products-list.query.ts baseConditions,
  // trash.server.ts listTrashedProducts). This runs that WHERE.

  /** The ids a store's Products list (or its Trash) shows, as the dashboard reads them. */
  async function listedIds(sellerId: string, storeId: string, { catalogSplit = false, trash = false } = {}) {
    if (!(await storeOwnedBy(sellerId, storeId, db))) return [];
    const rows = await db
      .select({ id: s.products.id })
      .from(s.products)
      .where(
        and(
          eq(s.products.sellerId, sellerId),
          trash ? isNotNull(s.products.deletedAt) : isNull(s.products.deletedAt),
          productInStore(storeId, { catalogSplit, scope: "managed" }),
        ),
      );
    return rows.map((r) => r.id).sort();
  }

  it("before the split, every store of S1 lists the whole account catalog (today's list), never S2's", async () => {
    const mine = [p.s1a, p.s1b].sort();
    expect(await listedIds(ids.s1, ids.storeA)).toEqual(mine);
    expect(await listedIds(ids.s1, ids.storeB)).toEqual(mine);
    expect(await listedIds(ids.s1, ids.storeS2)).toEqual([]);
    expect(await listedIds(ids.s2, ids.storeA)).toEqual([]);
  });

  it("with the switch on (catalogSplit: true), store B's list, counts and Trash never contain a store A product", async () => {
    await db.update(s.products).set({ storeId: ids.storeA }).where(eq(s.products.id, p.s1a));
    await db.update(s.products).set({ storeId: ids.storeB }).where(eq(s.products.id, p.s1b));
    try {
      const split = { catalogSplit: true };
      expect(await listedIds(ids.s1, ids.storeB, split)).toEqual([p.s1b]);
      expect(await listedIds(ids.s1, ids.storeA, split)).toEqual([p.s1a]);
      // The tab count reads the same WHERE.
      const [count] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(s.products)
        .where(and(eq(s.products.sellerId, ids.s1), isNull(s.products.deletedAt), productInStore(ids.storeB, { catalogSplit: true, scope: "managed" })));
      expect(count!.n).toBe(1);
      // The edit page loader: a store A product through store B is not found.
      expect(await storeHasProduct(ids.storeB, p.s1a, { q: db, catalogSplit: true, scope: "managed" })).toBe(false);
      // Trash: store A's trashed product is not in store B's Trash.
      await db.update(s.products).set({ deletedAt: new Date().toISOString() }).where(eq(s.products.id, p.s1a));
      expect(await listedIds(ids.s1, ids.storeB, { ...split, trash: true })).toEqual([]);
      expect(await listedIds(ids.s1, ids.storeA, { ...split, trash: true })).toEqual([p.s1a]);
      // A forged store (S2's) lists nothing for S1.
      expect(await listedIds(ids.s1, ids.storeS2, split)).toEqual([]);
    } finally {
      await db.update(s.products).set({ storeId: null, deletedAt: null }).where(inArray(s.products.id, [p.s1a, p.s1b]));
    }
  });

  // ── F-87c slice 3: secondary product features ───────────────────────────
  // Quantity offers, cross-sells, the inventory restock, seller-added reviews
  // (social proof) and coupon product targets: each dashboard action runs
  // requireProductStore (storeOwnedBy for the session seller) and puts the same
  // productInStore(store, { scope: "managed" }) in the product read or write
  // that gates it (quantity-offers.server.ts, cross-sell.server.ts,
  // inventory.server.ts, social-proof.server.ts, actions/coupons.ts). These run
  // those statements against real rows and check what got written.

  /** The ids of `productIds` the action may touch through `storeId`, as its gating read does. */
  async function gatedIds(sellerId: string, storeId: string, productIds: string[], catalogSplit = false): Promise<string[]> {
    if (!(await storeOwnedBy(sellerId, storeId, db))) return [];
    const rows = await db
      .select({ id: s.products.id })
      .from(s.products)
      .where(
        and(
          eq(s.products.sellerId, sellerId),
          inArray(s.products.id, productIds),
          isNull(s.products.deletedAt),
          productInStore(storeId, { catalogSplit, scope: "managed" }),
        ),
      );
    return rows.map((r) => r.id).sort();
  }

  /** saveQuantityOffers: the product read inside the store, then the tiers. Returns whether it wrote. */
  async function saveQuantityOffer(sellerId: string, storeId: string, productId: string, catalogSplit = false) {
    const found = await gatedIds(sellerId, storeId, [productId], catalogSplit);
    if (found.length !== 1) return false;
    await db
      .insert(s.productQuantityOffers)
      .values({ sellerId, productId, minQuantity: 2, discountType: "percent", discountValue: "10.00" });
    return true;
  }

  /** addCrossSell: both products inside the store (not only the same seller), then the offer. */
  async function addCrossSellOffer(sellerId: string, storeId: string, productId: string, offerProductId: string, catalogSplit = false) {
    const found = await gatedIds(sellerId, storeId, [productId, offerProductId], catalogSplit);
    if (found.length !== 2) return false;
    const rows = await db
      .insert(s.productCrossSells)
      .values({ sellerId, productId, offerProductId, discountType: "percent", discountValue: "10.00" })
      .onConflictDoNothing()
      .returning({ id: s.productCrossSells.id });
    return rows.length === 1;
  }

  /** restockAction: one atomic `+ n` with the store condition in the same WHERE. */
  async function restock(sellerId: string, storeId: string, productId: string, add: number, catalogSplit = false) {
    if (!(await storeOwnedBy(sellerId, storeId, db))) return false;
    const rows = await db
      .update(s.products)
      .set({ quantity: sql`${s.products.quantity} + ${add}` })
      .where(
        and(
          eq(s.products.id, productId),
          eq(s.products.sellerId, sellerId),
          isNull(s.products.deletedAt),
          productInStore(storeId, { catalogSplit, scope: "managed" }),
        ),
      )
      .returning({ id: s.products.id });
    return rows.length === 1;
  }

  /** saveProductSocialProof: the product UPDATE inside the store gates the seller-added review insert. */
  async function addSellerReview(sellerId: string, storeId: string, productId: string, catalogSplit = false) {
    if (!(await storeOwnedBy(sellerId, storeId, db))) return false;
    const updated = await db
      .update(s.products)
      .set({ showLiveViews: true })
      .where(and(eq(s.products.id, productId), eq(s.products.sellerId, sellerId), productInStore(storeId, { catalogSplit, scope: "managed" })))
      .returning({ id: s.products.id });
    if (!updated.length) return false;
    await db.insert(s.reviews).values({
      productId,
      sellerId,
      userId: null,
      source: "seller",
      status: "approved",
      reviewType: "product",
      rating: 5,
      reviewerName: "QA",
      isVerifiedPurchase: false,
    });
    return true;
  }

  /** saveSellerCoupon: every product target must be in the store, or the coupon is refused (invalid_products). */
  async function couponTargetsOk(sellerId: string, storeId: string, productIds: string[], catalogSplit = false) {
    return (await gatedIds(sellerId, storeId, productIds, catalogSplit)).length === productIds.length;
  }

  async function countFor(productIds: string[]) {
    const [offers, crossSells, sellerReviews] = await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(s.productQuantityOffers).where(inArray(s.productQuantityOffers.productId, productIds)),
      db.select({ n: sql<number>`count(*)::int` }).from(s.productCrossSells).where(inArray(s.productCrossSells.productId, productIds)),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(s.reviews)
        .where(and(inArray(s.reviews.productId, productIds), eq(s.reviews.source, "seller"))),
    ]);
    return { offers: offers[0]!.n, crossSells: crossSells[0]!.n, reviews: sellerReviews[0]!.n };
  }

  async function cleanupFeatures() {
    const all = [p.s1a, p.s1b, p.s2];
    await db.delete(s.productQuantityOffers).where(inArray(s.productQuantityOffers.productId, all));
    await db.delete(s.productCrossSells).where(inArray(s.productCrossSells.productId, all));
    await db.delete(s.reviews).where(and(inArray(s.reviews.productId, all), eq(s.reviews.source, "seller")));
  }

  async function quantityOf(productId: string) {
    const [row] = await db.select({ q: s.products.quantity }).from(s.products).where(eq(s.products.id, productId));
    return Number(row!.q);
  }

  it("slice 3: S1 can't add a quantity offer, cross-sell, stock, review or coupon target to S2's product, nor through S2's store", async () => {
    try {
      const s2Stock = await quantityOf(p.s2);
      for (const store of [ids.storeA, ids.storeB]) {
        expect(await saveQuantityOffer(ids.s1, store, p.s2)).toBe(false);
        expect(await addCrossSellOffer(ids.s1, store, p.s1a, p.s2)).toBe(false);
        expect(await restock(ids.s1, store, p.s2, 5)).toBe(false);
        expect(await addSellerReview(ids.s1, store, p.s2)).toBe(false);
        expect(await couponTargetsOk(ids.s1, store, [p.s1a, p.s2])).toBe(false);
      }
      // A forged pair: S2's store id with S1's own products is refused too.
      expect(await saveQuantityOffer(ids.s1, ids.storeS2, p.s1a)).toBe(false);
      expect(await addCrossSellOffer(ids.s1, ids.storeS2, p.s1a, p.s1b)).toBe(false);
      expect(await restock(ids.s1, ids.storeS2, p.s1a, 5)).toBe(false);
      expect(await addSellerReview(ids.s1, ids.storeS2, p.s1a)).toBe(false);
      expect(await couponTargetsOk(ids.s1, ids.storeS2, [p.s1a])).toBe(false);
      expect(await countFor([p.s1a, p.s1b, p.s2])).toEqual({ offers: 0, crossSells: 0, reviews: 0 });
      expect(await quantityOf(p.s2)).toBe(s2Stock);
    } finally {
      await cleanupFeatures();
    }
  });

  it("slice 3, before the split: every store of S1 manages every S1 product (today's rule)", async () => {
    try {
      const before = await quantityOf(p.s1a);
      // Store B (selected mode, shows only s1b) still manages s1a in the dashboard.
      expect(await saveQuantityOffer(ids.s1, ids.storeB, p.s1a)).toBe(true);
      expect(await addCrossSellOffer(ids.s1, ids.storeA, p.s1a, p.s1b)).toBe(true);
      expect(await restock(ids.s1, ids.storeB, p.s1a, 2)).toBe(true);
      expect(await addSellerReview(ids.s1, ids.storeA, p.s1b)).toBe(true);
      expect(await couponTargetsOk(ids.s1, ids.storeB, [p.s1a, p.s1b])).toBe(true);
      expect(await countFor([p.s1a, p.s1b])).toEqual({ offers: 1, crossSells: 1, reviews: 1 });
      expect(await quantityOf(p.s1a)).toBe(before + 2);
      await db.update(s.products).set({ quantity: String(before) }).where(eq(s.products.id, p.s1a));
    } finally {
      await cleanupFeatures();
    }
  });

  it("slice 3, with catalogSplit: true: a store A product gets nothing through store B, and a cross-sell can't pair two stores", async () => {
    await db.update(s.products).set({ storeId: ids.storeA }).where(eq(s.products.id, p.s1a));
    await db.update(s.products).set({ storeId: ids.storeB }).where(eq(s.products.id, p.s1b));
    try {
      const before = await quantityOf(p.s1a);
      expect(await saveQuantityOffer(ids.s1, ids.storeB, p.s1a, true)).toBe(false);
      expect(await addCrossSellOffer(ids.s1, ids.storeA, p.s1a, p.s1b, true)).toBe(false);
      expect(await addCrossSellOffer(ids.s1, ids.storeB, p.s1b, p.s1a, true)).toBe(false);
      expect(await restock(ids.s1, ids.storeB, p.s1a, 5, true)).toBe(false);
      expect(await addSellerReview(ids.s1, ids.storeB, p.s1a, true)).toBe(false);
      expect(await couponTargetsOk(ids.s1, ids.storeB, [p.s1b, p.s1a], true)).toBe(false);
      expect(await countFor([p.s1a, p.s1b])).toEqual({ offers: 0, crossSells: 0, reviews: 0 });
      expect(await quantityOf(p.s1a)).toBe(before);
      // Through its own store each still works.
      expect(await saveQuantityOffer(ids.s1, ids.storeA, p.s1a, true)).toBe(true);
      expect(await restock(ids.s1, ids.storeA, p.s1a, 1, true)).toBe(true);
      expect(await addSellerReview(ids.s1, ids.storeB, p.s1b, true)).toBe(true);
      expect(await couponTargetsOk(ids.s1, ids.storeB, [p.s1b], true)).toBe(true);
      await db.update(s.products).set({ quantity: String(before) }).where(eq(s.products.id, p.s1a));
    } finally {
      await cleanupFeatures();
      await db.update(s.products).set({ storeId: null }).where(inArray(s.products.id, [p.s1a, p.s1b]));
    }
  });

  it("both switches are off (or the table is not there yet)", async () => {
    expect(await isSwitchOn("stores_catalog_split", db)).toBe(false);
    expect(await isSwitchOn("stores_wallet_split", db)).toBe(false);
  });
});
