import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tallaby Pay turn on / off rules (ROADMAP.md F-100b, design §2.1–§2.2). The
 * database is a fake transaction that answers each query in order; the DB
 * integration of the same flow runs on staging (F-100h).
 */

const mocks = vi.hoisted(() => {
  /** A callable stand-in for every query builder, column and helper of @workspace/db. */
  const anything: unknown = new Proxy(function () {}, {
    get: (_target, key) => (key === "then" ? undefined : anything),
    apply: () => anything,
  });
  return {
    anything,
    settings: { feeBps: 300, holdDays: 0, minPayoutPiastres: 50_000, live: true },
    switchOn: true,
  };
});

// Real query builders, a fake connection: every function under test takes `q`, and nothing here reaches `db`.
vi.mock("@workspace/db", async (importOriginal) => ({ ...(await importOriginal<typeof import("@workspace/db")>()), db: mocks.anything }));
vi.mock("@workspace/db/wallet", () => ({ chargeOrderPlacementFee: vi.fn() }));
vi.mock("../tallaby-pay/settings.server", () => ({ getTallabyPaySettings: vi.fn(async () => mocks.settings) }));
vi.mock("../stores/platform-switches.server", () => ({ isSwitchOn: vi.fn(async () => mocks.switchOn) }));
vi.mock("../orders/cod-deposit.server", () => ({ notifyDeposit: vi.fn() }));

import { TALLABY_PAY_TERMS_VERSION } from "./store-gateways.lib";
import { connectStoreGateway, disableTallabyPay, disconnectStoreGateway, enableTallabyPay } from "./store-gateways.server";

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const USER = "33333333-3333-4333-8333-333333333333";

const ROW = {
  provider: "tallaby_pay",
  status: "connected",
  config: { mode: "live", termsVersion: TALLABY_PAY_TERMS_VERSION, termsAcceptedAt: "x", enabledAt: "x" },
  credentialsSaved: false,
  lastError: null,
  lastSyncedAt: null,
  connectedAt: "2026-11-18T10:00:00Z",
  updatedAt: "2026-11-18T10:00:00Z",
};

type Write = { kind: "insert" | "update"; values: unknown };

/** A query chain that resolves to `result` whatever is called on it, recording `.values()` / `.set()`. */
function chain(result: unknown, onWrite?: (values: unknown) => void): unknown {
  const self: unknown = new Proxy(function () {}, {
    get: (_target, key) => {
      if (key === "then") return (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
      if ((key === "values" || key === "set") && onWrite) return (values: unknown) => (onWrite(values), self);
      return () => self;
    },
  });
  return self;
}

/** A fake db whose transaction answers selects from `selects` in order and returns `returning` for writes. */
function fakeDb(selects: unknown[][], returning: unknown[] = [ROW]) {
  const writes: Write[] = [];
  const tx = {
    select: () => chain(selects.shift() ?? []),
    insert: () => chain(returning, (values) => writes.push({ kind: "insert", values })),
    update: () => chain(returning, (values) => writes.push({ kind: "update", values })),
  };
  const q = { transaction: async (run: (t: typeof tx) => unknown) => run(tx) };
  return { q: q as never, writes };
}

const EGP_STORE = { status: "active", settings: { currency: "EGP" } };

beforeEach(() => {
  mocks.settings = { feeBps: 300, holdDays: 0, minPayoutPiastres: 50_000, live: true };
  mocks.switchOn = true;
});

describe("enableTallabyPay", () => {
  it("turns it on with the terms: row with no credentials, terms version, and an audit entry", async () => {
    const { q, writes } = fakeDb([[EGP_STORE], []]);
    const result = await enableTallabyPay(SELLER, USER, STORE, { termsAccepted: true }, q);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.connected?.provider).toBe("tallaby_pay");
    expect(result.data.connected?.details).toMatchObject({ mode: "live", termsVersion: TALLABY_PAY_TERMS_VERSION });
    expect(result.data.tallabyPay).toEqual(mocks.settings);

    const [row, audit] = writes;
    expect(row?.values).toMatchObject({
      provider: "tallaby_pay",
      status: "connected",
      credentialsEncrypted: null,
      config: { mode: "live", termsVersion: TALLABY_PAY_TERMS_VERSION },
    });
    expect(audit?.values).toMatchObject({ section: "payments", action: "tallaby_pay_enabled", changes: { gateway: "tallaby_pay", feeBps: 300 } });
  });

  it("refuses without the terms ticked, before touching the database", async () => {
    const { q, writes } = fakeDb([]);
    expect(await enableTallabyPay(SELLER, USER, STORE, { termsAccepted: false }, q)).toEqual({ success: false, error: "terms_required" });
    expect(writes).toEqual([]);
  });

  it("refuses a bad store id, another seller's store and a read-only store", async () => {
    expect(await enableTallabyPay(SELLER, USER, "nope", { termsAccepted: true }, fakeDb([]).q)).toEqual({ success: false, error: "not_found" });
    expect(await enableTallabyPay(SELLER, USER, STORE, { termsAccepted: true }, fakeDb([[]]).q)).toEqual({ success: false, error: "not_found" });
    expect(await enableTallabyPay(SELLER, USER, STORE, { termsAccepted: true }, fakeDb([[{ ...EGP_STORE, status: "suspended" }]]).q)).toEqual({
      success: false,
      error: "store_read_only",
    });
  });

  it("is EGP stores only (v1)", async () => {
    const { q, writes } = fakeDb([[{ status: "active", settings: { currency: "SAR" } }], []]);
    expect(await enableTallabyPay(SELLER, USER, STORE, { termsAccepted: true }, q)).toEqual({ success: false, error: "currency_not_supported" });
    expect(writes).toEqual([]);
  });

  it("refuses while the tallaby_pay_live launch switch is off", async () => {
    mocks.settings = { ...mocks.settings, live: false };
    const { q, writes } = fakeDb([[EGP_STORE], []]);
    expect(await enableTallabyPay(SELLER, USER, STORE, { termsAccepted: true }, q)).toEqual({ success: false, error: "not_live" });
    expect(writes).toEqual([]);
  });

  it("refuses while another gateway is connected (one gateway per store)", async () => {
    const { q, writes } = fakeDb([[EGP_STORE], [{ id: "kashier-row" }]]);
    expect(await enableTallabyPay(SELLER, USER, STORE, { termsAccepted: true }, q)).toEqual({ success: false, error: "other_gateway_connected" });
    expect(writes).toEqual([]);
  });
});

describe("disableTallabyPay", () => {
  it("keeps the row as disconnected and audits it", async () => {
    const { q, writes } = fakeDb([[{ status: "active" }]], [{ id: "row" }]);
    expect(await disableTallabyPay(SELLER, USER, STORE, q)).toEqual({ success: true, data: null });
    expect(writes[0]).toMatchObject({ kind: "update", values: { status: "disconnected" } });
    expect(writes[1]?.values).toMatchObject({ action: "tallaby_pay_disabled" });
  });

  it("writes no audit entry when it was not on", async () => {
    const { q, writes } = fakeDb([[{ status: "active" }]], []);
    expect(await disableTallabyPay(SELLER, USER, STORE, q)).toEqual({ success: true, data: null });
    expect(writes.map((w) => w.kind)).toEqual(["update"]);
  });

  it("works while the launch switch is off, but only on the seller's own active store", async () => {
    mocks.switchOn = false;
    expect(await disableTallabyPay(SELLER, USER, STORE, fakeDb([[]]).q)).toEqual({ success: false, error: "not_found" });
    expect((await disableTallabyPay(SELLER, USER, STORE, fakeDb([[{ status: "active" }]], []).q)).success).toBe(true);
  });
});

describe("the key-based gateway actions refuse Tallaby Pay", () => {
  it("connectStoreGateway and disconnectStoreGateway answer unsupported", async () => {
    const { q, writes } = fakeDb([]);
    expect(await connectStoreGateway(SELLER, USER, STORE, "tallaby_pay", {}, { q })).toEqual({ success: false, error: "unsupported" });
    expect(await disconnectStoreGateway(SELLER, USER, STORE, "tallaby_pay", q)).toEqual({ success: false, error: "unsupported" });
    expect(writes).toEqual([]);
  });
});
