import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAuthUsers } from "../../../db/src/testing/auth-users";
import * as DB_SCHEMA from "@workspace/db/schema";

import { piastresToAmount, splitTallabyPay } from "./fee.lib";

/**
 * Tallaby Pay withdrawals and KYC (F-100e) against a Postgres with 0175
 * applied. Skipped when TEST_DATABASE_URL is unset. Creates and deletes its
 * own rows (deleting the test users cascades through sellers to the wallets).
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

type LedgerModule = typeof import("./ledger.server");
type PayoutsModule = typeof import("./payouts.server");
type AppDbModule = typeof import("@workspace/db");

describe.skipIf(!TEST_DATABASE_URL)("Tallaby Pay withdrawals (integration)", { timeout: 120_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 8 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const tag = randomUUID().slice(0, 6);
  const created: string[] = [];
  let ledger: LedgerModule;
  let payouts: PayoutsModule;
  let app: AppDbModule;
  let saleCount = 0;
  let adminId: string;

  const LEGAL_NAME = "Omar Test";
  const destination = { method: "instapay", holderName: LEGAL_NAME, address: "omar.test@instapay" } as const;

  async function makeStore(kyc: "verified" | "submitted" | null = "verified") {
    const sellerId = randomUUID();
    const sub = `tpw-${tag}-${created.length}`;
    await createAuthUsers(sellerId);
    await db.insert(s.users).values({ id: sellerId, isGuest: false, role: "seller" });
    created.push(sellerId);
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address,
        support_email, status)
      VALUES (${sellerId}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb,
        ${`${sub}@example.com`}, 'approved')
    `);
    if (kyc) {
      await db.execute(sql`
        INSERT INTO tallaby_pay_kyc (seller_id, legal_name, id_type, id_number, status, verified_at)
        VALUES (${sellerId}, ${LEGAL_NAME}, 'national_id', '29001011234567', ${kyc},
          ${kyc === "verified" ? sql`now()` : sql`NULL`})
      `);
    }
    const [store] = await db.select({ id: s.stores.id }).from(s.stores).where(eq(s.stores.sellerId, sellerId));
    return { sellerId, storeId: store!.id };
  }

  type Store = Awaited<ReturnType<typeof makeStore>>;

  /** A paid and released sale: its net becomes available. */
  async function earn(store: Store, grossPiastres: number) {
    const walletId = await ledger.ensureTallabyPayWallet(app.db, store.storeId, store.sellerId);
    const { feePiastres, netPiastres } = splitTallabyPay(grossPiastres, 300);
    const [row] = await db.execute<{ id: string }>(sql`
      INSERT INTO tallaby_pay_sales (wallet_id, store_id, seller_id, easykash_ref, gross, fee, net, fee_bps, hold_days, paid_at)
      VALUES (${walletId}, ${store.storeId}, ${store.sellerId}, ${`tpw-it-${tag}-${saleCount++}`},
        ${piastresToAmount(grossPiastres)}::numeric, ${piastresToAmount(feePiastres)}::numeric,
        ${piastresToAmount(netPiastres)}::numeric, 300, 0, now())
      RETURNING id
    `);
    const saleId = row!.id;
    const base = { storeId: store.storeId, sellerId: store.sellerId, saleId, referenceType: "sale", referenceId: saleId };
    await app.db.transaction(async (tx) => {
      await ledger.postTallabyPayEntry(tx, { ...base, kind: "sale", pendingPiastres: netPiastres });
      await ledger.postTallabyPayEntry(tx, { ...base, kind: "release", pendingPiastres: -netPiastres, availablePiastres: netPiastres });
    });
    return { saleId, net: netPiastres };
  }

  const request = (store: Store, input: unknown) =>
    payouts.requestTallabyPayPayout({ sellerId: store.sellerId, storeId: store.storeId, input });

  async function balances(store: Store) {
    const t = await ledger.getTallabyPayLedgerTotals(app.db, store.storeId);
    expect(t!.ledgerPending).toBe(t!.pending);
    expect(t!.ledgerAvailable).toBe(t!.available);
    expect(t!.ledgerReserved).toBe(t!.reserved);
    return t!;
  }

  const payoutStatus = async (id: string) => {
    const [row] = await db.execute<{ status: string }>(sql`SELECT status FROM tallaby_pay_payouts WHERE id = ${id}`);
    return row?.status;
  };

  const auditCount = async (action: string, sellerId: string) => {
    const [row] = await db.execute<{ n: number }>(
      sql`SELECT count(*)::int AS n FROM admin_audit_log WHERE action = ${action} AND seller_id = ${sellerId}`,
    );
    return row!.n;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    ledger = await import("./ledger.server");
    payouts = await import("./payouts.server");
    app = await import("@workspace/db");
    adminId = randomUUID();
    await createAuthUsers(adminId);
    await db.insert(s.users).values({ id: adminId, isGuest: false, role: "admin", isVerified: true });
    created.push(adminId);
  }, 120_000);

  afterAll(async () => {
    if (created.length) {
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, created));
      await db.delete(s.users).where(inArray(s.users.id, created));
    }
    await client.end();
  }, 120_000);

  it("reserves the whole withdrawable amount by default", async () => {
    const store = await makeStore();
    await earn(store, 100_000); // net 970.00
    const result = await request(store, { destination });
    expect(result).toMatchObject({ success: true, data: { amount: "970.00" } });
    expect(await balances(store)).toMatchObject({ available: "970.00", reserved: "970.00" });
    const summary = await payouts.getTallabyPayWalletSummary(store.sellerId, store.storeId);
    expect(summary).toMatchObject({ withdrawable: "0.00", withdrawBlock: "open_request", minPayout: "500.00" });
    expect(summary!.openPayout).toMatchObject({ amount: "970.00", destination: "om•••@instapay" });
  });

  it("two simultaneous requests: one wins, the other is refused", async () => {
    const store = await makeStore();
    await earn(store, 200_000);
    const results = await Promise.all([
      request(store, { amount: "600", destination }),
      request(store, { amount: "600", destination }),
    ]);
    expect(results.filter((r) => r.success)).toHaveLength(1);
    expect(results.find((r) => !r.success)).toMatchObject({ success: false, error: "open_request" });
    expect(await balances(store)).toMatchObject({ reserved: "600.00" });
  });

  it("refuses more than withdrawable, below the minimum, missing KYC and a name mismatch", async () => {
    const store = await makeStore();
    await earn(store, 60_000); // net 582.00
    expect(await request(store, { amount: "582.01", destination })).toMatchObject({ error: "above_withdrawable" });
    expect(await request(store, { amount: "499.99", destination })).toMatchObject({ error: "below_minimum" });
    expect(await request(store, { destination: { ...destination, holderName: "Someone Else" } })).toMatchObject({
      error: "name_mismatch",
    });

    const noKyc = await makeStore(null);
    await earn(noKyc, 100_000);
    expect(await request(noKyc, { destination })).toMatchObject({ error: "kyc_required" });
    const pendingKyc = await makeStore("submitted");
    await earn(pendingKyc, 100_000);
    expect(await request(pendingKyc, { destination })).toMatchObject({ error: "kyc_pending" });

    const empty = await makeStore();
    expect(await request(empty, { destination })).toMatchObject({ error: "no_balance" });
    expect(await balances(store)).toMatchObject({ reserved: "0.00" });
  });

  it("refuses a frozen wallet", async () => {
    const store = await makeStore();
    await earn(store, 100_000);
    await db.execute(sql`
      UPDATE tallaby_pay_wallets SET status = 'frozen', frozen_reason = 'test', frozen_at = now() WHERE store_id = ${store.storeId}
    `);
    expect(await request(store, { destination })).toMatchObject({ error: "frozen" });
  });

  it("store A's seller can't withdraw from, cancel or read store B", async () => {
    const a = await makeStore();
    const b = await makeStore();
    await earn(b, 100_000);
    const opened = await request(b, { destination });
    if (!opened.success) throw new Error("setup");
    expect(await payouts.requestTallabyPayPayout({ sellerId: a.sellerId, storeId: b.storeId, input: { destination } })).toMatchObject({
      error: "not_found",
    });
    expect(
      await payouts.cancelTallabyPayPayout({ sellerId: a.sellerId, storeId: b.storeId, payoutId: opened.data.payoutId }),
    ).toMatchObject({ error: "not_found" });
    // Their own store id with B's payout id: still nothing.
    expect(
      await payouts.cancelTallabyPayPayout({ sellerId: a.sellerId, storeId: a.storeId, payoutId: opened.data.payoutId }),
    ).toMatchObject({ error: "not_found" });
    expect(await payouts.getTallabyPayWalletSummary(a.sellerId, b.storeId)).toBeNull();
    expect((await payouts.listTallabyPayPayouts({ sellerId: a.sellerId, storeId: b.storeId })).rows).toHaveLength(0);
    expect(await payoutStatus(opened.data.payoutId)).toBe("requested");
  });

  it("cancel releases the reservation once", async () => {
    const store = await makeStore();
    await earn(store, 100_000);
    const opened = await request(store, { destination });
    if (!opened.success) throw new Error("setup");
    const args = { sellerId: store.sellerId, storeId: store.storeId, payoutId: opened.data.payoutId };
    expect(await payouts.cancelTallabyPayPayout(args)).toMatchObject({ success: true });
    expect(await payouts.cancelTallabyPayPayout(args)).toMatchObject({ error: "already_handled" });
    expect(await balances(store)).toMatchObject({ available: "970.00", reserved: "0.00" });
    // A new request is allowed after a cancel.
    expect(await request(store, { amount: "500", destination })).toMatchObject({ success: true });
  });

  it("mark paid twice (even concurrently) pays once, and is audited once", async () => {
    const store = await makeStore();
    await earn(store, 100_000);
    const opened = await request(store, { amount: "700", destination });
    if (!opened.success) throw new Error("setup");
    const args = { payoutId: opened.data.payoutId, adminId, reference: "IP-123" };
    const results = await Promise.all([payouts.markTallabyPayPayoutPaid(args), payouts.markTallabyPayPayoutPaid(args)]);
    expect(results.filter((r) => r.success)).toHaveLength(1);
    expect(results.find((r) => !r.success)).toMatchObject({ error: "already_reviewed" });
    expect(await payouts.markTallabyPayPayoutPaid(args)).toMatchObject({ error: "already_reviewed" });
    expect(await balances(store)).toMatchObject({ available: "270.00", reserved: "0.00" });
    expect(await payoutStatus(opened.data.payoutId)).toBe("paid");
    expect(await auditCount("tallaby_pay_payout_paid", store.sellerId)).toBe(1);
    const summary = await payouts.getTallabyPayWalletSummary(store.sellerId, store.storeId);
    expect(summary).toMatchObject({ withdrawn: "700.00", openPayout: null });
  });

  it("mark paid is refused when a refund took available below the amount; reject still works", async () => {
    const store = await makeStore();
    const sale = await earn(store, 100_000);
    const opened = await request(store, { destination });
    if (!opened.success) throw new Error("setup");
    await app.db.transaction((tx) =>
      ledger.postTallabyPayEntry(tx, {
        storeId: store.storeId,
        sellerId: store.sellerId,
        kind: "refund",
        availablePiastres: -sale.net,
        saleId: sale.saleId,
        referenceType: "sale",
        referenceId: sale.saleId,
      }),
    );
    expect(await payouts.markTallabyPayPayoutPaid({ payoutId: opened.data.payoutId, adminId, reference: "IP-1" })).toMatchObject({
      error: "insufficient_balance",
    });
    expect(await payoutStatus(opened.data.payoutId)).toBe("requested");
    expect(await payouts.rejectTallabyPayPayout({ payoutId: opened.data.payoutId, adminId, reason: "Refund since" })).toMatchObject({
      success: true,
    });
    expect(await balances(store)).toMatchObject({ available: "0.00", reserved: "0.00" });
  });

  it("reject releases the reservation, needs a reason, and is a no-op twice", async () => {
    const store = await makeStore();
    await earn(store, 100_000);
    const opened = await request(store, { destination });
    if (!opened.success) throw new Error("setup");
    expect(await payouts.rejectTallabyPayPayout({ payoutId: opened.data.payoutId, adminId, reason: " " })).toMatchObject({
      error: "invalid_input",
    });
    const args = { payoutId: opened.data.payoutId, adminId, reason: "Wrong name" };
    expect(await payouts.rejectTallabyPayPayout(args)).toMatchObject({ success: true });
    expect(await payouts.rejectTallabyPayPayout(args)).toMatchObject({ error: "already_reviewed" });
    expect(await balances(store)).toMatchObject({ available: "970.00", reserved: "0.00" });
    expect(await auditCount("tallaby_pay_payout_rejected", store.sellerId)).toBe(1);
  });

  it("reverse restores a paid withdrawal to available, once, with a reason", async () => {
    const store = await makeStore();
    await earn(store, 100_000);
    const opened = await request(store, { destination });
    if (!opened.success) throw new Error("setup");
    const id = opened.data.payoutId;
    // Only a paid withdrawal can be reversed.
    expect(await payouts.reverseTallabyPayPayout({ payoutId: id, adminId, reason: "Bounced" })).toMatchObject({
      error: "already_reviewed",
    });
    await payouts.markTallabyPayPayoutPaid({ payoutId: id, adminId, reference: "IP-9" });
    expect(await balances(store)).toMatchObject({ available: "0.00" });
    expect(await payouts.reverseTallabyPayPayout({ payoutId: id, adminId, reason: "" })).toMatchObject({ error: "invalid_input" });
    expect(await payouts.reverseTallabyPayPayout({ payoutId: id, adminId, reason: "Bounced" })).toMatchObject({ success: true });
    expect(await payouts.reverseTallabyPayPayout({ payoutId: id, adminId, reason: "Bounced" })).toMatchObject({
      error: "already_reviewed",
    });
    expect(await balances(store)).toMatchObject({ available: "970.00", reserved: "0.00" });
    expect(await payoutStatus(id)).toBe("reversed");
    expect((await payouts.getTallabyPayWalletSummary(store.sellerId, store.storeId))!.withdrawn).toBe("0.00");
  });

  it("an admin can't review their own account, and a non-admin is refused", async () => {
    const store = await makeStore();
    await earn(store, 100_000);
    const opened = await request(store, { destination });
    if (!opened.success) throw new Error("setup");
    expect(
      await payouts.markTallabyPayPayoutPaid({ payoutId: opened.data.payoutId, adminId: store.sellerId, reference: "IP-1" }),
    ).toMatchObject({ error: "not_admin" });
    // Promote the seller to admin: still not on their own store.
    await db.update(s.users).set({ role: "admin", isVerified: true }).where(eq(s.users.id, store.sellerId));
    expect(
      await payouts.markTallabyPayPayoutPaid({ payoutId: opened.data.payoutId, adminId: store.sellerId, reference: "IP-1" }),
    ).toMatchObject({ error: "own_account" });
    expect(await payoutStatus(opened.data.payoutId)).toBe("requested");
  });

  it("KYC: submit, verify once, then the seller can't change it; reject lets them resubmit", async () => {
    const store = await makeStore(null);
    const input = { legalName: "Omar Test", idType: "national_id", idNumber: "29001011234567" };
    expect(await payouts.submitTallabyPayKyc({ sellerId: store.sellerId, input: { ...input, idNumber: "1" } })).toMatchObject({
      error: "invalid_input",
    });
    expect(await payouts.submitTallabyPayKyc({ sellerId: store.sellerId, input })).toMatchObject({ success: true });
    expect(await payouts.verifyTallabyPayKyc({ sellerId: store.sellerId, adminId })).toMatchObject({ success: true });
    expect(await payouts.verifyTallabyPayKyc({ sellerId: store.sellerId, adminId })).toMatchObject({ error: "already_reviewed" });
    expect(await payouts.submitTallabyPayKyc({ sellerId: store.sellerId, input })).toMatchObject({ error: "already_verified" });

    expect(await payouts.rejectTallabyPayKyc({ sellerId: store.sellerId, adminId, reason: "ID unreadable" })).toMatchObject({
      success: true,
    });
    const summary = await payouts.getTallabyPayWalletSummary(store.sellerId, store.storeId);
    expect(summary!.kyc).toMatchObject({ status: "rejected", rejectionReason: "ID unreadable" });
    expect(await payouts.submitTallabyPayKyc({ sellerId: store.sellerId, input })).toMatchObject({ success: true });
    expect(await auditCount("tallaby_pay_kyc_verified", store.sellerId)).toBe(1);
    expect(await auditCount("tallaby_pay_kyc_rejected", store.sellerId)).toBe(1);
  });

  it("lists the store's withdrawals newest first, paginated", async () => {
    const store = await makeStore();
    await earn(store, 300_000);
    for (let i = 0; i < 3; i++) {
      const opened = await request(store, { amount: "500", destination });
      if (!opened.success) throw new Error("setup");
      await payouts.cancelTallabyPayPayout({ sellerId: store.sellerId, storeId: store.storeId, payoutId: opened.data.payoutId });
    }
    const page1 = await payouts.listTallabyPayPayouts({ sellerId: store.sellerId, storeId: store.storeId, pageSize: 2 });
    expect(page1).toMatchObject({ total: 3, page: 1, pageSize: 2 });
    expect(page1.rows).toHaveLength(2);
    const page2 = await payouts.listTallabyPayPayouts({ sellerId: store.sellerId, storeId: store.storeId, page: 2, pageSize: 2 });
    expect(page2.rows).toHaveLength(1);
    expect(page1.rows.every((r) => r.status === "cancelled" && !JSON.stringify(r).includes("omar.test@instapay"))).toBe(true);
    expect(await balances(store)).toMatchObject({ reserved: "0.00" });
  });
});
