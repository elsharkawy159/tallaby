import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getOrderLock: vi.fn() }));

vi.mock("../billing/order-lock.server", () => ({ getOrderLock: mocks.getOrderLock }));

import { publishStoreSite } from "./server";

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";

/** Stands for "the publish went on to its transaction": the guard let it through. */
const REACHED = new Error("reached the transaction");
const q = { transaction: vi.fn(async () => Promise.reject(REACHED)) };
const publish = (options: Parameters<typeof publishStoreSite>[3]) => publishStoreSite(SELLER, STORE, SELLER, options, q as never);

beforeEach(() => {
  q.transaction.mockClear();
  mocks.getOrderLock.mockReset();
});

/** The publish guard of docs/seller-top-up-rules.md §4 (owner, 2026-11-17). */
describe("publishStoreSite, refuseWhenBillingOffline", () => {
  it("refuses with top_up_required while the seller's stores are offline for billing, before any write", async () => {
    mocks.getOrderLock.mockResolvedValue({ storeOffline: true });
    expect(await publish({ refuseWhenBillingOffline: true })).toEqual({ success: false, error: "top_up_required" });
    expect(mocks.getOrderLock).toHaveBeenCalledExactlyOnceWith(SELLER);
    expect(q.transaction).not.toHaveBeenCalled();
  });

  it("goes on to publish when the stores aren't offline for billing (in the trial, activated, top-up in review)", async () => {
    mocks.getOrderLock.mockResolvedValue({ storeOffline: false });
    await expect(publish({ refuseWhenBillingOffline: true })).rejects.toBe(REACHED);
    expect(q.transaction).toHaveBeenCalledOnce();
  });

  it("never reads the lock for a caller that doesn't ask (Admin): Publish is unchanged for them", async () => {
    mocks.getOrderLock.mockResolvedValue({ storeOffline: true });
    await expect(publish({})).rejects.toBe(REACHED);
    expect(mocks.getOrderLock).not.toHaveBeenCalled();
    expect(q.transaction).toHaveBeenCalledOnce();
  });
});

/**
 * The first publish needs a product (owner, 2026-11-25): a fake transaction
 * answers the locked store row, then the product check; the next query stands
 * for "went on to build the site".
 */
describe("publishStoreSite, requireActiveProductOnFirstPublish", () => {
  const storeRow = (siteStatus: string) => ({ id: STORE, status: "active", sellerStatus: "approved", siteStatus });

  /** One chainable query per `select`: each answers the next queued result. */
  function fakeTx(results: unknown[]) {
    const tx = {
      select: vi.fn(() => {
        const result = results.shift();
        const chain: Record<string, unknown> = {};
        for (const method of ["from", "innerJoin", "where", "limit", "for", "orderBy"]) chain[method] = () => chain;
        chain.then = (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
          result instanceof Error ? reject(result) : resolve(result);
        return chain;
      }),
    };
    return tx;
  }
  const run = async (siteStatus: string, productRows: unknown[] | null) => {
    const results: unknown[] = [[storeRow(siteStatus)]];
    if (productRows) results.push(productRows);
    results.push(REACHED);
    const tx = fakeTx(results);
    const db = { transaction: vi.fn(async (fn: (t: unknown) => unknown) => fn(tx)) };
    const outcome = await publishStoreSite(SELLER, STORE, SELLER, { requireActiveProductOnFirstPublish: true }, db as never).catch((error) => error);
    return { outcome, selects: tx.select.mock.calls.length };
  };

  it("refuses a never-published store with no published product", async () => {
    const { outcome, selects } = await run("draft", []);
    expect(outcome).toEqual({ success: false, error: "no_active_product" });
    expect(selects).toBe(2);
  });

  it("publishes a never-published store once it has a published product", async () => {
    expect((await run("draft", [{ id: "p" }])).outcome).toBe(REACHED);
  });

  it("never checks products for a store that was ever published, so design changes still go live", async () => {
    for (const status of ["published", "unpublished"]) {
      const { outcome, selects } = await run(status, null);
      expect(outcome).toBe(REACHED);
      expect(selects).toBe(2);
    }
  });
});
