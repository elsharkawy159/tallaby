import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { sidebarCountsSql } from "./sidebar-counts.server";

/**
 * The sidebar badges are one statement (A2, docs/plans/dashboard-performance.md).
 * Rendered without a database: every count must stay scoped to the session
 * seller (and the selected store where the page is per store), and a locked
 * seller's order counts must not be read at all.
 */
const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const dialect = new PgDialect();
const render = (...args: Parameters<typeof sidebarCountsSql>) => dialect.sqlToQuery(sidebarCountsSql(...args));

describe("sidebarCountsSql", () => {
  it("reads all seven counts for the seller, the products and coupons of the selected store", () => {
    const { sql, params } = render(SELLER, { ordersLocked: false, storeId: STORE, catalogSplit: true });
    for (const table of ["order_items", "products", "reviews", "coupons", "seller_payouts", "shipments", "store_form_submissions"]) {
      expect(sql).toContain(`FROM "${table}"`);
    }
    for (const alias of ["orders", "products", "reviews", "coupons", "payouts", "shipments", "forms"]) {
      expect(sql).toContain(`AS ${alias}`);
    }
    // Every sub-select filters on the session seller (one parameter each).
    expect(params.filter((p) => p === SELLER)).toHaveLength(7);
    expect(params).toContain(STORE);
    expect(sql).toContain(`"products"."deleted_at" is null`);
    expect(sql).toContain(`"coupons"."store_id" is null`);
    expect(params).toEqual(expect.arrayContaining(["assigned", "out_for_delivery", "new"]));
  });

  it("reads no order, payout or shipment count while orders are locked", () => {
    const { sql, params } = render(SELLER, { ordersLocked: true, storeId: STORE, catalogSplit: false });
    expect(sql).not.toContain(`"order_items"`);
    expect(sql).not.toContain(`"seller_payouts"`);
    expect(sql).not.toContain(`"shipments"`);
    expect(sql).toMatch(/0 AS orders/);
    expect(sql).toMatch(/0 AS payouts/);
    expect(sql).toMatch(/0 AS shipments/);
    expect(params.filter((p) => p === SELLER)).toHaveLength(4);
  });

  it("counts the account's products and coupons without a selected store", () => {
    const { sql, params } = render(SELLER, { ordersLocked: false, storeId: null, catalogSplit: true });
    expect(params).not.toContain(STORE);
    expect(sql).not.toContain("scope_store");
    expect(sql).not.toContain(`"coupons"."store_id"`);
    expect(sql).not.toContain(`"products"."store_id"`);
  });
});
