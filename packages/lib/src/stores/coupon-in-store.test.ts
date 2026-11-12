import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { couponInStore } from "./store-scope.server";

/**
 * Coupons per store (ROADMAP.md F-87k, owner 2026-11-12): the one SQL
 * condition every store-host coupon read uses. A coupon works in a store when
 * its `store_id` is that store or null ("All stores"). The DB behaviour is in
 * store-separation.integration.test.ts.
 */
const dialect = new PgDialect();
const render = (condition: SQL) => {
  const { sql, params } = dialect.sqlToQuery(condition);
  return { sql: sql.replace(/\s+/g, " "), params };
};

const STORE = "22222222-2222-4222-8222-222222222222";

describe("couponInStore", () => {
  it("a store: its own coupons and the all-stores ones", () => {
    const { sql, params } = render(couponInStore(STORE));
    expect(sql).toBe('("coupons"."store_id" is null or "coupons"."store_id" = $1)');
    expect(params).toEqual([STORE]);
  });

  it("no store (marketplace) or a malformed id: only the all-stores coupons", () => {
    for (const storeId of [null, undefined, "", "not-a-uuid", `${STORE}' OR 1=1`]) {
      const { sql, params } = render(couponInStore(storeId));
      expect(sql).toBe('"coupons"."store_id" is null');
      expect(params).toEqual([]);
    }
  });
});
