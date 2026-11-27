import { createHmac, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createAuthUsers } from "../../../db/src/testing/auth-users";
import * as DB_SCHEMA from "@workspace/db/schema";

import { easykashSignatureString } from "../easykash/easykash.lib";
import { buildTallabyPayReference } from "../payments/store-gateways.lib";

/**
 * Tallaby Pay callback (F-100c, design §6.2) against a Postgres with 0175
 * applied: the order claim, the sale row and the ledger entry. Skipped when
 * TEST_DATABASE_URL is unset. EasyKash's Inquiry API is a fake fetch; the
 * HMAC is real. Creates and deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

type SettleModule = typeof import("./settle.server");
type LedgerModule = typeof import("./ledger.server");

const HMAC = "tallaby-pay-it-secret";

describe.skipIf(!TEST_DATABASE_URL)("Tallaby Pay callback (integration)", { timeout: 120_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 8 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const tag = randomUUID().slice(0, 6);
  const created: string[] = [];
  const orderIds: string[] = [];
  let settle: SettleModule;
  let ledger: LedgerModule;
  let refCount = 0;

  async function makeStore() {
    const sellerId = randomUUID();
    const sub = `tps-${tag}-${created.length}`;
    await createAuthUsers(sellerId);
    await db.insert(s.users).values({ id: sellerId, isGuest: false, role: "seller" });
    created.push(sellerId);
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain,
        support_email, status)
      VALUES (${sellerId}, ${sub}, ${sub}, ${sub}, ${sub},
        ${`${sub}@example.com`}, 'approved')
    `);
    const [store] = await db.select({ id: s.stores.id }).from(s.stores).where(eq(s.stores.sellerId, sellerId));
    return { sellerId, storeId: store!.id };
  }
  type Store = Awaited<ReturnType<typeof makeStore>>;

  const INTEGRATION = randomUUID();

  /** A storefront Tallaby Pay order awaiting payment (what place-order writes), or a COD order with a deposit. */
  async function makeOrder(store: Store, opts: { total?: string; feeBps?: number; deposit?: string } = {}) {
    const id = randomUUID();
    orderIds.push(id);
    const gateway = { provider: "tallaby_pay", integrationId: INTEGRATION };
    const snapshot = { feeBps: opts.feeBps ?? 300, holdDays: 0, termsVersion: "2026-11-18" };
    await db.insert(s.orders).values({
      id,
      orderNumber: `TPS-${id.slice(0, 8)}`,
      userId: store.sellerId,
      storeId: store.storeId,
      currency: "EGP",
      subtotal: opts.total ?? "100.00",
      totalAmount: opts.total ?? "100.00",
      ...(opts.deposit
        ? {
            status: "pending",
            paymentStatus: "pending",
            paymentMethod: "cash_on_delivery",
            depositAmount: opts.deposit,
            depositPercent: 50,
            depositStatus: "awaiting",
            metadata: { paymentCollector: "tallaby", deposit: { gateway }, tallabyPay: snapshot },
          }
        : {
            status: "payment_processing",
            paymentStatus: "pending",
            paymentMethod: "online_payment",
            metadata: { paymentCollector: "tallaby", paymentGateway: gateway, tallabyPay: snapshot },
          }),
    });
    return id;
  }

  function callback(orderId: string, opts: { ref?: string; amount?: string; secret?: string } = {}) {
    const fields: Record<string, string> = {
      ProductCode: "EDV4471",
      Amount: opts.amount ?? "100.00",
      ProductType: "Direct Pay",
      PaymentMethod: "Credit & Debit Card",
      status: "PAID",
      easykashRef: opts.ref ?? `it-${tag}-${refCount++}`,
      customerReference: buildTallabyPayReference(orderId),
    };
    const signatureHash = createHmac("sha512", opts.secret ?? HMAC).update(easykashSignatureString(fields as never)).digest("hex");
    return { ...fields, signatureHash };
  }

  const inquiry = (status: string, amount: string) =>
    vi.fn(async () => new Response(JSON.stringify({ status, Amount: amount, PaymentMethod: "Credit & Debit Card" }), { status: 200 })) as unknown as typeof fetch;

  const orderState = async (id: string) => {
    const [row] = await db
      .select({ status: s.orders.status, paymentStatus: s.orders.paymentStatus, depositStatus: s.orders.depositStatus })
      .from(s.orders)
      .where(eq(s.orders.id, id));
    return row!;
  };
  const sales = (orderId: string) => db.select().from(s.tallabyPaySales).where(eq(s.tallabyPaySales.orderId, orderId));
  const paymentRows = (orderId: string) => db.select().from(s.payments).where(eq(s.payments.orderId, orderId));
  const entries = (store: Store) => db.select().from(s.tallabyPayEntries).where(eq(s.tallabyPayEntries.storeId, store.storeId));
  const totals = async (store: Store) => {
    const t = await ledger.getTallabyPayLedgerTotals(db as never, store.storeId);
    if (t) {
      // The ledger always equals the balances (design §4.5).
      expect(t.ledgerPending).toBe(t.pending);
      expect(t.ledgerAvailable).toBe(t.available);
    }
    return t;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.TALLABY_EASYKASH_HMAC_SECRET = HMAC;
    process.env.TALLABY_EASYKASH_API_KEY = "tallaby-pay-it-key";
    settle = await import("./settle.server");
    ledger = await import("./ledger.server");
  }, 120_000);

  afterAll(async () => {
    if (orderIds.length) {
      await db.delete(s.tallabyPaySales).where(inArray(s.tallabyPaySales.orderId, orderIds));
      await db.delete(s.payments).where(inArray(s.payments.orderId, orderIds));
      await db.delete(s.orders).where(inArray(s.orders.id, orderIds));
    }
    if (created.length) {
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, created));
      await db.delete(s.users).where(inArray(s.users.id, created));
    }
    await client.end();
  }, 120_000);

  it("a signed, PAID callback marks the order paid and credits pending +97.00 with fee 3.00, once", async () => {
    const store = await makeStore();
    const orderId = await makeOrder(store);
    const body = callback(orderId);

    const result = await settle.handleTallabyPayCallback(body, { fetch: inquiry("PAID", "100.00") });
    expect(result).toMatchObject({ status: 200, body: { outcome: "paid" }, paidOrderId: orderId });
    expect(await orderState(orderId)).toMatchObject({ status: "confirmed", paymentStatus: "paid" });
    const [sale] = await sales(orderId);
    expect(sale).toMatchObject({ purpose: "order", gross: "100.00", fee: "3.00", net: "97.00", feeBps: 300, holdDays: 0, status: "pending" });
    const [payment] = await paymentRows(orderId);
    expect(payment).toMatchObject({ status: "paid", amount: "100.00", transactionId: `tallaby_pay:${body.easykashRef}` });
    expect(payment!.paymentData).toMatchObject({ provider: "tallaby_pay", collector: "tallaby" });
    expect(await totals(store)).toMatchObject({ pending: "97.00", available: "0.00" });

    // A replay changes nothing.
    const replay = await settle.handleTallabyPayCallback(body, { fetch: inquiry("PAID", "100.00") });
    expect(replay).toMatchObject({ status: 200, body: { duplicate: true } });
    expect(await sales(orderId)).toHaveLength(1);
    expect(await entries(store)).toHaveLength(1);
    expect(await totals(store)).toMatchObject({ pending: "97.00" });
  });

  it("concurrent duplicates credit exactly once", async () => {
    const store = await makeStore();
    const orderId = await makeOrder(store, { total: "250.00" });
    const body = callback(orderId, { amount: "250.00" });
    const results = await Promise.all(
      Array.from({ length: 5 }, () => settle.handleTallabyPayCallback(body, { fetch: inquiry("PAID", "250.00") })),
    );
    expect(results.filter((r) => r.body.outcome === "paid")).toHaveLength(1);
    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(await sales(orderId)).toHaveLength(1);
    expect(await entries(store)).toHaveLength(1);
    expect(await totals(store)).toMatchObject({ pending: "242.50" });
  });

  it("a wrong HMAC is 401 and changes nothing", async () => {
    const store = await makeStore();
    const orderId = await makeOrder(store);
    const result = await settle.handleTallabyPayCallback(callback(orderId, { secret: "not-tallabys" }), {
      fetch: inquiry("PAID", "100.00"),
    });
    expect(result.status).toBe(401);
    expect(await orderState(orderId)).toMatchObject({ status: "payment_processing", paymentStatus: "pending" });
    expect(await sales(orderId)).toHaveLength(0);
    expect(await paymentRows(orderId)).toHaveLength(0);
  });

  it("Inquiry NEW changes nothing", async () => {
    const store = await makeStore();
    const orderId = await makeOrder(store);
    const result = await settle.handleTallabyPayCallback(callback(orderId), { fetch: inquiry("NEW", "100.00") });
    expect(result).toMatchObject({ status: 200, body: { outcome: "not_paid" } });
    expect(await orderState(orderId)).toMatchObject({ paymentStatus: "pending" });
    expect(await sales(orderId)).toHaveLength(0);
    expect(await totals(store)).toBeNull();
  });

  it("a different amount is recorded for review and never paid or credited", async () => {
    const store = await makeStore();
    const orderId = await makeOrder(store);
    const result = await settle.handleTallabyPayCallback(callback(orderId, { amount: "90.00" }), { fetch: inquiry("PAID", "90.00") });
    expect(result).toMatchObject({ status: 200, body: { outcome: "mismatch" } });
    expect(await orderState(orderId)).toMatchObject({ status: "payment_processing", paymentStatus: "pending" });
    const [payment] = await paymentRows(orderId);
    expect(payment).toMatchObject({ status: "pending" });
    expect(payment!.errorMessage).toContain("mismatch");
    expect(await sales(orderId)).toHaveLength(0);
  });

  it("the order claim and the credit commit together or not at all", async () => {
    const store = await makeStore();
    // Another order of the store already holds this EasyKash reference: the
    // sale insert fails on its unique key, after the order claim ran.
    const other = await makeOrder(store);
    const takenRef = `it-${tag}-taken`;
    await settle.handleTallabyPayCallback(callback(other, { ref: takenRef }), { fetch: inquiry("PAID", "100.00") });
    const before = await totals(store);

    const orderId = await makeOrder(store);
    await expect(
      settle.handleTallabyPayCallback(callback(orderId, { ref: takenRef }), { fetch: inquiry("PAID", "100.00") }),
    ).rejects.toThrow();
    expect(await orderState(orderId)).toMatchObject({ status: "payment_processing", paymentStatus: "pending" });
    expect(await paymentRows(orderId)).toHaveLength(0);
    expect(await sales(orderId)).toHaveLength(0);
    expect(await totals(store)).toMatchObject({ pending: before!.pending });
  });

  it("uses the fee snapshotted on the order, not the current setting", async () => {
    const store = await makeStore();
    const orderId = await makeOrder(store, { feeBps: 500 });
    await settle.handleTallabyPayCallback(callback(orderId), { fetch: inquiry("PAID", "100.00") });
    const [sale] = await sales(orderId);
    expect(sale).toMatchObject({ fee: "5.00", net: "95.00", feeBps: 500 });
    expect(await totals(store)).toMatchObject({ pending: "95.00" });
  });

  it("a COD deposit paid with Tallaby Pay becomes a deposit sale; the order stays COD", async () => {
    const store = await makeStore();
    const orderId = await makeOrder(store, { deposit: "50.00" });
    const result = await settle.handleTallabyPayCallback(callback(orderId, { amount: "50.00" }), { fetch: inquiry("PAID", "50.00") });
    expect(result).toMatchObject({ status: 200, body: { outcome: "deposit_paid" } });
    expect(result.paidOrderId).toBeUndefined();
    expect(await orderState(orderId)).toMatchObject({ status: "pending", paymentStatus: "pending", depositStatus: "paid" });
    const [sale] = await sales(orderId);
    expect(sale).toMatchObject({ purpose: "deposit", gross: "50.00", fee: "1.50", net: "48.50" });
    expect(await totals(store)).toMatchObject({ pending: "48.50" });
  });
});
