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

  it("both switches are off (or the table is not there yet)", async () => {
    expect(await isSwitchOn("stores_catalog_split", db)).toBe(false);
    expect(await isSwitchOn("stores_wallet_split", db)).toBe(false);
  });
});
