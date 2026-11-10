import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as s from "@workspace/db/schema";
import { agentCanUseStore } from "../agents/actor.lib";
import {
  AgentProductError,
  agentGetProduct,
  agentListStoreCategories,
  agentRestoreProducts,
  agentSearchProducts,
  agentSetProductStatus,
  agentTrashProducts,
  agentUpdateProduct,
  type AgentProductContext,
} from "../products/agent-products.server";
import { createIsolationWorld, type IsolationWorld } from "./isolation.fixtures";
import { cartProductsOutsideStoreCatalog, productsOutsideStore, setStoreCatalog, storeSellsProduct } from "./catalog.server";
import { isSwitchOn } from "./platform-switches.server";
import { storeHasVisibleProducts } from "./server";
import { sellerBrandList, storeCategoryGroups } from "../store-sites/catalog-data.server";
import { subscribeToStockAlert } from "../stock-alerts/stock-alerts.server";
import {
  assertStoreProduct,
  primaryStoreId,
  productInStore,
  productShownInStore,
  storeHasProduct,
  storeOwnedBy,
  taxonomyInStore,
  taxonomyItemsInStore,
  type ProductStoreScope,
  type TaxonomyScope,
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

/**
 * The agent product commands (slice 6) use the shared `db` and read the switch
 * themselves, so this suite points `DATABASE_URL` at the test database before
 * any import, and can force `stores_catalog_split` for those calls only (the
 * real row is never flipped; `null` reads it).
 */
const forced = vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  return { catalogSplit: null as boolean | null };
});
vi.mock("./platform-switches.server", async (original) => {
  const actual = await original<typeof import("./platform-switches.server")>();
  return {
    ...actual,
    isSwitchOn: (key: Parameters<typeof actual.isSwitchOn>[0], q?: Parameters<typeof actual.isSwitchOn>[1]) =>
      key === "stores_catalog_split" && forced.catalogSplit !== null ? Promise.resolve(forced.catalogSplit) : actual.isSwitchOn(key, q),
  };
});

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

  // ── F-87c slice 4: storefront reads ─────────────────────────────────────
  // Every store-host read (apps/ecommerce getProducts for grids, search and
  // builder lists, getProductBySlug + getProductIdBySlug for the product page,
  // storeCategoryGroups for category pages, storeHasVisibleProducts, reviews,
  // back-in-stock) adds productShownInStore({ storeId, catalogSplit }) next to
  // "this seller, active". These run the same conditions on real rows.

  const slug = `sep-slug-${randomUUID().slice(0, 8)}`;

  /** What a store host lists: its catalog grid, or with `search` the header search (title ILIKE). */
  async function storefrontIds(storeId: string, catalogSplit: boolean, search?: string) {
    const rows = await db
      .select({ id: s.products.id })
      .from(s.products)
      .where(
        and(
          eq(s.products.sellerId, ids.s1),
          eq(s.products.status, "active"),
          productShownInStore({ storeId, catalogSplit }),
          search
            ? sql`EXISTS (SELECT 1 FROM product_translations pt WHERE pt.product_id = ${s.products.id} AND pt.title ILIKE ${`%${search}%`})`
            : undefined,
        ),
      );
    return rows.map((r) => r.id).sort();
  }

  /** The product page: the slug lookup (per seller before the split, per store after) and the product read inside the store. */
  async function openBySlug(storeId: string, catalogSplit: boolean): Promise<string | null> {
    const shown = productShownInStore({ storeId, catalogSplit });
    const [hit] = await db
      .select({ id: s.productTranslations.productId })
      .from(s.productTranslations)
      .innerJoin(s.products, eq(s.products.id, s.productTranslations.productId))
      .where(
        and(
          eq(s.productTranslations.slug, slug),
          eq(s.productTranslations.locale, "en"),
          eq(s.products.status, "active"),
          eq(s.products.sellerId, ids.s1),
          catalogSplit ? shown : undefined,
        ),
      )
      .orderBy(s.products.createdAt, s.products.id)
      .limit(1);
    if (!hit) return null;
    const [row] = await db
      .select({ id: s.products.id })
      .from(s.products)
      .where(and(eq(s.products.id, hit.id), eq(s.products.sellerId, ids.s1), eq(s.products.status, "active"), shown))
      .limit(1);
    return row?.id ?? null;
  }

  async function withStorefrontRows(run: () => Promise<void>) {
    // Both S1 products carry the same slug and a searchable title (a copy keeps its slug); s1a is the older one.
    await db.update(s.products).set({ createdAt: "2020-01-01T00:00:00Z" }).where(eq(s.products.id, p.s1a));
    await db.update(s.products).set({ createdAt: "2020-02-01T00:00:00Z" }).where(eq(s.products.id, p.s1b));
    await db.insert(s.productTranslations).values([
      { productId: p.s1a, locale: "en", title: `${slug} lamp`, slug },
      { productId: p.s1b, locale: "en", title: `${slug} lamp`, slug },
    ]);
    try {
      await run();
    } finally {
      await db.delete(s.productTranslations).where(inArray(s.productTranslations.productId, [p.s1a, p.s1b]));
      await db.update(s.products).set({ storeId: null }).where(inArray(s.products.id, [p.s1a, p.s1b]));
    }
  }

  it("slice 4, switch off: the storefront keeps today's catalog (store A all, store B only its pick)", async () => {
    await withStorefrontRows(async () => {
      expect(await storefrontIds(ids.storeA, false)).toEqual([p.s1a, p.s1b].sort());
      expect(await storefrontIds(ids.storeB, false)).toEqual([p.s1b]);
      expect(await storefrontIds(ids.storeB, false, slug)).toEqual([p.s1b]);
      expect(await storefrontIds(ids.storeS2, false)).toEqual([]);
      // Product page: the per-seller lookup finds the older s1a; store B doesn't show it, so the page opens nothing (as today).
      expect(await openBySlug(ids.storeA, false)).toBe(p.s1a);
      expect(await openBySlug(ids.storeB, false)).toBeNull();
      // Category page and the "has products" check, through the shared condition on the aliased SQL.
      const groupsB = await storeCategoryGroups(ids.s1, { storeId: ids.storeB, catalogSplit: false }, db);
      expect(groupsB.flatMap((g) => g.productIds)).toEqual([p.s1b]);
      const groupsA = await storeCategoryGroups(ids.s1, { storeId: ids.storeA, catalogSplit: false }, db);
      expect(groupsA.flatMap((g) => g.productIds).sort()).toEqual([p.s1a, p.s1b].sort());
      expect(await storeHasVisibleProducts(ids.s1, ids.storeB, { catalogSplit: false, q: db })).toBe(true);
      expect(await storeHasVisibleProducts(ids.s2, ids.storeB, { catalogSplit: false, q: db })).toBe(false);
      // Back-in-stock (reads the switch, off here): store B can't follow s1a; s1b is found (and in stock).
      const alert = { sellerId: ids.s1, variantId: null, email: "sep@example.test", locale: "en" };
      expect(await subscribeToStockAlert({ ...alert, storeId: ids.storeB, productId: p.s1a }, db)).toEqual({ ok: false, error: "notFound" });
      expect(await subscribeToStockAlert({ ...alert, storeId: ids.storeB, productId: p.s1b }, db)).toEqual({ ok: false, error: "inStock" });
      expect(await subscribeToStockAlert({ ...alert, storeId: ids.storeS2, productId: p.s1b }, db)).toEqual({ ok: false, error: "notFound" });
    });
  });

  it("slice 4, switch on: store B's catalog, product page, category page and search never return store A's product", async () => {
    await withStorefrontRows(async () => {
      await db.update(s.products).set({ storeId: ids.storeA }).where(eq(s.products.id, p.s1a));
      await db.update(s.products).set({ storeId: ids.storeB }).where(eq(s.products.id, p.s1b));
      // Store B in selected mode with its own product; store A in 'all' mode: the mode no longer matters.
      expect(await storefrontIds(ids.storeB, true)).toEqual([p.s1b]);
      expect(await storefrontIds(ids.storeA, true)).toEqual([p.s1a]);
      expect(await storefrontIds(ids.storeB, true, slug)).toEqual([p.s1b]);
      expect(await storefrontIds(ids.storeA, true, slug)).toEqual([p.s1a]);
      // The shared slug opens each store's own copy (store A's older product never shadows B's).
      expect(await openBySlug(ids.storeB, true)).toBe(p.s1b);
      expect(await openBySlug(ids.storeA, true)).toBe(p.s1a);
      expect(await openBySlug(ids.storeS2, true)).toBeNull();
      const groupsB = await storeCategoryGroups(ids.s1, { storeId: ids.storeB, catalogSplit: true }, db);
      expect(groupsB.flatMap((g) => g.productIds)).toEqual([p.s1b]);
      const groupsA = await storeCategoryGroups(ids.s1, { storeId: ids.storeA, catalogSplit: true }, db);
      expect(groupsA.flatMap((g) => g.productIds)).toEqual([p.s1a]);
      // A store whose products all moved away has nothing to show.
      await db.update(s.products).set({ storeId: ids.storeA }).where(eq(s.products.id, p.s1b));
      expect(await storeHasVisibleProducts(ids.s1, ids.storeB, { catalogSplit: true, q: db })).toBe(false);
      expect(await storefrontIds(ids.storeB, true)).toEqual([]);
      expect(await openBySlug(ids.storeB, true)).toBeNull();
    });
  });

  // ── F-87c slice 5: cart and checkout ────────────────────────────────────
  // addToCart runs storeSellsProduct(cart's store, product); createOrder runs
  // cartProductsOutsideStoreCatalog(cart); placeOrderFromCart runs
  // productsOutsideStore(cart's store, lines, tx) inside its transaction, before
  // the stock decrement. These run those checks on a real store-B cart. (The
  // full placeOrderFromCart is not run here: it reads the shared switch row, and
  // the suite never flips it.)

  async function withStoreBCart(productIds: string[], run: (cartId: string) => Promise<void>) {
    const [cart] = await db
      .insert(s.carts)
      .values({ userId: w.a.sellerId, status: "active", currency: "EGP", storeId: ids.storeB, storeSellerId: ids.s1 })
      .returning({ id: s.carts.id });
    try {
      for (const productId of productIds) {
        await db.insert(s.cartItems).values({ cartId: cart!.id, productId, sellerId: ids.s1, quantity: 1, price: "10.00" });
      }
      await run(cart!.id);
    } finally {
      await db.delete(s.cartItems).where(eq(s.cartItems.cartId, cart!.id));
      await db.delete(s.carts).where(eq(s.carts.id, cart!.id));
    }
  }

  /** The place-order check, in a transaction as placeOrderFromCart runs it. */
  async function placeOrderCheck(productIds: string[], catalogSplit: boolean) {
    return db.transaction((tx) => productsOutsideStore(ids.storeB, productIds, tx as never, { catalogSplit }));
  }

  it("slice 5, switch off: store B (selected mode) sells only its pick, at add and at checkout (today's rule)", async () => {
    const off = { catalogSplit: false };
    expect(await storeSellsProduct(ids.storeB, p.s1b, db as never, off)).toBe(true);
    expect(await storeSellsProduct(ids.storeB, p.s1a, db as never, off)).toBe(false);
    expect(await storeSellsProduct(ids.storeA, p.s1a, db as never, off)).toBe(true);
    expect(await storeSellsProduct(ids.storeB, p.s2, db as never, off)).toBe(false);
    await withStoreBCart([p.s1b, p.s1a], async (cartId) => {
      expect(await cartProductsOutsideStoreCatalog(cartId, db as never, off)).toEqual([p.s1a]);
      expect(await placeOrderCheck([p.s1b, p.s1a], false)).toEqual([p.s1a]);
      expect(await placeOrderCheck([p.s1b], false)).toEqual([]);
    });
  });

  it("slice 5, switch on: a store B cart holding store A's product is refused at add and at place-order", async () => {
    await db.update(s.products).set({ storeId: ids.storeA }).where(eq(s.products.id, p.s1a));
    await db.update(s.products).set({ storeId: ids.storeB }).where(eq(s.products.id, p.s1b));
    try {
      const on = { catalogSplit: true };
      expect(await storeSellsProduct(ids.storeB, p.s1a, db as never, on)).toBe(false);
      expect(await storeSellsProduct(ids.storeB, p.s1b, db as never, on)).toBe(true);
      expect(await storeSellsProduct(ids.storeA, p.s1a, db as never, on)).toBe(true);
      // Store A is in 'all' mode, but after the split it no longer sells store B's product.
      expect(await storeSellsProduct(ids.storeA, p.s1b, db as never, on)).toBe(false);
      await withStoreBCart([p.s1b, p.s1a], async (cartId) => {
        expect(await cartProductsOutsideStoreCatalog(cartId, db as never, on)).toEqual([p.s1a]);
        expect(await placeOrderCheck([p.s1b, p.s1a], true)).toEqual([p.s1a]);
        expect(await placeOrderCheck([p.s1b], true)).toEqual([]);
      });
    } finally {
      await db.update(s.products).set({ storeId: null }).where(inArray(s.products.id, [p.s1a, p.s1b]));
    }
  });

  // ── F-87c slice 6: MCP and in-app agent product commands ────────────────
  // The MCP wrapper refuses a store outside the grant (agentCanUseStore); then
  // every command (agent-products.server.ts) loads the store for the token's
  // seller and puts productInStore(store, { scope: "shown" }) in its read and
  // its write. These call the real commands.

  const noUpload = async () => ({ ok: false as const, reason: "no uploads in tests" });
  const agentCtx = (sellerId: string, storeId: string): AgentProductContext => ({ sellerId, userId: sellerId, sellerStatus: "approved", storeId });
  const refusedWith = (code: string) => expect.objectContaining({ name: "AgentProductError", code });

  async function withAgentSwitch(catalogSplit: boolean, run: () => Promise<void>) {
    forced.catalogSplit = catalogSplit;
    try {
      await run();
    } finally {
      forced.catalogSplit = null;
      await db.update(s.products).set({ storeId: null }).where(inArray(s.products.id, [p.s1a, p.s1b]));
    }
  }

  it("slice 6: a grant limited to store A can't name store B (the MCP wrapper's check)", () => {
    const grant = { storeIds: [ids.storeA] };
    expect(agentCanUseStore(grant, ids.storeA)).toBe(true);
    expect(agentCanUseStore(grant, ids.storeB)).toBe(false);
    expect(agentCanUseStore(grant, ids.storeS2)).toBe(false);
  });

  it("slice 6, switch on: an agent update, status or trash through store B refuses store A's product", async () => {
    await withAgentSwitch(true, async () => {
      await db.update(s.products).set({ storeId: ids.storeA }).where(eq(s.products.id, p.s1a));
      await db.update(s.products).set({ storeId: ids.storeB }).where(eq(s.products.id, p.s1b));
      const [before] = await db.select({ quantity: s.products.quantity, status: s.products.status }).from(s.products).where(eq(s.products.id, p.s1a));
      const throughB = agentCtx(ids.s1, ids.storeB);

      await expect(agentUpdateProduct(throughB, { storeId: ids.storeB, productId: p.s1a, quantity: 99 }, noUpload)).rejects.toEqual(refusedWith("not_found"));
      await expect(agentSetProductStatus(throughB, p.s1a, "draft")).rejects.toEqual(refusedWith("not_found"));
      await expect(agentGetProduct(throughB, p.s1a)).rejects.toBeInstanceOf(AgentProductError);
      expect((await agentTrashProducts(throughB, [p.s1a])).trashed).toEqual([]);
      expect((await agentRestoreProducts(throughB, [p.s1a])).restored).toEqual([]);
      // Store A is in 'all' mode, but after the split its search lists only its own product.
      expect((await agentSearchProducts(agentCtx(ids.s1, ids.storeA), { storeId: ids.storeA, limit: 50, cursor: 0 })).items.map((r) => r.id)).toEqual([p.s1a]);
      expect((await agentSearchProducts(throughB, { storeId: ids.storeB, limit: 50, cursor: 0 })).items.map((r) => r.id)).toEqual([p.s1b]);
      // Store B still reads its own product.
      expect((await agentGetProduct(throughB, p.s1b)).id).toBe(p.s1b);

      const [after] = await db.select({ quantity: s.products.quantity, status: s.products.status }).from(s.products).where(eq(s.products.id, p.s1a));
      expect(after).toEqual(before);
    });
  });

  it("slice 6: a forged store id (another seller's store, or S1's store under S2) is refused before any read or write", async () => {
    for (const catalogSplit of [false, true]) {
      await withAgentSwitch(catalogSplit, async () => {
        const forgedStore = agentCtx(ids.s1, ids.storeS2);
        const forgedSeller = agentCtx(ids.s2, ids.storeB);
        await expect(agentUpdateProduct(forgedStore, { storeId: ids.storeS2, productId: p.s2, quantity: 99 }, noUpload)).rejects.toEqual(refusedWith("not_found"));
        await expect(agentUpdateProduct(forgedSeller, { storeId: ids.storeB, productId: p.s1b, quantity: 99 }, noUpload)).rejects.toEqual(refusedWith("not_found"));
        await expect(agentSetProductStatus(forgedSeller, p.s1b, "draft")).rejects.toEqual(refusedWith("not_found"));
        await expect(agentTrashProducts(forgedStore, [p.s2])).rejects.toEqual(refusedWith("not_found"));
        await expect(agentSearchProducts(forgedSeller, { storeId: ids.storeB, limit: 50, cursor: 0 })).rejects.toEqual(refusedWith("not_found"));
      });
    }
    const [row] = await db.select({ quantity: s.products.quantity, status: s.products.status, deletedAt: s.products.deletedAt }).from(s.products).where(eq(s.products.id, p.s2));
    expect(row).toMatchObject({ status: "active", deletedAt: null });
  });

  it("slice 6, switch off: the agent keeps today's rule (store B in selected mode reaches only its pick)", async () => {
    await withAgentSwitch(false, async () => {
      const throughB = agentCtx(ids.s1, ids.storeB);
      await expect(agentSetProductStatus(throughB, p.s1a, "draft")).rejects.toEqual(refusedWith("not_found"));
      expect((await agentSearchProducts(throughB, { storeId: ids.storeB, limit: 50, cursor: 0 })).items.map((r) => r.id)).toEqual([p.s1b]);
      const all = (await agentSearchProducts(agentCtx(ids.s1, ids.storeA), { storeId: ids.storeA, limit: 50, cursor: 0 })).items.map((r) => r.id).sort();
      expect(all).toEqual([p.s1a, p.s1b].sort());
    });
  });

  // ── F-87d: seller categories and brands per store ───────────────────────
  // The dashboard taxonomy actions run requireStore (storeOwnedBy for the
  // session seller), then `taxonomyInStore` in the WHERE of every list, edit
  // and delete, and `taxonomyItemsInStore` + `productInStore(managed)` before a
  // product gets a category (categories-brands.server.ts). These run the same
  // statements; the agent commands are called for real.

  const tax = { catA: "", catB: "", brandA: "", catS2: "" };

  async function withTaxonomy(run: () => Promise<void>) {
    const tag = randomUUID().slice(0, 8);
    const [catA] = await db.insert(s.sellerProductCategories).values({ sellerId: ids.s1, storeId: ids.storeA, name: `A cat ${tag}` }).returning({ id: s.sellerProductCategories.id });
    const [catB] = await db.insert(s.sellerProductCategories).values({ sellerId: ids.s1, storeId: ids.storeB, name: `B cat ${tag}` }).returning({ id: s.sellerProductCategories.id });
    const [brandA] = await db.insert(s.sellerProductBrands).values({ sellerId: ids.s1, storeId: ids.storeA, name: `A brand ${tag}` }).returning({ id: s.sellerProductBrands.id });
    const [catS2] = await db.insert(s.sellerProductCategories).values({ sellerId: ids.s2, storeId: ids.storeS2, name: `S2 cat ${tag}` }).returning({ id: s.sellerProductCategories.id });
    Object.assign(tax, { catA: catA!.id, catB: catB!.id, brandA: brandA!.id, catS2: catS2!.id });
    try {
      await run();
    } finally {
      forced.catalogSplit = null;
      await db.update(s.products).set({ storeId: null, sellerCategoryId: null, sellerBrandId: null }).where(inArray(s.products.id, [p.s1a, p.s1b, p.s2]));
      await db.delete(s.sellerProductCategories).where(inArray(s.sellerProductCategories.id, [tax.catA, tax.catB, tax.catS2]));
      await db.delete(s.sellerProductBrands).where(eq(s.sellerProductBrands.id, tax.brandA));
    }
  }

  const scopeOf = (sellerId: string, storeId: string, catalogSplit: boolean): TaxonomyScope => ({ sellerId, storeId, catalogSplit });

  /** The store's category list as the page loads it (after requireStore). */
  async function listedCategories(sellerId: string, storeId: string, catalogSplit: boolean): Promise<string[]> {
    if (!(await storeOwnedBy(sellerId, storeId, db))) return [];
    const rows = await db
      .select({ id: s.sellerProductCategories.id })
      .from(s.sellerProductCategories)
      .where(taxonomyInStore(s.sellerProductCategories, scopeOf(sellerId, storeId, catalogSplit)));
    return rows.map((r) => r.id);
  }

  /** Rename one category through a store, as updateTaxonomyItem does; returns the ids changed. */
  async function renameCategory(sellerId: string, storeId: string, id: string, catalogSplit: boolean): Promise<string[]> {
    if (!(await storeOwnedBy(sellerId, storeId, db))) return [];
    const rows = await db
      .update(s.sellerProductCategories)
      .set({ nameAr: "x" })
      .where(and(eq(s.sellerProductCategories.id, id), taxonomyInStore(s.sellerProductCategories, scopeOf(sellerId, storeId, catalogSplit))))
      .returning({ id: s.sellerProductCategories.id });
    await db.update(s.sellerProductCategories).set({ nameAr: null }).where(eq(s.sellerProductCategories.id, id));
    return rows.map((r) => r.id);
  }

  /** setProductSellerTaxonomy: true when the product now has the category and brand. */
  async function assign(
    sellerId: string,
    storeId: string,
    productId: string,
    ids_: { sellerCategoryId?: string | null; sellerBrandId?: string | null },
    catalogSplit: boolean,
  ): Promise<boolean> {
    if (!(await storeOwnedBy(sellerId, storeId, db))) return false;
    if (!(await taxonomyItemsInStore(scopeOf(sellerId, storeId, catalogSplit), ids_, db))) return false;
    const rows = await db
      .update(s.products)
      .set({ sellerCategoryId: ids_.sellerCategoryId ?? null, sellerBrandId: ids_.sellerBrandId ?? null })
      .where(and(eq(s.products.id, productId), eq(s.products.sellerId, sellerId), productInStore(storeId, { catalogSplit, scope: "managed" })))
      .returning({ id: s.products.id });
    return rows.length === 1;
  }

  it("F-87d, switch on: store B can't list, edit or assign store A's category or brand", async () => {
    await withTaxonomy(async () => {
      await db.update(s.products).set({ storeId: ids.storeA }).where(eq(s.products.id, p.s1a));
      await db.update(s.products).set({ storeId: ids.storeB }).where(eq(s.products.id, p.s1b));

      const listB = await listedCategories(ids.s1, ids.storeB, true);
      expect(listB).toContain(tax.catB);
      expect(listB).not.toContain(tax.catA);
      expect(await listedCategories(ids.s1, ids.storeA, true)).toEqual([tax.catA]);
      expect((await sellerBrandList(ids.s1, { storeId: ids.storeB, catalogSplit: true })).map((b) => b.id)).not.toContain(tax.brandA);
      expect((await sellerBrandList(ids.s1, { storeId: ids.storeA, catalogSplit: true })).map((b) => b.id)).toContain(tax.brandA);

      expect(await renameCategory(ids.s1, ids.storeB, tax.catA, true)).toEqual([]);
      expect(await renameCategory(ids.s1, ids.storeA, tax.catA, true)).toEqual([tax.catA]);

      // Store B's own product can't take store A's category or brand; its own category is fine.
      expect(await assign(ids.s1, ids.storeB, p.s1b, { sellerCategoryId: tax.catA }, true)).toBe(false);
      expect(await assign(ids.s1, ids.storeB, p.s1b, { sellerBrandId: tax.brandA }, true)).toBe(false);
      expect(await assign(ids.s1, ids.storeB, p.s1b, { sellerCategoryId: tax.catB }, true)).toBe(true);
      // Through store B, store A's product can't be touched even with A's own category.
      expect(await assign(ids.s1, ids.storeB, p.s1a, { sellerCategoryId: tax.catA }, true)).toBe(false);
      const [row] = await db.select({ cat: s.products.sellerCategoryId, brand: s.products.sellerBrandId }).from(s.products).where(eq(s.products.id, p.s1a));
      expect(row).toEqual({ cat: null, brand: null });

      // The storefront's category groups: store B shows only its own category.
      const groupsB = await storeCategoryGroups(ids.s1, { storeId: ids.storeB, catalogSplit: true }, db);
      expect(groupsB.map((g) => g.sellerCategoryId).filter(Boolean)).toEqual([tax.catB]);

      // The agent (MCP / in-app) through store B: A's category is not in its list and can't be used.
      forced.catalogSplit = true;
      const throughB = agentCtx(ids.s1, ids.storeB);
      expect((await agentListStoreCategories(throughB)).map((c) => c.id)).not.toContain(tax.catA);
      await expect(agentUpdateProduct(throughB, { storeId: ids.storeB, productId: p.s1b, storeCategoryId: tax.catA }, noUpload)).rejects.toEqual(
        refusedWith("invalid_store_category"),
      );
    });
  });

  it("F-87d: a forged storeId from another seller is refused, and S2's category never matches S1, in both modes", async () => {
    await withTaxonomy(async () => {
      for (const catalogSplit of [false, true]) {
        expect(await listedCategories(ids.s1, ids.storeS2, catalogSplit)).toEqual([]);
        expect(await renameCategory(ids.s1, ids.storeS2, tax.catS2, catalogSplit)).toEqual([]);
        expect(await assign(ids.s1, ids.storeS2, p.s2, { sellerCategoryId: tax.catS2 }, catalogSplit)).toBe(false);
        // The condition alone, without the session check: another seller's row never matches.
        expect(await taxonomyItemsInStore(scopeOf(ids.s1, ids.storeA, catalogSplit), { sellerCategoryId: tax.catS2 }, db)).toBe(false);
        expect(await renameCategory(ids.s2, ids.storeA, tax.catA, catalogSplit)).toEqual([]);
        forced.catalogSplit = catalogSplit;
        await expect(agentListStoreCategories(agentCtx(ids.s1, ids.storeS2))).rejects.toEqual(refusedWith("not_found"));
      }
    });
  });

  it("F-87d, switch off: every store of S1 shares the seller's list, as today", async () => {
    await withTaxonomy(async () => {
      for (const store of [ids.storeA, ids.storeB]) {
        const listed = await listedCategories(ids.s1, store, false);
        expect(listed).toEqual(expect.arrayContaining([tax.catA, tax.catB]));
        expect(listed).not.toContain(tax.catS2);
        expect((await sellerBrandList(ids.s1, { storeId: store, catalogSplit: false })).map((b) => b.id)).toContain(tax.brandA);
      }
      expect(await renameCategory(ids.s1, ids.storeB, tax.catA, false)).toEqual([tax.catA]);
      // Store B (selected mode) still manages every S1 product, with any of the seller's categories.
      expect(await assign(ids.s1, ids.storeB, p.s1a, { sellerCategoryId: tax.catA, sellerBrandId: tax.brandA }, false)).toBe(true);
      forced.catalogSplit = false;
      const agentList = (await agentListStoreCategories(agentCtx(ids.s1, ids.storeB))).map((c) => c.id);
      expect(agentList).toEqual(expect.arrayContaining([tax.catA, tax.catB]));
    });
  });

  it("both switches are off (or the table is not there yet)", async () => {
    expect(await isSwitchOn("stores_catalog_split", db)).toBe(false);
    expect(await isSwitchOn("stores_wallet_split", db)).toBe(false);
  });
});
