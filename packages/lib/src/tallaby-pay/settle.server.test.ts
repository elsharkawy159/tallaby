import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tallaby Pay callback (ROADMAP.md F-100c, design §6.2) with a fake database:
 * the order read, the order claim and the ledger are stand-ins, so this
 * covers the checks and what the handler asks them to do. The same flow
 * against Postgres is settle.integration.test.ts.
 */

const mocks = vi.hoisted(() => ({
  order: null as Record<string, unknown> | null,
  /** Answers to db.select() in order: the store's owner, then (duplicates only) the sale lookup. */
  selectQueue: [] as unknown[][],
  claim: vi.fn(),
  ensureWallet: vi.fn(async () => "wallet-1"),
  postEntry: vi.fn(async () => ({ replayed: false })),
  notifyDeposit: vi.fn(async () => undefined),
  inserted: [] as unknown[],
  transactions: 0,
  findOrder: vi.fn(),
}));

/** A query chain that resolves to `result` whatever is called on it, recording `.values()`. */
function chain(result: unknown, onValues?: (values: unknown) => void): unknown {
  const self: unknown = new Proxy(function () {}, {
    get: (_t, key) => {
      if (key === "then") return (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
      if (key === "values" && onValues) return (values: unknown) => (onValues(values), self);
      return () => self;
    },
  });
  return self;
}

vi.mock("@workspace/db", async (importOriginal) => {
  const real = await importOriginal<typeof import("@workspace/db")>();
  const fakeDb = {
    query: { orders: { findFirst: (...args: unknown[]) => (mocks.findOrder(...args), Promise.resolve(mocks.order)) } },
    select: () => chain(mocks.selectQueue.shift() ?? []),
    transaction: async (run: (tx: unknown) => unknown) => {
      mocks.transactions++;
      const tx = {
        insert: () => chain([{ id: "sale-1" }], (v) => mocks.inserted.push(v)),
        execute: async () => [],
        select: () => chain([]),
      };
      return run(tx);
    },
  };
  return { ...real, db: fakeDb };
});
vi.mock("../payments/store-gateways.server", () => ({
  claimGatewayPayment: mocks.claim,
  isDepositOrder: (o: { paymentMethod?: string; depositStatus?: unknown; depositAmount?: unknown }) =>
    o.paymentMethod === "cash_on_delivery" && o.depositStatus != null && o.depositAmount != null,
}));
vi.mock("./ledger.server", () => ({ ensureTallabyPayWallet: mocks.ensureWallet, postTallabyPayEntry: mocks.postEntry }));
vi.mock("../orders/cod-deposit.server", () => ({ notifyDeposit: mocks.notifyDeposit }));

import { easykashSignatureString } from "../easykash/easykash.lib";
import { buildGatewayReference, buildTallabyPayReference } from "../payments/store-gateways.lib";
import { handleTallabyPayCallback } from "./settle.server";

const ORDER = "55555555-5555-4555-8555-555555555555";
const STORE = "22222222-2222-4222-8222-222222222222";
const SELLER = "11111111-1111-4111-8111-111111111111";
const INTEGRATION = "44444444-4444-4444-8444-444444444444";
const HMAC = "tallaby-hmac-secret";

function signed(overrides: Record<string, string> = {}, secret = HMAC) {
  const fields: Record<string, string> = {
    ProductCode: "EDV4471",
    Amount: "100.00",
    ProductType: "Direct Pay",
    PaymentMethod: "Credit & Debit Card",
    status: "PAID",
    easykashRef: "9876543",
    customerReference: buildTallabyPayReference(ORDER),
    ...overrides,
  };
  const signatureHash = createHmac("sha512", secret).update(easykashSignatureString(fields as never)).digest("hex");
  return { ...fields, signatureHash };
}

function orderRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER,
    storeId: STORE,
    currency: "EGP",
    totalAmount: "100.00",
    paymentMethod: "online_payment",
    depositStatus: null,
    depositAmount: null,
    metadata: {
      paymentCollector: "tallaby",
      paymentGateway: { provider: "tallaby_pay", integrationId: INTEGRATION },
      tallabyPay: { feeBps: 300, holdDays: 0, termsVersion: "2026-11-18" },
    },
    ...overrides,
  };
}

/** A fake EasyKash Inquiry endpoint. */
function inquiry(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
}
const PAID = { status: "PAID", Amount: "100.00", easykashRef: "9876543", PaymentMethod: "Credit & Debit Card" };

beforeEach(() => {
  process.env.TALLABY_EASYKASH_HMAC_SECRET = HMAC;
  process.env.TALLABY_EASYKASH_API_KEY = "tallaby-api-key";
  mocks.order = orderRow();
  mocks.selectQueue = [[{ sellerId: SELLER }]];
  mocks.inserted = [];
  mocks.transactions = 0;
  mocks.claim.mockReset().mockResolvedValue("paid");
  mocks.ensureWallet.mockClear();
  mocks.postEntry.mockClear();
  mocks.notifyDeposit.mockClear();
  mocks.findOrder.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.TALLABY_EASYKASH_HMAC_SECRET;
  delete process.env.TALLABY_EASYKASH_API_KEY;
  vi.restoreAllMocks();
});

describe("handleTallabyPayCallback: checks before any money moves", () => {
  it("400 without a reference or signature", async () => {
    expect((await handleTallabyPayCallback({ customerReference: "x" })).status).toBe(400);
    expect((await handleTallabyPayCallback(null)).status).toBe(400);
    expect(mocks.findOrder).not.toHaveBeenCalled();
  });

  it("500 when the HMAC secret is not set, logging no secret", async () => {
    delete process.env.TALLABY_EASYKASH_HMAC_SECRET;
    const result = await handleTallabyPayCallback(signed());
    expect(result.status).toBe(500);
    expect(mocks.findOrder).not.toHaveBeenCalled();
    expect(JSON.stringify((console.error as unknown as { mock: { calls: unknown[] } }).mock.calls)).not.toContain(HMAC);
  });

  it("401 for a wrong signature, before reading anything", async () => {
    const forged = { ...signed(), Amount: "1.00" };
    expect((await handleTallabyPayCallback(forged)).status).toBe(401);
    expect((await handleTallabyPayCallback(signed({}, "another-secret"))).status).toBe(401);
    expect(mocks.findOrder).not.toHaveBeenCalled();
    expect(mocks.transactions).toBe(0);
  });

  it("ignores a seller gateway reference and an unknown order", async () => {
    const seller = await handleTallabyPayCallback(signed({ customerReference: buildGatewayReference(ORDER) }));
    expect(seller).toMatchObject({ status: 200, body: { outcome: "ignored" } });
    expect(mocks.findOrder).not.toHaveBeenCalled();
    mocks.order = null;
    expect(await handleTallabyPayCallback(signed())).toMatchObject({ status: 200, body: { outcome: "ignored" } });
  });

  it("ignores an order whose snapshot is not Tallaby Pay, without asking EasyKash", async () => {
    mocks.order = orderRow({ metadata: { paymentGateway: { provider: "easykash", integrationId: INTEGRATION } } });
    const fetch = inquiry(PAID);
    expect(await handleTallabyPayCallback(signed(), { fetch })).toMatchObject({ status: 200, body: { outcome: "ignored" } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("500 for a Tallaby Pay order without its fee snapshot", async () => {
    mocks.order = orderRow({ metadata: { paymentGateway: { provider: "tallaby_pay", integrationId: INTEGRATION } } });
    expect((await handleTallabyPayCallback(signed(), { fetch: inquiry(PAID) })).status).toBe(500);
    expect(mocks.transactions).toBe(0);
  });

  it("500 when the API key is not set or the Inquiry fails; nothing moves", async () => {
    delete process.env.TALLABY_EASYKASH_API_KEY;
    expect((await handleTallabyPayCallback(signed(), { fetch: inquiry(PAID) })).status).toBe(500);
    process.env.TALLABY_EASYKASH_API_KEY = "tallaby-api-key";
    expect((await handleTallabyPayCallback(signed(), { fetch: inquiry({}, 503) })).status).toBe(500);
    expect((await handleTallabyPayCallback(signed(), { fetch: inquiry({ status: "PAID", Amount: "" }) })).status).toBe(500);
    expect(mocks.transactions).toBe(0);
  });

  it("asks the Inquiry API with Tallaby's key and acts on PAID/DELIVERED only", async () => {
    const fetch = inquiry({ status: "NEW", Amount: "100.00" });
    expect(await handleTallabyPayCallback(signed(), { fetch })).toMatchObject({ status: 200, body: { outcome: "not_paid" } });
    const [, init] = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0]!;
    expect((init.headers as Record<string, string>).authorization).toBe("tallaby-api-key");
    expect(mocks.transactions).toBe(0);
  });
});

describe("handleTallabyPayCallback: settlement", () => {
  it("claims the order and credits the sale in the same transaction (100.00 → fee 3.00, net 97.00)", async () => {
    const result = await handleTallabyPayCallback(signed(), { fetch: inquiry(PAID) });
    expect(result).toMatchObject({ status: 200, body: { outcome: "paid" }, paidOrderId: ORDER });
    expect(mocks.transactions).toBe(1);
    expect(mocks.claim).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        purpose: "order",
        transactionId: "tallaby_pay:9876543",
        event: expect.objectContaining({ status: "SUCCESS", amountPiastres: 10_000, currency: "EGP" }),
        paymentData: expect.objectContaining({ provider: "tallaby_pay", collector: "tallaby", integrationId: INTEGRATION }),
      }),
    );
    expect(mocks.ensureWallet).toHaveBeenCalledWith(expect.anything(), STORE, SELLER);
    expect(mocks.inserted).toEqual([
      expect.objectContaining({
        orderId: ORDER,
        storeId: STORE,
        purpose: "order",
        easykashRef: "9876543",
        gross: "100.00",
        fee: "3.00",
        net: "97.00",
        feeBps: 300,
        holdDays: 0,
        status: "pending",
        paymentMethod: "Credit & Debit Card",
      }),
    ]);
    expect(mocks.postEntry).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kind: "sale", pendingPiastres: 9_700, saleId: "sale-1", referenceType: "sale", referenceId: "sale-1" }),
    );
    // Hold days 0: nothing goes to available here (the release is F-100d).
    expect(mocks.postEntry.mock.calls[0]![1]).not.toHaveProperty("availablePiastres");
  });

  it("uses the order's fee snapshot, never the current setting", async () => {
    mocks.order = orderRow({
      metadata: { ...orderRow().metadata, tallabyPay: { feeBps: 500, holdDays: 0, termsVersion: "2026-11-18" } },
    });
    await handleTallabyPayCallback(signed(), { fetch: inquiry(PAID) });
    expect(mocks.inserted[0]).toMatchObject({ fee: "5.00", net: "95.00", feeBps: 500 });
    expect(mocks.postEntry).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ pendingPiastres: 9_500 }));
  });

  it("customer pays the fee (F-100j): fee = the recorded surcharge, the seller nets the 100.00 base", async () => {
    mocks.order = orderRow({
      totalAmount: "103.00",
      paymentFeeAmount: "3.00",
      metadata: {
        ...orderRow().metadata,
        tallabyPay: { feeBps: 300, holdDays: 0, termsVersion: "2026-11-18", feePayer: "customer", customerFeePiastres: 300 },
      },
    });
    const result = await handleTallabyPayCallback(signed({ Amount: "103.00" }), { fetch: inquiry({ ...PAID, Amount: "103.00" }) });
    expect(result).toMatchObject({ status: 200, body: { outcome: "paid" } });
    expect(mocks.inserted[0]).toMatchObject({ gross: "103.00", fee: "3.00", net: "100.00", feeBps: 300 });
    expect(mocks.postEntry).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kind: "sale", pendingPiastres: 10_000, metadata: expect.objectContaining({ feePayer: "customer" }) }),
    );
  });

  it("customer pays the fee: the surcharge is never recomputed from a later rate", async () => {
    // 1,000.00 base at 3% = 30.00 surcharge, recorded; even if the snapshot bps were edited later, the fee stays 30.00.
    mocks.order = orderRow({
      totalAmount: "1030.00",
      metadata: {
        ...orderRow().metadata,
        tallabyPay: { feeBps: 500, holdDays: 0, termsVersion: "2026-11-18", feePayer: "customer", customerFeePiastres: 3_000 },
      },
    });
    await handleTallabyPayCallback(signed({ Amount: "1030.00" }), { fetch: inquiry({ ...PAID, Amount: "1030.00" }) });
    expect(mocks.inserted[0]).toMatchObject({ gross: "1030.00", fee: "30.00", net: "1000.00" });
  });

  it("500 for a customer-pays snapshot without its surcharge (never a guessed split)", async () => {
    mocks.order = orderRow({
      metadata: { ...orderRow().metadata, tallabyPay: { feeBps: 300, holdDays: 0, termsVersion: "2026-11-18", feePayer: "customer" } },
    });
    expect((await handleTallabyPayCallback(signed(), { fetch: inquiry(PAID) })).status).toBe(500);
    expect(mocks.transactions).toBe(0);
  });

  it("credits nothing on an amount mismatch or a replayed duplicate", async () => {
    mocks.claim.mockResolvedValue("mismatch");
    const wrong = await handleTallabyPayCallback(signed({ Amount: "90.00" }), { fetch: inquiry({ ...PAID, Amount: "90.00" }) });
    expect(wrong).toMatchObject({ status: 200, body: { outcome: "mismatch" } });
    mocks.claim.mockResolvedValue("duplicate");
    mocks.selectQueue = [[{ sellerId: SELLER }], [{ id: "sale-1" }]];
    const dup = await handleTallabyPayCallback(signed(), { fetch: inquiry(PAID) });
    expect(dup).toMatchObject({ status: 200, body: { duplicate: true } });
    expect(dup.paidOrderId).toBeUndefined();
    expect(mocks.inserted).toEqual([]);
    expect(mocks.postEntry).not.toHaveBeenCalled();
  });

  it("paid after cancel (exact amount, claim refused): a sale born in the refund queue (F-100d)", async () => {
    mocks.claim.mockResolvedValue("mismatch");
    const result = await handleTallabyPayCallback(signed(), { fetch: inquiry(PAID) });
    expect(result).toMatchObject({ status: 200, body: { outcome: "mismatch" } });
    expect(result.paidOrderId).toBeUndefined();
    expect(mocks.inserted).toEqual([
      expect.objectContaining({ net: "97.00", status: "pending", refundState: "requested", refundReason: "paid_after_cancel" }),
    ]);
    expect(mocks.postEntry).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ kind: "sale", pendingPiastres: 9_700 }));
  });

  it("paid twice (no sale for this reference): recorded in payments for review, never credited (F-100d)", async () => {
    mocks.claim.mockResolvedValue("duplicate");
    mocks.selectQueue = [[{ sellerId: SELLER }], []];
    const dup = await handleTallabyPayCallback(signed({ easykashRef: "111" }), { fetch: inquiry(PAID) });
    expect(dup).toMatchObject({ status: 200, body: { duplicate: true } });
    expect(mocks.inserted).toEqual([
      expect.objectContaining({
        orderId: ORDER,
        transactionId: "tallaby_pay:111",
        status: "pending",
        amount: "100.00",
        errorMessage: expect.stringContaining("Paid twice"),
      }),
    ]);
    expect(mocks.postEntry).not.toHaveBeenCalled();
  });

  it("propagates a failed credit, so the claim's transaction rolls back", async () => {
    mocks.postEntry.mockRejectedValueOnce(new Error("ledger down"));
    await expect(handleTallabyPayCallback(signed(), { fetch: inquiry(PAID) })).rejects.toThrow("ledger down");
  });

  it("settles a COD deposit as a deposit sale and tells the seller", async () => {
    mocks.order = orderRow({
      paymentMethod: "cash_on_delivery",
      depositStatus: "awaiting",
      depositAmount: "50.00",
      metadata: {
        deposit: { gateway: { provider: "tallaby_pay", integrationId: INTEGRATION } },
        tallabyPay: { feeBps: 300, holdDays: 0, termsVersion: "2026-11-18" },
      },
    });
    mocks.claim.mockResolvedValue("deposit_paid");
    const result = await handleTallabyPayCallback(signed({ Amount: "50.00" }), { fetch: inquiry({ ...PAID, Amount: "50.00" }) });
    expect(result).toMatchObject({ status: 200, body: { outcome: "deposit_paid" } });
    expect(result.paidOrderId).toBeUndefined();
    expect(mocks.claim).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ purpose: "deposit" }));
    expect(mocks.inserted[0]).toMatchObject({ purpose: "deposit", gross: "50.00", fee: "1.50", net: "48.50" });
    expect(mocks.notifyDeposit).toHaveBeenCalledWith(ORDER, "deposit_paid");
  });
});
