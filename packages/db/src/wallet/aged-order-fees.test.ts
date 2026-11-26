import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The daily 14-day job (owner, 2026-11-26) without a database: the candidate
 * query and the per-order charge are fakes. The real query runs in
 * fee-on-delivery.integration.test.ts.
 */

const mocks = vi.hoisted(() => ({
  switchState: { on: true, changedAt: "2026-11-26T00:00:00.000Z" as string | null },
  charge: vi.fn(async (_tx: unknown, _orderId: string) => 1),
}));

vi.mock("./fee-switch", () => ({ readFeeOnDeliverySwitch: vi.fn(async () => mocks.switchState) }));
vi.mock("./credit-seller-on-delivery", () => ({ chargeAgedOrderFee: mocks.charge }));
vi.mock("../log", () => ({ logServerError: vi.fn() }));

import { logServerError } from "../log";
import { AGED_FEE_CLOSED_LINE_STATUSES, agedFeeCutoff, orderOpenForAgedFee } from "./aged-fee.lib";
import { chargeAgedOrderFees } from "./aged-order-fees";

const row = (n: number) => ({ id: `order-${n}`, created_at: `2026-11-26 00:00:0${n}+00` });

function fakeDb(pages: Array<Array<{ id: string; created_at: string }>>) {
  const queue = [...pages];
  const q = {
    execute: vi.fn(async () => queue.shift() ?? []),
    transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn({})),
  };
  return q as unknown as Parameters<typeof chargeAgedOrderFees>[0] & typeof q;
}

beforeEach(() => {
  mocks.switchState = { on: true, changedAt: "2026-11-26T00:00:00.000Z" };
  mocks.charge.mockReset();
  mocks.charge.mockResolvedValue(1);
  vi.mocked(logServerError).mockClear();
});

describe("chargeAgedOrderFees", () => {
  it("does nothing while the switch is off", async () => {
    mocks.switchState = { on: false, changedAt: null };
    const q = fakeDb([[row(1)]]);
    expect(await chargeAgedOrderFees(q)).toEqual({ switchOn: false, scanned: 0, charged: 0, entries: 0, unchanged: 0, failed: 0 });
    expect(q.execute).not.toHaveBeenCalled();
  });

  it("charges nothing when the switch row has no changed_at", async () => {
    mocks.switchState = { on: true, changedAt: null };
    const q = fakeDb([[row(1)]]);
    expect((await chargeAgedOrderFees(q)).scanned).toBe(0);
    expect(q.execute).not.toHaveBeenCalled();
  });

  it("charges each order in its own transaction and counts the outcome", async () => {
    mocks.charge.mockResolvedValueOnce(2).mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    const q = fakeDb([[row(1), row(2), row(3)]]);
    expect(await chargeAgedOrderFees(q)).toEqual({ switchOn: true, scanned: 3, charged: 2, entries: 3, unchanged: 1, failed: 0 });
    expect(q.transaction).toHaveBeenCalledTimes(3);
    expect(mocks.charge.mock.calls.map((c) => c[1])).toEqual(["order-1", "order-2", "order-3"]);
  });

  it("logs a failed order as [fee] and goes on with the rest", async () => {
    mocks.charge.mockRejectedValueOnce(new Error("wallet")).mockResolvedValueOnce(1);
    const q = fakeDb([[row(1), row(2)]]);
    const result = await chargeAgedOrderFees(q);
    expect(result).toMatchObject({ scanned: 2, charged: 1, failed: 1 });
    expect(logServerError).toHaveBeenCalledWith("fee", "aged fee failed", { orderId: "order-1" }, expect.any(Error));
  });

  it("pages through full batches and stops at the cap", async () => {
    const q = fakeDb([[row(1), row(2)], [row(3), row(4)], [row(5)]]);
    expect((await chargeAgedOrderFees(q, { batchSize: 2 })).scanned).toBe(5);
    expect(q.execute).toHaveBeenCalledTimes(3);

    // The second page asks for only the 1 order left under the cap.
    const capped = fakeDb([[row(1), row(2)], [row(3)], [row(4)]]);
    expect((await chargeAgedOrderFees(capped, { batchSize: 2, maxOrders: 3 })).scanned).toBe(3);
    expect(capped.execute).toHaveBeenCalledTimes(2);
  });
});

describe("aged fee rules", () => {
  it("the cutoff is 14 days before now", () => {
    expect(agedFeeCutoff(new Date("2026-12-10T12:00:00Z")).toISOString()).toBe("2026-11-26T12:00:00.000Z");
  });

  it("an open order pays; a closed, unpaid-card or unconfirmed-link order doesn't", () => {
    for (const status of ["pending", "confirmed", "shipping_soon", "shipped", "out_for_delivery", "delivered", null]) {
      expect(orderOpenForAgedFee({ status })).toBe(true);
    }
    for (const status of ["payment_processing", "cancelled", "returned", "refunded"]) {
      expect(orderOpenForAgedFee({ status })).toBe(false);
    }
    expect(orderOpenForAgedFee({ status: "confirmed", paymentStatus: "refunded" })).toBe(false);
    expect(orderOpenForAgedFee({ status: "confirmed", paymentStatus: "partially_refunded" })).toBe(true);
    expect(orderOpenForAgedFee({ status: "pending", metadata: { manualOrder: { awaitingCustomer: true } } })).toBe(false);
    expect(orderOpenForAgedFee({ status: "confirmed", metadata: { manualOrder: { awaitingCustomer: false } } })).toBe(true);
  });

  it("cancelled, returned and refunded lines don't count towards a seller's open part", () => {
    expect([...AGED_FEE_CLOSED_LINE_STATUSES]).toEqual(["cancelled", "returned", "refunded"]);
  });
});
