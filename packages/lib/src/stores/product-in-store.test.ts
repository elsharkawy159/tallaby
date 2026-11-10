import { sql as raw } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { aliasedProductShownInStore, productInStore, productInStoreOf, productShownInStore } from "./store-scope.server";

/**
 * The shared store-scope condition (ROADMAP.md F-87c). Rendered with the
 * Postgres dialect so each mode's SQL and bound parameters are checked
 * without a database; the DB behaviour is in store-separation.integration.test.ts.
 */
const dialect = new PgDialect();
const render = (condition: ReturnType<typeof productInStore>) => {
  const { sql, params } = dialect.sqlToQuery(condition);
  return { sql: sql.replace(/\s+/g, " "), params };
};

const STORE = "22222222-2222-4222-8222-222222222222";

describe("productInStore", () => {
  it("after the split: products.store_id is the store, and the store has the product's seller", () => {
    const { sql, params } = render(productInStore(STORE, { catalogSplit: true }));
    expect(sql).toContain(`"products"."store_id" = $1`);
    expect(sql).toContain(`scope_store.seller_id = "products"."seller_id"`);
    expect(sql).toContain("scope_store.deleted_at IS NULL");
    expect(sql).not.toContain("catalog_mode");
    expect(sql).not.toContain("store_products");
    expect(params).toEqual([STORE, STORE]);
  });

  it("after the split the scope makes no difference", () => {
    expect(render(productInStore(STORE, { catalogSplit: true, scope: "managed" }))).toEqual(
      render(productInStore(STORE, { catalogSplit: true, scope: "shown" })),
    );
  });

  it("before the split, shown: same seller plus catalog_mode 'all' or a store_products row", () => {
    const { sql, params } = render(productInStore(STORE, { catalogSplit: false }));
    expect(sql).toContain(`scope_store.seller_id = "products"."seller_id"`);
    expect(sql).toContain("scope_store.catalog_mode = 'all'");
    expect(sql).toContain(`FROM "store_products" scope_sp`);
    expect(sql).toContain(`scope_sp.product_id = "products"."id"`);
    expect(sql).not.toContain(`"products"."store_id"`);
    expect(params).toEqual([STORE]);
  });

  it("before the split, managed: same seller only (the account catalog)", () => {
    const { sql, params } = render(productInStore(STORE, { catalogSplit: false, scope: "managed" }));
    expect(sql).toContain(`scope_store.seller_id = "products"."seller_id"`);
    expect(sql).not.toContain("catalog_mode");
    expect(sql).not.toContain("store_products");
    expect(sql).not.toContain(`"products"."store_id"`);
    expect(params).toEqual([STORE]);
  });

  it("productShownInStore is the shown scope, in both modes", () => {
    for (const catalogSplit of [false, true]) {
      expect(render(productShownInStore({ storeId: STORE, catalogSplit }))).toEqual(
        render(productInStore(STORE, { catalogSplit, scope: "shown" })),
      );
    }
  });

  it("productInStoreOf renders the same rule with the store taken from a column", () => {
    for (const catalogSplit of [false, true]) {
      const { sql: text, params } = render(productInStoreOf(raw`a.store_id`, { catalogSplit }));
      const expected = render(productInStore(STORE, { catalogSplit })).sql.replace(/\$\d+/g, "a.store_id");
      expect(text).toBe(expected);
      expect(params).toEqual([]);
    }
  });

  it("aliasedProductShownInStore checks the aliased row on the bare products table", () => {
    const { sql: text, params } = render(aliasedProductShownInStore("p", { storeId: STORE, catalogSplit: true }));
    expect(text).toContain(`EXISTS (SELECT 1 FROM "products" WHERE "products"."id" = p.id AND`);
    expect(text).toContain(`"products"."store_id" = $1`);
    expect(params).toEqual([STORE, STORE]);
    expect(() => aliasedProductShownInStore("p; drop", { storeId: STORE, catalogSplit: false })).toThrow();
  });

  it("a malformed or missing store id matches nothing and binds nothing", () => {
    for (const bad of ["", "not-a-uuid", "'; drop table products; --", undefined as unknown as string]) {
      for (const catalogSplit of [false, true]) {
        expect(render(productInStore(bad, { catalogSplit }))).toEqual({ sql: "false", params: [] });
      }
    }
  });
});
