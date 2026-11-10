import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { cartProductsOutsideStoreCatalog, productsOutsideStore, storeSellsProduct } from "./catalog.server";

/**
 * The cart and checkout product checks (ROADMAP.md F-87c slice 5): they run the
 * shared `productInStore` condition, scope `shown`, with the switch the caller
 * passes (or read with the same handle). A fake query handle records each
 * WHERE and never connects; the DB behaviour is in
 * store-separation.integration.test.ts.
 */
const dialect = new PgDialect();
const STORE = "22222222-2222-4222-8222-222222222222";
const CART = "33333333-3333-4333-8333-333333333333";
const P1 = "44444444-4444-4444-8444-444444444441";
const P2 = "44444444-4444-4444-8444-444444444442";

type Step = { rows: unknown[] };

/** A Drizzle-shaped handle: each `select().from().where()` (+ optional `.limit()`) returns the next step's rows. */
function fakeQ(steps: Step[]) {
  const wheres: string[] = [];
  let call = 0;
  const q = {
    select: () => ({
      from: () => ({
        where: (condition: SQL) => {
          wheres.push(dialect.sqlToQuery(condition).sql.replace(/\s+/g, " "));
          const rows = steps[call++]?.rows ?? [];
          const result = Promise.resolve(rows) as Promise<unknown[]> & { limit: () => Promise<unknown[]> };
          result.limit = () => Promise.resolve(rows);
          return result;
        },
      }),
    }),
  };
  return { q: q as never, wheres, calls: () => call };
}

describe("productsOutsideStore", () => {
  it("returns nothing and runs no query for no products", async () => {
    const f = fakeQ([]);
    expect(await productsOutsideStore(STORE, [], f.q, { catalogSplit: false })).toEqual([]);
    expect(f.calls()).toBe(0);
  });

  it("a malformed store id shows nothing: every product is outside, no query", async () => {
    const f = fakeQ([]);
    expect(await productsOutsideStore("not-a-uuid", [P1, P1, P2], f.q, { catalogSplit: true })).toEqual([P1, P2]);
    expect(f.calls()).toBe(0);
  });

  it("before the split: the selected-catalog rule (catalog_mode or a pick); the missing ids come back in order, once", async () => {
    const f = fakeQ([{ rows: [{ id: P2 }] }]);
    expect(await productsOutsideStore(STORE, [P1, P2, P1], f.q, { catalogSplit: false })).toEqual([P1]);
    expect(f.wheres[0]).toContain("scope_store.catalog_mode = 'all'");
    expect(f.wheres[0]).not.toContain(`"products"."store_id" =`);
  });

  it("after the split: products.store_id must be the store", async () => {
    const f = fakeQ([{ rows: [{ id: P1 }, { id: P2 }] }]);
    expect(await productsOutsideStore(STORE, [P1, P2], f.q, { catalogSplit: true })).toEqual([]);
    expect(f.wheres[0]).toContain(`"products"."store_id" =`);
    expect(f.wheres[0]).not.toContain("catalog_mode");
  });

  it("reads the switch with the same handle when the caller doesn't pass it", async () => {
    // 1st query: platform_switches (on); 2nd: the product check.
    const f = fakeQ([{ rows: [{ enabled: true }] }, { rows: [] }]);
    expect(await productsOutsideStore(STORE, [P1], f.q)).toEqual([P1]);
    expect(f.calls()).toBe(2);
    expect(f.wheres[1]).toContain(`"products"."store_id" =`);
  });
});

describe("storeSellsProduct", () => {
  it("is an active product the store shows, on the shared condition", async () => {
    const f = fakeQ([{ rows: [{ ok: true }] }]);
    expect(await storeSellsProduct(STORE, P1, f.q, { catalogSplit: true })).toBe(true);
    expect(f.wheres[0]).toContain(`"products"."status" = $`);
    expect(f.wheres[0]).toContain(`"products"."store_id" =`);
  });

  it("refuses malformed ids without a query", async () => {
    const f = fakeQ([]);
    expect(await storeSellsProduct("x", P1, f.q, { catalogSplit: false })).toBe(false);
    expect(await storeSellsProduct(STORE, "x", f.q, { catalogSplit: false })).toBe(false);
    expect(f.calls()).toBe(0);
  });
});

describe("cartProductsOutsideStoreCatalog", () => {
  it("a marketplace cart (no store) is never checked", async () => {
    const f = fakeQ([{ rows: [{ storeId: null }] }]);
    expect(await cartProductsOutsideStoreCatalog(CART, f.q, { catalogSplit: true })).toEqual([]);
    expect(f.calls()).toBe(1);
  });

  it("checks the cart's lines against the cart's own store", async () => {
    const f = fakeQ([{ rows: [{ storeId: STORE }] }, { rows: [{ productId: P1 }, { productId: P2 }] }, { rows: [{ id: P2 }] }]);
    expect(await cartProductsOutsideStoreCatalog(CART, f.q, { catalogSplit: true })).toEqual([P1]);
    expect(f.wheres[2]).toContain(`"products"."store_id" =`);
  });
});
