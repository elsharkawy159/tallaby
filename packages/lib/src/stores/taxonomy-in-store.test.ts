import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { sellerProductBrands, sellerProductCategories } from "@workspace/db";
import {
  aliasedTaxonomyInStore,
  taxonomyInStore,
  taxonomyItemsInStore,
  taxonomyStoreIdForWrite,
  type TaxonomyScope,
} from "./store-scope.server";

/**
 * The seller taxonomy store scope (ROADMAP.md F-87d). Rendered with the
 * Postgres dialect, so each mode's SQL and parameters are checked without a
 * database; the DB behaviour is in store-separation.integration.test.ts.
 */
const dialect = new PgDialect();
const render = (condition: SQL) => {
  const { sql, params } = dialect.sqlToQuery(condition);
  return { sql: sql.replace(/\s+/g, " "), params };
};

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const CATEGORY = "33333333-3333-4333-8333-333333333333";
const BRAND = "44444444-4444-4444-8444-444444444444";

const off: TaxonomyScope = { sellerId: SELLER, storeId: STORE, catalogSplit: false };
const on: TaxonomyScope = { sellerId: SELLER, storeId: STORE, catalogSplit: true };

describe("taxonomyInStore", () => {
  it("switch off: the seller's list only, store_id never read (today's rule)", () => {
    for (const table of [sellerProductCategories, sellerProductBrands]) {
      const { sql, params } = render(taxonomyInStore(table, off));
      expect(sql).toMatch(/"seller_id" = \$1/);
      expect(sql).not.toContain("store_id");
      expect(params).toEqual([SELLER]);
    }
  });

  it("switch off: the same SQL whatever store is named, or none", () => {
    expect(render(taxonomyInStore(sellerProductCategories, { ...off, storeId: null }))).toEqual(
      render(taxonomyInStore(sellerProductCategories, off)),
    );
  });

  it("switch on: the seller and store_id = the store", () => {
    const { sql, params } = render(taxonomyInStore(sellerProductCategories, on));
    expect(sql).toContain(`"seller_product_categories"."seller_id" = $1`);
    expect(sql).toContain(`"seller_product_categories"."store_id" = $2`);
    expect(params).toEqual([SELLER, STORE]);
    expect(render(taxonomyInStore(sellerProductBrands, on)).sql).toContain(`"seller_product_brands"."store_id" = $2`);
  });

  it("switch on with no store, or malformed ids: matches nothing", () => {
    expect(render(taxonomyInStore(sellerProductCategories, { ...on, storeId: null })).sql).toBe("false");
    expect(render(taxonomyInStore(sellerProductCategories, { ...on, storeId: "x' OR 1=1" })).sql).toBe("false");
    expect(render(taxonomyInStore(sellerProductCategories, { ...off, sellerId: "nope" })).sql).toBe("false");
  });
});

describe("aliasedTaxonomyInStore", () => {
  it("renders the same rule on an alias", () => {
    expect(render(aliasedTaxonomyInStore("t", off))).toEqual({ sql: "t.seller_id = $1", params: [SELLER] });
    expect(render(aliasedTaxonomyInStore("t", on))).toEqual({ sql: "(t.seller_id = $1 AND t.store_id = $2)", params: [SELLER, STORE] });
    expect(render(aliasedTaxonomyInStore("t", { ...on, storeId: null })).sql).toBe("false");
  });

  it("refuses an alias that isn't a plain identifier", () => {
    expect(() => aliasedTaxonomyInStore("t; drop table x", on)).toThrow("bad alias");
  });
});

describe("taxonomyStoreIdForWrite", () => {
  it("writes the scope's store in both modes (read only after the split)", () => {
    expect(taxonomyStoreIdForWrite(off)).toBe(STORE);
    expect(taxonomyStoreIdForWrite(on)).toBe(STORE);
    expect(taxonomyStoreIdForWrite({ ...off, storeId: null })).toBeNull();
    expect(taxonomyStoreIdForWrite({ ...off, storeId: "bad" })).toBeNull();
  });
});

/** A fake handle: records each WHERE and answers with the given rows per table. */
function fakeQ(rows: { category: unknown[]; brand: unknown[] }) {
  const wheres: { table: string; where: SQL }[] = [];
  const q = {
    select: () => ({
      from: (table: typeof sellerProductCategories | typeof sellerProductBrands) => ({
        where: (where: SQL) => ({
          limit: async () => {
            const name = table === sellerProductCategories ? "category" : "brand";
            wheres.push({ table: name, where });
            return rows[name];
          },
        }),
      }),
    }),
  };
  return { q: q as never, wheres };
}

describe("taxonomyItemsInStore", () => {
  it("no ids: allowed without a query", async () => {
    const { q, wheres } = fakeQ({ category: [], brand: [] });
    await expect(taxonomyItemsInStore(on, { sellerCategoryId: null, sellerBrandId: null }, q)).resolves.toBe(true);
    expect(wheres).toEqual([]);
  });

  it("checks each id with the store condition in the same WHERE", async () => {
    const { q, wheres } = fakeQ({ category: [{ id: CATEGORY }], brand: [{ id: BRAND }] });
    await expect(taxonomyItemsInStore(on, { sellerCategoryId: CATEGORY, sellerBrandId: BRAND }, q)).resolves.toBe(true);
    const category = render(wheres.find((w) => w.table === "category")!.where);
    expect(category.sql).toContain(`"seller_product_categories"."store_id"`);
    expect(category.params).toEqual([CATEGORY, SELLER, STORE]);
    expect(render(wheres.find((w) => w.table === "brand")!.where).params).toEqual([BRAND, SELLER, STORE]);
  });

  it("an id outside the store (no row) is refused", async () => {
    const { q } = fakeQ({ category: [], brand: [{ id: BRAND }] });
    await expect(taxonomyItemsInStore(on, { sellerCategoryId: CATEGORY, sellerBrandId: BRAND }, q)).resolves.toBe(false);
  });

  it("switch off: the seller's rule (no store_id in the WHERE)", async () => {
    const { q, wheres } = fakeQ({ category: [{ id: CATEGORY }], brand: [] });
    await expect(taxonomyItemsInStore(off, { sellerCategoryId: CATEGORY }, q)).resolves.toBe(true);
    expect(render(wheres[0]!.where).sql).not.toContain("store_id");
  });

  it("a malformed id is refused before any query", async () => {
    const { q, wheres } = fakeQ({ category: [{ id: CATEGORY }], brand: [] });
    await expect(taxonomyItemsInStore(on, { sellerCategoryId: "1 OR 1=1" }, q)).resolves.toBe(false);
    expect(wheres).toEqual([]);
  });
});
