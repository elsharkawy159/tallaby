import { describe, expect, it, vi } from "vitest";

/**
 * Tallaby Pay sales reads (ROADMAP.md F-100f): the rule 5 guards and the row
 * mapping. The database is a fake queryable that answers each query in order;
 * the SQL itself runs against Postgres on staging (F-100h).
 */

const mocks = vi.hoisted(() => {
  const anything: unknown = new Proxy(function () {}, {
    get: (_target, key) => (key === "then" ? undefined : anything),
    apply: () => anything,
  });
  return { anything };
});

vi.mock("@workspace/db", async (importOriginal) => ({ ...(await importOriginal<typeof import("@workspace/db")>()), db: mocks.anything }));

import { getTallabyPayOrderSales, listTallabyPaySales, storeHasTallabyPay } from "./sales.server";

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const ORDER = "33333333-3333-4333-8333-333333333333";

/** A fake `q` whose execute returns the given answers in order. */
function fakeQ(...answers: unknown[][]) {
  const execute = vi.fn(async () => answers.shift() ?? []);
  return { q: { execute } as never, execute };
}

const ROW = {
  id: "s1",
  store_id: STORE,
  order_id: ORDER,
  order_number: "ORD-1",
  order_status: "delivered",
  purpose: "order",
  gross: "100.00",
  fee: "3.00",
  net: "97.00",
  status: "available",
  refund_state: null,
  payment_method: "Card",
  paid_at: "2026-11-18 10:00:00+00",
  release_at: "2026-11-19 10:00:00+00",
  released_at: "2026-11-19 10:00:00+00",
  refunded_at: null,
};

describe("listTallabyPaySales", () => {
  it("reads nothing more for a store that isn't the seller's", async () => {
    const { q, execute } = fakeQ([]);
    const result = await listTallabyPaySales({ sellerId: SELLER, storeId: STORE }, q);
    expect(result).toEqual({ rows: [], total: 0, page: 1, pageSize: 20 });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("never queries with ids that aren't uuids", async () => {
    const { q, execute } = fakeQ();
    const result = await listTallabyPaySales({ sellerId: SELLER, storeId: "x' OR 1=1" }, q);
    expect(result.rows).toEqual([]);
    expect(execute).not.toHaveBeenCalled();
  });

  it("maps rows and clamps the page", async () => {
    const { q } = fakeQ([{ id: STORE }], [ROW], [{ n: 1 }]);
    const result = await listTallabyPaySales({ sellerId: SELLER, storeId: STORE, page: -4, pageSize: 5000 }, q);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(100);
    expect(result.total).toBe(1);
    expect(result.rows[0]).toMatchObject({
      storeId: STORE,
      orderId: ORDER,
      orderNumber: "ORD-1",
      gross: "100.00",
      fee: "3.00",
      net: "97.00",
      status: "available",
      refundState: null,
    });
  });
});

describe("getTallabyPayOrderSales", () => {
  it("is empty for a bad id and never queries", async () => {
    const { q, execute } = fakeQ();
    expect(await getTallabyPayOrderSales({ sellerId: SELLER, orderId: "nope" }, q)).toEqual([]);
    expect(execute).not.toHaveBeenCalled();
  });

  it("maps the order's sales", async () => {
    const { q } = fakeQ([ROW]);
    const [sale] = await getTallabyPayOrderSales({ sellerId: SELLER, orderId: ORDER }, q);
    expect(sale?.net).toBe("97.00");
  });
});

describe("storeHasTallabyPay", () => {
  it("is false for bad ids without a query", async () => {
    const { q, execute } = fakeQ();
    expect(await storeHasTallabyPay("x", STORE, q)).toBe(false);
    expect(execute).not.toHaveBeenCalled();
  });

  it("reads the flag", async () => {
    expect(await storeHasTallabyPay(SELLER, STORE, fakeQ([{ has_it: true }]).q)).toBe(true);
    expect(await storeHasTallabyPay(SELLER, STORE, fakeQ([{ has_it: false }]).q)).toBe(false);
  });
});
