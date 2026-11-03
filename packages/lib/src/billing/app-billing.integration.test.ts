import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { AppPricing } from "./app-pricing.lib";
import type { AppResolver, BillableApp } from "./app-billing.server";

/**
 * Store app charges against staging (ROADMAP.md F-47). Uses a throwaway seller
 * on a USD wallet and test-only catalog entries; usd_live stays off, so charges
 * run through the entry points below the switch. Runs only when
 * TEST_DATABASE_URL is set; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

const testApp = (key: string, pricing: AppPricing): BillableApp => ({ key, pricing, live: true });
const ONE_TIME = testApp("qa_one_time", { model: "one_time", usdCents: 1500 });
const MONTHLY = testApp("qa_monthly", { model: "monthly", usdCents: 500 });
const PER_ORDER = testApp("qa_per_order", { model: "per_order", usdCents: 25 });
const USAGE = testApp("qa_usage", { model: "usage", usdCents: 2, unit: "action" });
const FREE = testApp("qa_free", { model: "free" });
const resolveTestApp: AppResolver = (key) => [ONE_TIME, MONTHLY, PER_ORDER, USAGE, FREE].find((a) => a.key === key) ?? null;

describe.skipIf(!TEST_DATABASE_URL)("store app billing (integration)", { timeout: 120_000 }, () => {
  const sellerId = randomUUID();
  const otherSellerId = randomUUID();
  let storeId = "";

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("./app-billing.server")),
  });

  const setBalance = async (usd: string) => {
    const { db, sellerWallet, eq } = await load();
    await db.update(sellerWallet).set({ balance: usd, status: "active" }).where(eq(sellerWallet.sellerId, sellerId));
  };
  const balance = async () => {
    const { db, sellerWallet, eq } = await load();
    const [row] = await db.select({ b: sellerWallet.balance }).from(sellerWallet).where(eq(sellerWallet.sellerId, sellerId));
    return Number(row!.b);
  };
  const entries = async () => {
    const { db, walletTransactions, eq, and } = await load();
    return db
      .select()
      .from(walletTransactions)
      .where(and(eq(walletTransactions.sellerId, sellerId), eq(walletTransactions.referenceType, "store_app")));
  };
  const install = async (app: BillableApp, now?: Date) => {
    const { chargeAndInstallApp } = await load();
    return chargeAndInstallApp({ sellerId, storeId, appKey: app.key, actorId: sellerId }, app, now);
  };
  const row = async (appKey: string) => {
    const { db, storeAppInstalls, eq, and } = await load();
    const rows = await db
      .select()
      .from(storeAppInstalls)
      .where(and(eq(storeAppInstalls.storeId, storeId), eq(storeAppInstalls.appKey, appKey)));
    return rows.find((r) => !r.uninstalledAt) ?? null;
  };
  const makeSeller = async (id: string) => {
    const { db, sql, sellerWallet } = await load();
    const email = `qa-${id.slice(0, 8)}@example.test`;
    await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${email}, 'authenticated', 'authenticated')`);
    await db.execute(sql`INSERT INTO users (id, email, is_guest) VALUES (${id}, ${email}, false) ON CONFLICT DO NOTHING`);
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, business_type, legal_address, support_email, status)
      SELECT ${id}, 'QA apps', 'QA apps', ${`qa-${id.slice(0, 8)}`}, business_type, legal_address, ${email}, 'approved'
      FROM sellers LIMIT 1`);
    await db.insert(sellerWallet).values({ sellerId: id, balance: "0", currency: "USD" }).onConflictDoUpdate({ target: sellerWallet.sellerId, set: { currency: "USD", balance: "0" } });
  };

  beforeAll(async () => {
    const { db, sql } = await load();
    await makeSeller(sellerId);
    await makeSeller(otherSellerId);
    storeId = randomUUID();
    await db.execute(sql`
      INSERT INTO stores (id, seller_id, name, subdomain, status)
      VALUES (${storeId}, ${sellerId}, 'QA apps', ${`qa-apps-${storeId.slice(0, 8)}`}, 'active')`);
  }, 120_000);

  afterAll(async () => {
    const { db, sql } = await load();
    // Deleting the auth users cascades every row this test made (0134).
    await db.execute(sql`DELETE FROM auth.users WHERE id IN (${sellerId}, ${otherSellerId})`);
  }, 120_000);

  beforeEach(async () => {
    const { db, storeAppInstalls, eq } = await load();
    await db.delete(storeAppInstalls).where(eq(storeAppInstalls.storeId, storeId));
  });

  it("refuses a paid install before the USD switch, and lets a free one through", async () => {
    const { installStoreApp, uninstallStoreApp } = await load();
    await setBalance("100.00");
    const before = await balance();
    const target = { sellerId, storeId, actorId: sellerId };
    expect(await installStoreApp({ ...target, appKey: MONTHLY.key }, resolveTestApp)).toEqual({ success: false, error: "not_live" });
    expect(await row(MONTHLY.key)).toBeNull();
    expect(await balance()).toBe(before);

    expect(await installStoreApp({ ...target, appKey: FREE.key }, resolveTestApp)).toEqual({ success: true });
    expect(await balance()).toBe(before);
    expect(await uninstallStoreApp({ sellerId, storeId, appKey: FREE.key })).toEqual({ success: true, endsAt: null });
    expect(await installStoreApp({ ...target, appKey: "qa_unknown" }, resolveTestApp)).toEqual({ success: false, error: "not_available" });
  });

  it("won't install on another seller's store", async () => {
    const { chargeAndInstallApp } = await load();
    await setBalance("100.00");
    const result = await chargeAndInstallApp({ sellerId: otherSellerId, storeId, appKey: ONE_TIME.key, actorId: otherSellerId }, ONE_TIME);
    expect(result).toEqual({ success: false, error: "not_found" });
    expect(await balance()).toBe(100);
  });

  it("charges a one-time app once, also across parallel clicks and a reinstall", async () => {
    const { uninstallStoreApp } = await load();
    await setBalance("40.00");
    const results = await Promise.all([install(ONE_TIME), install(ONE_TIME), install(ONE_TIME)]);
    expect(results.filter((r) => r.success)).toHaveLength(1);
    expect(results.filter((r) => !r.success && r.error === "already_installed")).toHaveLength(2);
    expect(await balance()).toBe(25);

    expect(await uninstallStoreApp({ sellerId, storeId, appKey: ONE_TIME.key })).toEqual({ success: true, endsAt: null });
    expect(await row(ONE_TIME.key)).toBeNull();
    // Reinstalling is free, even with too little in the wallet to buy it again.
    await setBalance("1.00");
    expect(await install(ONE_TIME)).toEqual({ success: true });
    expect(await balance()).toBe(1);
    const charges = (await entries()).filter((e) => e.referenceId === `${storeId}:${ONE_TIME.key}`);
    expect(charges).toHaveLength(1);
    expect(charges[0]).toMatchObject({ type: "service_charge", currency: "USD", storeId });
  });

  it("refuses a one-time app the wallet can't pay, leaving nothing behind", async () => {
    const { db, storeAppInstalls, eq } = await load();
    await db.delete(storeAppInstalls).where(eq(storeAppInstalls.storeId, storeId));
    // The bought claim from the test above would make this free, so use a fresh key.
    const app = testApp(`qa_one_time_${randomUUID().slice(0, 6)}`, { model: "one_time", usdCents: 1500 });
    await setBalance("14.99");
    expect(await install(app)).toEqual({ success: false, error: "insufficient_balance" });
    expect(await row(app.key)).toBeNull();
    expect(await balance()).toBe(14.99);
  });

  it("refuses an EGP wallet", async () => {
    const { db, sellerWallet, eq } = await load();
    const app = testApp(`qa_one_time_${randomUUID().slice(0, 6)}`, { model: "one_time", usdCents: 100 });
    await setBalance("10.00");
    await db.update(sellerWallet).set({ currency: "EGP" }).where(eq(sellerWallet.sellerId, sellerId));
    expect(await install(app)).toEqual({ success: false, error: "wallet_not_usd" });
    await db.update(sellerWallet).set({ currency: "USD" }).where(eq(sellerWallet.sellerId, sellerId));
    expect(await balance()).toBe(10);
  });

  it("charges a monthly app once per period, and a rerun of the job does nothing", async () => {
    const { renewOneApp } = await load();
    await setBalance("20.00");
    const start = new Date(Date.now() - 32 * 86_400_000);
    expect(await install(MONTHLY, start)).toEqual({ success: true });
    expect(await balance()).toBe(15);
    const installed = await row(MONTHLY.key);
    const firstEnd = new Date(installed!.currentPeriodEnd!);

    const results = await Promise.all([
      renewOneApp(installed!.id, new Date(), resolveTestApp),
      renewOneApp(installed!.id, new Date(), resolveTestApp),
    ]);
    expect(results.sort()).toEqual(["renewed", "skipped"]);
    expect(await balance()).toBe(10);
    expect(new Date((await row(MONTHLY.key))!.currentPeriodStart!).getTime()).toBe(firstEnd.getTime());

    expect(await renewOneApp(installed!.id, new Date(), resolveTestApp)).toBe("skipped");
    expect(await balance()).toBe(10);
  });

  it("doesn't charge a period twice when only the dates were left behind", async () => {
    const { renewOneApp, db, storeAppInstalls, eq } = await load();
    await setBalance("20.00");
    await install(MONTHLY, new Date(Date.now() - 32 * 86_400_000));
    const installed = (await row(MONTHLY.key))!;
    expect(await renewOneApp(installed.id, new Date(), resolveTestApp)).toBe("renewed");
    expect(await balance()).toBe(10);
    await db
      .update(storeAppInstalls)
      .set({ currentPeriodStart: installed.currentPeriodStart, currentPeriodEnd: installed.currentPeriodEnd })
      .where(eq(storeAppInstalls.id, installed.id));
    expect(await renewOneApp(installed.id, new Date(), resolveTestApp)).toBe("renewed");
    expect(await balance()).toBe(10);
  });

  it("gives grace when the wallet is short, recovers on top-up, then removes after grace", async () => {
    const { renewOneApp, db, storeAppInstalls, eq } = await load();
    await setBalance("5.00");
    await install(MONTHLY, new Date(Date.now() - 32 * 86_400_000));
    const id = (await row(MONTHLY.key))!.id;
    expect(await balance()).toBe(0);

    expect(await renewOneApp(id, new Date(), resolveTestApp)).toBe("grace");
    expect((await row(MONTHLY.key))!.graceUntil).not.toBeNull();
    expect(await balance()).toBe(0);

    await setBalance("6.00");
    expect(await renewOneApp(id, new Date(), resolveTestApp)).toBe("renewed");
    expect((await row(MONTHLY.key))!.graceUntil).toBeNull();
    expect(await balance()).toBe(1);

    const past = new Date(Date.now() - 1000).toISOString();
    await db.update(storeAppInstalls).set({ currentPeriodEnd: past, graceUntil: past }).where(eq(storeAppInstalls.id, id));
    expect(await renewOneApp(id, new Date(), resolveTestApp)).toBe("ended");
    expect(await row(MONTHLY.key)).toBeNull();
    expect(await balance()).toBe(1);
  });

  it("keeps a removed monthly app until the period ends, and reinstalling undoes it for free", async () => {
    const { uninstallStoreApp, renewOneApp, db, storeAppInstalls, eq } = await load();
    await setBalance("20.00");
    await install(MONTHLY);
    expect(await balance()).toBe(15);

    const removed = await uninstallStoreApp({ sellerId, storeId, appKey: MONTHLY.key });
    expect(removed).toMatchObject({ success: true, endsAt: expect.any(String) });
    const id = (await row(MONTHLY.key))!.id;
    expect((await row(MONTHLY.key))!.cancelAtPeriodEnd).toBe(true);

    expect(await install(MONTHLY)).toEqual({ success: true });
    expect(await balance()).toBe(15);
    expect((await row(MONTHLY.key))!.cancelAtPeriodEnd).toBe(false);
    await uninstallStoreApp({ sellerId, storeId, appKey: MONTHLY.key });

    await db.update(storeAppInstalls).set({ currentPeriodEnd: new Date(Date.now() - 1000).toISOString() }).where(eq(storeAppInstalls.id, id));
    expect(await renewOneApp(id, new Date(), resolveTestApp)).toBe("ended");
    expect(await row(MONTHLY.key)).toBeNull();
    expect(await balance()).toBe(15);
  });

  it("removes a retired app without charging", async () => {
    const { renewOneApp, db, storeAppInstalls, eq } = await load();
    await setBalance("20.00");
    await install(MONTHLY);
    const id = (await row(MONTHLY.key))!.id;
    await db.update(storeAppInstalls).set({ currentPeriodEnd: new Date(Date.now() - 1000).toISOString() }).where(eq(storeAppInstalls.id, id));
    expect(await renewOneApp(id, new Date(), () => null)).toBe("ended");
    expect(await balance()).toBe(15);
  });

  it("bills usage once per event, across a quantity, and refuses past the balance", async () => {
    const { chargeAppUsage } = await load();
    await setBalance("0.10");
    expect(await install(USAGE)).toEqual({ success: true });
    expect(await balance()).toBe(0.1);

    const target = { sellerId, storeId, appKey: USAGE.key };
    const eventId = `evt-${randomUUID()}`;
    expect(await chargeAppUsage({ ...target, eventId, quantity: 3 })).toEqual({ charged: true });
    expect(await balance()).toBe(0.04);
    expect(await chargeAppUsage({ ...target, eventId, quantity: 3 })).toEqual({ charged: false, reason: "duplicate" });
    expect(await balance()).toBe(0.04);
    expect(await chargeAppUsage({ ...target, eventId: `evt-${randomUUID()}`, quantity: 3 })).toEqual({ charged: false, reason: "insufficient_balance" });
    expect(await balance()).toBe(0.04);
    expect(await chargeAppUsage({ ...target, eventId: "bad id", quantity: 1 })).toEqual({ charged: false, reason: "invalid" });
    expect(await chargeAppUsage({ ...target, appKey: MONTHLY.key, eventId: `evt-${randomUUID()}` })).toEqual({ charged: false, reason: "not_installed" });
  });

  it("bills per order once, never fails the order, and goes into grace instead of debt", async () => {
    const { chargeStoreAppsForOrder, renewOneApp, db, sql, storeAppInstalls, eq } = await load();
    await setBalance("0.30");
    expect(await install(PER_ORDER)).toEqual({ success: true });

    const orderId = randomUUID();
    await db.execute(sql`INSERT INTO orders (id, order_number, user_id, status, subtotal, total_amount) VALUES (${orderId}, ${`QA-${orderId}`}, ${sellerId}, 'pending', 0, 0)`);
    const order = { sellerId, storeId, orderId };
    await db.transaction(async (tx) => {
      expect(await chargeStoreAppsForOrder(tx, order)).toEqual({ charged: 1, forgiven: 0 });
      expect(await chargeStoreAppsForOrder(tx, order)).toEqual({ charged: 0, forgiven: 0 });
    });
    expect(await balance()).toBe(0.05);

    const secondOrder = randomUUID();
    await db.execute(sql`INSERT INTO orders (id, order_number, user_id, status, subtotal, total_amount) VALUES (${secondOrder}, ${`QA-${secondOrder}`}, ${sellerId}, 'pending', 0, 0)`);
    await db.transaction(async (tx) => {
      expect(await chargeStoreAppsForOrder(tx, { ...order, orderId: secondOrder })).toEqual({ charged: 0, forgiven: 1 });
      // The refusal left the transaction usable: the order would still commit.
      await tx.execute(sql`SELECT 1`);
    });
    expect(await balance()).toBe(0.05);
    const inGrace = (await row(PER_ORDER.key))!;
    expect(inGrace.graceUntil).not.toBeNull();

    // Grace over with the wallet still short: removed.
    const past = new Date(Date.now() - 1000).toISOString();
    await db.update(storeAppInstalls).set({ graceUntil: past }).where(eq(storeAppInstalls.id, inGrace.id));
    expect(await renewOneApp(inGrace.id, new Date(), resolveTestApp)).toBe("ended");
    expect(await row(PER_ORDER.key)).toBeNull();
    expect(await balance()).toBe(0.05);
  });

  it("ends per-order grace when the wallet has been topped up", async () => {
    const { renewOneApp, db, storeAppInstalls, eq } = await load();
    await setBalance("1.00");
    await install(PER_ORDER);
    const id = (await row(PER_ORDER.key))!.id;
    await db.update(storeAppInstalls).set({ graceUntil: new Date(Date.now() - 1000).toISOString() }).where(eq(storeAppInstalls.id, id));
    expect(await renewOneApp(id, new Date(), resolveTestApp)).toBe("renewed");
    expect((await row(PER_ORDER.key))!.graceUntil).toBeNull();
  });
});
