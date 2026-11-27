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
 * Tallaby Pay release on delivery, refunds before delivery and the
 * paid-after-cancel / paid-twice paths (F-100d, design §5, owner §14) against
 * a Postgres with 0175 applied. Skipped when TEST_DATABASE_URL is unset.
 * Sales are made through the real callback (fake Inquiry, real HMAC). Creates
 * and deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

type SettleModule = typeof import("./settle.server");
type LedgerModule = typeof import("./ledger.server");
type ReleaseModule = typeof import("./release.server");

const HMAC = "tallaby-pay-release-it-secret";

describe.skipIf(!TEST_DATABASE_URL)("Tallaby Pay release and refunds (integration)", { timeout: 120_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 8 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const tag = randomUUID().slice(0, 6);
  const created: string[] = [];
  const orderIds: string[] = [];
  let settle: SettleModule;
  let ledger: LedgerModule;
  let release: ReleaseModule;
  let adminId: string;
  let refCount = 0;

  async function makeStore() {
    const sellerId = randomUUID();
    const sub = `tpr-${tag}-${created.length}`;
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

  /** `customerFee` (F-100j): the store's customers pay the fee; `total` already includes it. */
  async function makeOrder(store: Store, total = "100.00", customerFee?: { amount: string; piastres: number }) {
    const id = randomUUID();
    orderIds.push(id);
    await db.insert(s.orders).values({
      id,
      orderNumber: `TPR-${id.slice(0, 8)}`,
      userId: store.sellerId,
      storeId: store.storeId,
      currency: "EGP",
      subtotal: total,
      totalAmount: total,
      ...(customerFee && { paymentFeeAmount: customerFee.amount }),
      status: "payment_processing",
      paymentStatus: "pending",
      paymentMethod: "online_payment",
      metadata: {
        paymentCollector: "tallaby",
        paymentGateway: { provider: "tallaby_pay", integrationId: randomUUID() },
        tallabyPay: {
          feeBps: 300,
          holdDays: 0,
          termsVersion: "2026-11-18",
          ...(customerFee && { feePayer: "customer", customerFeePiastres: customerFee.piastres }),
        },
      },
    });
    return id;
  }

  function callback(orderId: string, opts: { ref?: string; amount?: string } = {}) {
    const fields: Record<string, string> = {
      ProductCode: "EDV4471",
      Amount: opts.amount ?? "100.00",
      ProductType: "Direct Pay",
      PaymentMethod: "Credit & Debit Card",
      status: "PAID",
      easykashRef: opts.ref ?? `rel-${tag}-${refCount++}`,
      customerReference: buildTallabyPayReference(orderId),
    };
    const signatureHash = createHmac("sha512", HMAC).update(easykashSignatureString(fields as never)).digest("hex");
    return { ...fields, signatureHash };
  }

  const inquiry = (amount = "100.00") =>
    vi.fn(async () => new Response(JSON.stringify({ status: "PAID", Amount: amount, PaymentMethod: "Credit & Debit Card" }), { status: 200 })) as unknown as typeof fetch;

  async function paidOrder(store: Store, total = "100.00", customerFee?: { amount: string; piastres: number }) {
    const orderId = await makeOrder(store, total, customerFee);
    const result = await settle.handleTallabyPayCallback(callback(orderId, { amount: total }), { fetch: inquiry(total) });
    expect(result).toMatchObject({ status: 200, body: { outcome: "paid" } });
    const [sale] = await sales(orderId);
    return { orderId, saleId: sale!.id };
  }

  const deliver = (orderId: string) =>
    db.execute(sql`UPDATE orders SET status = 'delivered', delivered_at = now() WHERE id = ${orderId}`);

  const sales = (orderId: string) => db.select().from(s.tallabyPaySales).where(eq(s.tallabyPaySales.orderId, orderId));
  const saleRow = async (saleId: string) => (await db.select().from(s.tallabyPaySales).where(eq(s.tallabyPaySales.id, saleId)))[0]!;
  const entries = (store: Store, kind?: string) =>
    db
      .select()
      .from(s.tallabyPayEntries)
      .where(eq(s.tallabyPayEntries.storeId, store.storeId))
      .then((rows) => (kind ? rows.filter((r) => r.kind === kind) : rows));
  const totals = async (store: Store) => {
    const t = await ledger.getTallabyPayLedgerTotals(db as never, store.storeId);
    // The ledger always equals the balances (design §4.5).
    expect(t!.ledgerPending).toBe(t!.pending);
    expect(t!.ledgerAvailable).toBe(t!.available);
    expect(t!.ledgerReserved).toBe(t!.reserved);
    return t!;
  };
  const feesBox = async (store: Store) => {
    const [row] = await db.execute<{ fees: string }>(sql`
      SELECT coalesce(sum(fee), 0)::numeric(12,2)::text AS fees FROM tallaby_pay_sales
       WHERE store_id = ${store.storeId} AND status <> 'refunded'
    `);
    return row!.fees;
  };
  const auditCount = async (sellerId: string) => {
    const [row] = await db.execute<{ n: number }>(
      sql`SELECT count(*)::int AS n FROM admin_audit_log WHERE action = 'tallaby_pay_sale_refunded' AND seller_id = ${sellerId}`,
    );
    return row!.n;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.TALLABY_EASYKASH_HMAC_SECRET = HMAC;
    process.env.TALLABY_EASYKASH_API_KEY = "tallaby-pay-release-it-key";
    settle = await import("./settle.server");
    ledger = await import("./ledger.server");
    release = await import("./release.server");
    adminId = randomUUID();
    await createAuthUsers(adminId);
    await db.insert(s.users).values({ id: adminId, isGuest: false, role: "admin", isVerified: true });
    created.push(adminId);
  }, 120_000);

  afterAll(async () => {
    // Deleting the seller accounts cascades their wallets, sales and entries (0175).
    if (created.length) {
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, created));
      await db.delete(s.users).where(inArray(s.users.id, created));
    }
    if (orderIds.length) {
      await db.delete(s.payments).where(inArray(s.payments.orderId, orderIds));
      await db.delete(s.orders).where(inArray(s.orders.id, orderIds));
    }
    await client.end();
  }, 120_000);

  it("releases once on delivery: pending −97, available +97; a second call changes nothing", async () => {
    const store = await makeStore();
    const { orderId, saleId } = await paidOrder(store);
    await deliver(orderId);

    expect(await release.releaseTallabyPaySale(saleId, db as never)).toMatchObject({ released: true });
    expect(await release.releaseTallabyPaySale(saleId, db as never)).toMatchObject({ released: false, reason: "not_pending" });
    expect(await release.releaseTallabyPayOrderOnDelivery(orderId, db as never)).toBe(0);
    expect(await entries(store, "release")).toHaveLength(1);
    expect(await saleRow(saleId)).toMatchObject({ status: "available" });
    expect((await saleRow(saleId)).releasedAt).not.toBeNull();
    expect(await totals(store)).toMatchObject({ pending: "0.00", available: "97.00" });
  });

  it("releases only a delivered order; the cron picks it up once delivered", async () => {
    const store = await makeStore();
    const { orderId, saleId } = await paidOrder(store);
    expect(await release.releaseTallabyPaySale(saleId, db as never)).toMatchObject({ released: false, reason: "not_delivered" });
    await release.releaseDueTallabyPaySales({}, db as never);
    expect(await saleRow(saleId)).toMatchObject({ status: "pending" });
    expect(await totals(store)).toMatchObject({ pending: "97.00", available: "0.00" });

    await deliver(orderId);
    const run = await release.releaseDueTallabyPaySales({}, db as never);
    expect(run.released).toBeGreaterThanOrEqual(1);
    expect(await saleRow(saleId)).toMatchObject({ status: "available" });
    expect(await totals(store)).toMatchObject({ pending: "0.00", available: "97.00" });
    // A rerun is a no-op.
    await release.releaseDueTallabyPaySales({}, db as never);
    expect(await entries(store, "release")).toHaveLength(1);
  });

  it("a refund before delivery reverses the net and the fee; the order and payment become refunded", async () => {
    const store = await makeStore();
    const { orderId, saleId } = await paidOrder(store);
    expect(await feesBox(store)).toBe("3.00");

    const args = { saleId, adminId, reason: "Customer cancelled", reference: "EK-REF-1" };
    expect(await release.refundTallabyPaySale(args, db as never)).toMatchObject({ success: true });
    expect(await release.refundTallabyPaySale(args, db as never)).toMatchObject({ success: false, error: "already_reviewed" });

    expect(await saleRow(saleId)).toMatchObject({ status: "refunded", refundReference: "EK-REF-1", refundState: null });
    expect(await entries(store, "refund")).toHaveLength(1);
    expect(await feesBox(store)).toBe("0.00");
    expect(await totals(store)).toMatchObject({ pending: "0.00", available: "0.00" });
    const [order] = await db.select({ paymentStatus: s.orders.paymentStatus }).from(s.orders).where(eq(s.orders.id, orderId));
    expect(order!.paymentStatus).toBe("refunded");
    const [payment] = await db.select({ status: s.payments.status }).from(s.payments).where(eq(s.payments.orderId, orderId));
    expect(payment!.status).toBe("refunded");
    expect(await auditCount(store.sellerId)).toBe(1);

    // A refunded sale never releases.
    await deliver(orderId);
    expect(await release.releaseTallabyPaySale(saleId, db as never)).toMatchObject({ released: false });
    expect(await totals(store)).toMatchObject({ pending: "0.00", available: "0.00" });
  });

  it("customer pays the fee (F-100j): 103.00 paid → net 100.00, fee 3.00; a refund reverses both exactly", async () => {
    const store = await makeStore();
    const { orderId, saleId } = await paidOrder(store, "103.00", { amount: "3.00", piastres: 300 });
    expect(await saleRow(saleId)).toMatchObject({ gross: "103.00", fee: "3.00", net: "100.00", feeBps: 300 });
    expect(await totals(store)).toMatchObject({ pending: "100.00" });
    expect(await feesBox(store)).toBe("3.00");

    expect(await release.refundTallabyPaySale({ saleId, adminId, reason: "Customer cancelled" }, db as never)).toMatchObject({
      success: true,
    });
    // The customer gets back everything they paid (gross 103.00); Tallaby keeps no fee.
    expect(await saleRow(saleId)).toMatchObject({ status: "refunded", gross: "103.00" });
    expect(await feesBox(store)).toBe("0.00");
    expect(await totals(store)).toMatchObject({ pending: "0.00", available: "0.00" });
    const [order] = await db.select({ paymentStatus: s.orders.paymentStatus }).from(s.orders).where(eq(s.orders.id, orderId));
    expect(order!.paymentStatus).toBe("refunded");
  });

  it("customer pays the fee: delivery releases the full base to available", async () => {
    const store = await makeStore();
    const { orderId, saleId } = await paidOrder(store, "103.00", { amount: "3.00", piastres: 300 });
    await deliver(orderId);
    expect(await release.releaseTallabyPaySale(saleId, db as never)).toMatchObject({ released: true });
    expect(await totals(store)).toMatchObject({ pending: "0.00", available: "100.00" });
  });

  it("after delivery Tallaby changes nothing, released or not, even once returned", async () => {
    const store = await makeStore();
    const a = await paidOrder(store);
    await deliver(a.orderId);
    await release.releaseTallabyPaySale(a.saleId, db as never);
    expect(await release.refundTallabyPaySale({ saleId: a.saleId, adminId, reason: "Returned" }, db as never)).toMatchObject({
      error: "delivered",
    });

    const b = await paidOrder(store);
    await deliver(b.orderId);
    await db.execute(sql`UPDATE orders SET status = 'returned' WHERE id = ${b.orderId}`);
    expect(await release.refundTallabyPaySale({ saleId: b.saleId, adminId, reason: "Returned" }, db as never)).toMatchObject({
      error: "delivered",
    });
    expect(await entries(store, "refund")).toHaveLength(0);
    expect(await totals(store)).toMatchObject({ pending: "97.00", available: "97.00" });
    expect(await auditCount(store.sellerId)).toBe(0);
  });

  it("an admin can't refund their own store's sale", async () => {
    const store = await makeStore();
    const { saleId } = await paidOrder(store);
    await db.update(s.users).set({ role: "admin", isVerified: true }).where(eq(s.users.id, store.sellerId));
    expect(await release.refundTallabyPaySale({ saleId, adminId: store.sellerId, reason: "Mine" }, db as never)).toMatchObject({
      error: "own_account",
    });
    expect(await totals(store)).toMatchObject({ pending: "97.00" });
  });

  it("concurrent releases post one entry; concurrent refunds succeed once", async () => {
    const store = await makeStore();
    const a = await paidOrder(store);
    await deliver(a.orderId);
    const released = await Promise.all(Array.from({ length: 5 }, () => release.releaseTallabyPaySale(a.saleId, db as never)));
    expect(released.filter((r) => r.released)).toHaveLength(1);
    expect(await entries(store, "release")).toHaveLength(1);

    const b = await paidOrder(store);
    const refunds = await Promise.all(
      Array.from({ length: 3 }, () => release.refundTallabyPaySale({ saleId: b.saleId, adminId, reason: "Dispute" }, db as never)),
    );
    expect(refunds.filter((r) => r.success)).toHaveLength(1);
    expect(await entries(store, "refund")).toHaveLength(1);
    expect(await totals(store)).toMatchObject({ pending: "0.00", available: "97.00" });
  });

  it("a release racing a refund request (the seller's cancel): exactly one wins", async () => {
    const store = await makeStore();
    const { orderId, saleId } = await paidOrder(store);
    await deliver(orderId);
    const [released, requested] = await Promise.all([
      release.releaseTallabyPaySale(saleId, db as never),
      db.transaction((tx) =>
        release.requestTallabyPayOrderRefund(tx as never, { orderId, sellerId: store.sellerId, requestedBy: store.sellerId, reason: "seller_cancelled" }),
      ),
    ]);
    expect(Number(released.released) + requested.length).toBe(1);
    const sale = await saleRow(saleId);
    if (released.released) expect(sale).toMatchObject({ status: "available", refundState: null });
    else expect(sale).toMatchObject({ status: "pending", refundState: "requested" });
    await totals(store);
  });

  it("a refund request blocks the release for good", async () => {
    const store = await makeStore();
    const { orderId, saleId } = await paidOrder(store);
    const ids = await db.transaction((tx) =>
      release.requestTallabyPayOrderRefund(tx as never, { orderId, sellerId: store.sellerId, requestedBy: store.sellerId, reason: "seller_cancelled" }),
    );
    expect(ids).toEqual([saleId]);
    // Another seller can't flag it (rule 5).
    const other = await makeStore();
    expect(await release.countOpenTallabyPaySales(db as never, orderId, other.sellerId)).toBe(0);
    await deliver(orderId);
    expect(await release.releaseTallabyPaySale(saleId, db as never)).toMatchObject({ released: false, reason: "refund_requested" });
    await release.releaseDueTallabyPaySales({}, db as never);
    expect(await saleRow(saleId)).toMatchObject({ status: "pending", refundState: "requested", refundReason: "seller_cancelled" });
    expect(await totals(store)).toMatchObject({ pending: "97.00", available: "0.00" });
  });

  it("paid after the order was cancelled: a sale in the refund queue that never releases", async () => {
    const store = await makeStore();
    const orderId = await makeOrder(store);
    await db.execute(sql`UPDATE orders SET status = 'cancelled', cancelled_at = now() WHERE id = ${orderId}`);
    const result = await settle.handleTallabyPayCallback(callback(orderId), { fetch: inquiry() });
    expect(result).toMatchObject({ status: 200, body: { outcome: "mismatch" } });

    const [sale] = await sales(orderId);
    expect(sale).toMatchObject({ status: "pending", refundState: "requested", refundReason: "paid_after_cancel", net: "97.00" });
    const [order] = await db.select({ status: s.orders.status, paymentStatus: s.orders.paymentStatus }).from(s.orders).where(eq(s.orders.id, orderId));
    expect(order).toMatchObject({ status: "cancelled", paymentStatus: "pending" });
    expect(await totals(store)).toMatchObject({ pending: "97.00", available: "0.00" });

    await release.releaseDueTallabyPaySales({}, db as never);
    expect(await release.releaseTallabyPaySale(sale!.id, db as never)).toMatchObject({ released: false });

    expect(await release.refundTallabyPaySale({ saleId: sale!.id, adminId, reason: "Paid after cancel" }, db as never)).toMatchObject({
      success: true,
    });
    expect(await totals(store)).toMatchObject({ pending: "0.00", available: "0.00" });
    const [payment] = await db.select({ status: s.payments.status }).from(s.payments).where(eq(s.payments.orderId, orderId));
    expect(payment!.status).toBe("refunded");
  });

  it("paid twice: the second payment is recorded for review once and never credited", async () => {
    const store = await makeStore();
    const { orderId } = await paidOrder(store);
    const second = callback(orderId, { ref: `rel-${tag}-twice` });
    for (let i = 0; i < 2; i++) {
      expect(await settle.handleTallabyPayCallback(second, { fetch: inquiry() })).toMatchObject({ status: 200, body: { duplicate: true } });
    }
    expect(await sales(orderId)).toHaveLength(1);
    expect(await entries(store, "sale")).toHaveLength(1);
    const rows = await db.select().from(s.payments).where(eq(s.payments.orderId, orderId));
    const review = rows.filter((r) => r.transactionId === `tallaby_pay:${second.easykashRef}`);
    expect(review).toHaveLength(1);
    expect(review[0]).toMatchObject({ status: "pending", amount: "100.00" });
    expect(review[0]!.errorMessage).toContain("Paid twice");
    expect(await totals(store)).toMatchObject({ pending: "97.00" });
  });
});
