import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Fee on delivery (owner, 2026-11-26; PLAN.md §13.3) without a database: a
 * fake transaction answers each query in order. The same flows against a real
 * Postgres are in fee-on-delivery.integration.test.ts.
 */

const mocks = vi.hoisted(() => ({
  switchState: { on: false, changedAt: null as string | null },
  posted: [] as Array<Record<string, unknown>>,
  duplicate: false,
}));

vi.mock("./fee-switch", () => ({
  FEE_ON_DELIVERY_SWITCH: "fee_on_delivery",
  readFeeOnDeliverySwitch: vi.fn(async () => mocks.switchState),
}));
vi.mock("./store-wallet", () => ({
  STORE_WALLET_REFERENCE_TYPES: { order: "order" },
  postStoreWalletEntryOnce: vi.fn(async (_tx: unknown, input: Record<string, unknown>) => {
    mocks.posted.push(input);
    return mocks.duplicate ? null : { entryId: "e", balanceBefore: "0", balanceAfter: "-0.03" };
  }),
}));
vi.mock("../log", () => ({ logServerError: vi.fn() }));

import { logServerError } from "../log";
import { chargeAgedOrderFee, chargeOrderPlacementFee, creditSellerOnDelivery } from "./credit-seller-on-delivery";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const ORDER = "33333333-3333-4333-8333-333333333333";

/** A query chain that resolves to `result` whatever is called on it. */
function chain(result: unknown): unknown {
  const self: unknown = new Proxy(function () {}, {
    get: (_target, key) =>
      key === "then"
        ? (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => Promise.resolve(result).then(resolve, reject)
        : () => self,
  });
  return self;
}

/** A transaction whose `select` calls answer `answers` in order; `transaction` runs the callback on itself. */
function fakeTx(answers: unknown[][]) {
  const queue = [...answers];
  const tx = {
    selects: 0,
    select: vi.fn(() => {
      tx.selects += 1;
      return chain(queue.shift() ?? []);
    }),
    execute: vi.fn(async () => [{ currency: "USD" }]),
    transaction: vi.fn(async (fn: (sp: unknown) => unknown) => fn(tx)),
  };
  return tx as unknown as Parameters<typeof chargeOrderPlacementFee>[0] & { selects: number };
}

const usdLine = (sellerId: string, cents = 3) => ({
  sellerId,
  commissionAmount: "1.62",
  metadata: { platformFee: { feeUsdCents: cents } },
});
const openOrder = (extra: Record<string, unknown> = {}) => ({
  metadata: null,
  storeId: null,
  isTest: false,
  status: "confirmed",
  paymentStatus: "pending",
  ...extra,
});

/** Lines, order, then per seller: legacy sale, wallet currency. */
const placedAnswers = (lines: unknown[], order = openOrder()) => [
  lines,
  [order],
  ...lines.flatMap(() => [[], [{ currency: "USD" }]]),
];

beforeEach(() => {
  mocks.switchState = { on: false, changedAt: null };
  mocks.posted = [];
  mocks.duplicate = false;
  vi.mocked(logServerError).mockClear();
});

describe("placement charge and the fee_on_delivery switch", () => {
  it("switch off: charges at placement as today", async () => {
    const tx = fakeTx(placedAnswers([usdLine(A)]));
    await chargeOrderPlacementFee(tx, ORDER);
    expect(mocks.posted).toEqual([
      expect.objectContaining({ sellerId: A, type: "fee", amount: "-0.03", currency: "USD", referenceType: "order", referenceId: ORDER, metadata: { chargedAt: "placed" } }),
    ]);
  });

  it("switch on: placement (and a card payment confirmation, the same call) charges nothing and reads no order", async () => {
    mocks.switchState = { on: true, changedAt: "2026-11-26T00:00:00Z" };
    const tx = fakeTx(placedAnswers([usdLine(A)]));
    await chargeOrderPlacementFee(tx, ORDER);
    expect(mocks.posted).toEqual([]);
    expect(tx.selects).toBe(0);
  });

  it("switch on: delivery charges, and a second delivery event posts nothing new", async () => {
    mocks.switchState = { on: true, changedAt: "2026-11-26T00:00:00Z" };
    await creditSellerOnDelivery(fakeTx(placedAnswers([usdLine(A)])), ORDER);
    expect(mocks.posted).toEqual([expect.objectContaining({ sellerId: A, amount: "-0.03", metadata: { chargedAt: "delivered" } })]);

    // The claim answers the replay (postStoreWalletEntryOnce returns null): nothing is charged twice.
    mocks.duplicate = true;
    const tx = fakeTx(placedAnswers([usdLine(A)]));
    await creditSellerOnDelivery(tx, ORDER);
    expect(await chargeAgedOrderFee(fakeTx([[{ id: ORDER }], ...placedAnswers([usdLine(A)])]), ORDER)).toBe(0);
  });

  it("a held part is charged on delivery, not at placement", async () => {
    const held = openOrder({ metadata: { feeHolds: { [A]: ["junk_name"] } } });
    await chargeOrderPlacementFee(fakeTx([[usdLine(A), usdLine(B)], [held], [], [{ currency: "USD" }]]), ORDER);
    expect(mocks.posted.map((p) => p.sellerId)).toEqual([B]);

    mocks.posted = [];
    await creditSellerOnDelivery(fakeTx(placedAnswers([usdLine(A)], held)), ORDER);
    expect(mocks.posted.map((p) => p.sellerId)).toEqual([A]);
  });

  it("a Pro (zero-cent) part and a test order pay nothing", async () => {
    await creditSellerOnDelivery(fakeTx(placedAnswers([usdLine(A, 0)])), ORDER);
    await creditSellerOnDelivery(fakeTx(placedAnswers([usdLine(A)], openOrder({ isTest: true }))), ORDER);
    expect(mocks.posted).toEqual([]);
  });

  it("a failed placement charge is logged as [fee] and never fails the order", async () => {
    const tx = fakeTx([]);
    vi.mocked(tx.transaction).mockRejectedValueOnce(new Error("boom"));
    await expect(chargeOrderPlacementFee(tx, ORDER)).resolves.toBeUndefined();
    expect(logServerError).toHaveBeenCalledWith("fee", "placement fee failed", { orderId: ORDER }, expect.any(Error));
  });
});

describe("the aged (14-day) charge for one order", () => {
  /** The lock, then the placement answers. */
  const agedAnswers = (lines: unknown[], order = openOrder()) => [[{ id: ORDER }], ...placedAnswers(lines, order)];

  it("charges each open seller once, with chargedAt aged", async () => {
    const posted = await chargeAgedOrderFee(fakeTx(agedAnswers([usdLine(A), usdLine(B)])), ORDER);
    expect(posted).toBe(2);
    expect(mocks.posted).toEqual([
      expect.objectContaining({ sellerId: A, metadata: { chargedAt: "aged" } }),
      expect.objectContaining({ sellerId: B, metadata: { chargedAt: "aged" } }),
    ]);
  });

  it.each([
    ["cancelled", openOrder({ status: "cancelled" })],
    ["returned", openOrder({ status: "returned" })],
    ["refunded", openOrder({ status: "refunded" })],
    ["card refunded", openOrder({ paymentStatus: "refunded" })],
    ["an unpaid card order", openOrder({ status: "payment_processing" })],
    ["an unconfirmed manual link", openOrder({ status: "pending", metadata: { manualOrder: { awaitingCustomer: true } } })],
    ["a test order", openOrder({ isTest: true })],
  ])("never charges %s", async (_label, order) => {
    expect(await chargeAgedOrderFee(fakeTx(agedAnswers([usdLine(A)], order)), ORDER)).toBe(0);
    expect(mocks.posted).toEqual([]);
  });

  it("skips a held part (it pays only if delivered) but charges the other seller", async () => {
    const held = openOrder({ metadata: { feeHolds: { [A]: ["duplicate"] } } });
    expect(await chargeAgedOrderFee(fakeTx([[{ id: ORDER }], [usdLine(A), usdLine(B)], [held], [], [{ currency: "USD" }]]), ORDER)).toBe(1);
    expect(mocks.posted.map((p) => p.sellerId)).toEqual([B]);
  });

  it("locks the order row before reading it", async () => {
    const tx = fakeTx(agedAnswers([usdLine(A)]));
    await chargeAgedOrderFee(tx, ORDER);
    // lock, lines, order, legacy sale, wallet currency
    expect(tx.selects).toBe(5);
  });
});
