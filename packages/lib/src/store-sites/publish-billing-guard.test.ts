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
