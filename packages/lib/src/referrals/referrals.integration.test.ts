import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";

/**
 * Affiliate program (F-37) against a Postgres with 0117 applied. Skipped when
 * TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

type ServerModule = typeof import("./referrals.server");
type TopUpModule = typeof import("../store-wallet/top-up.server");
type EnsureModule = typeof import("../sellers/ensure-seller-account");

describe.skipIf(!TEST_DATABASE_URL)("affiliate program (integration)", { timeout: 120_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const tag = randomUUID().slice(0, 6);
  const created: string[] = [];
  let ref: ServerModule;
  let topUps: TopUpModule;
  let ensure: EnsureModule;

  async function makeSeller(opts: { phone?: string; referrer?: string; status?: "approved" | "suspended" } = {}) {
    const id = randomUUID();
    const sub = `rf-${tag}-${created.length}`;
    await db.insert(s.users).values({ id, isGuest: false, role: "seller" });
    created.push(id);
    // Plain SQL: names only the columns it sets, so a staging copy without a
    // later, unrelated sellers column still works.
    const phone = opts.phone ?? `010${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address,
        support_email, support_phone, status, referred_by_seller_id)
      VALUES (${id}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb,
        ${`${sub}@example.com`}, ${phone}, ${opts.status ?? "approved"}, ${opts.referrer ?? null})
    `);
    return id;
  }

  async function paidTopUp(sellerId: string, amount: string) {
    const [row] = await db
      .insert(s.sellerWalletTopUps)
      .values({ sellerId, amount, provider: "kashier", status: "pending" })
      .returning({ id: s.sellerWalletTopUps.id });
    const event = { topUpId: row!.id, status: "SUCCESS", amount, currency: "EGP", transactionId: `tx-${row!.id}` };
    return { id: row!.id, event, outcome: await topUps.applyStoreTopUpWebhook(event) };
  }

  const commissions = (referrerId: string) =>
    db.select().from(s.referralCommissions).where(eq(s.referralCommissions.referrerSellerId, referrerId));

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    ref = await import("./referrals.server");
    topUps = await import("../store-wallet/top-up.server");
    ensure = await import("../sellers/ensure-seller-account");
  }, 120_000);

  afterAll(async () => {
    if (created.length) {
      await db.delete(s.referralPayouts).where(inArray(s.referralPayouts.referrerSellerId, created));
      await db.delete(s.referralCommissions).where(inArray(s.referralCommissions.referrerSellerId, created));
      await db.update(s.sellers).set({ referredBySellerId: null }).where(inArray(s.sellers.id, created));
      await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, created));
      await db.delete(s.users).where(inArray(s.users.id, created));
    }
    await client.end();
  }, 120_000);

  it("posts 20 % once per top-up, however often Kashier repeats it", async () => {
    const referrer = await makeSeller();
    const referred = await makeSeller({ referrer });
    const { event } = await paidTopUp(referred, "150.00");
    await Promise.all([topUps.applyStoreTopUpWebhook(event), topUps.applyStoreTopUpWebhook(event)]);
    const rows = await commissions(referrer);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ amount: "30.00", topUpAmount: "150.00", status: "earned", referredSellerId: referred });
  });

  it("posts nothing for unreferred sellers or failed top-ups", async () => {
    const referrer = await makeSeller();
    const lone = await makeSeller();
    await paidTopUp(lone, "100.00");
    const referred = await makeSeller({ referrer });
    const [row] = await db
      .insert(s.sellerWalletTopUps)
      .values({ sellerId: referred, amount: "100.00", provider: "kashier", status: "pending" })
      .returning({ id: s.sellerWalletTopUps.id });
    await topUps.applyStoreTopUpWebhook({ topUpId: row!.id, status: "FAILURE", amount: "100.00", currency: "EGP", transactionId: "f" });
    expect(await commissions(referrer)).toHaveLength(0);
  });

  it("stops earning on an account an admin excluded as fake", async () => {
    const referrer = await makeSeller();
    const referred = await makeSeller({ referrer });
    await paidTopUp(referred, "100.00");
    await db.update(s.sellers).set({ referralExcludedAt: new Date().toISOString() }).where(eq(s.sellers.id, referred));
    await paidTopUp(referred, "100.00");
    const rows = await commissions(referrer);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.amount).toBe("20.00");
  });

  it("attributes only new accounts, never by the referrer's own phone", async () => {
    const referrer = await makeSeller({ phone: "01099990000" });
    const code = await ref.getOrCreateReferralCode(referrer);
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{7}$/);

    const newUser = randomUUID();
    await db.insert(s.users).values({ id: newUser, isGuest: false });
    created.push(newUser);
    const ok = await ensure.ensureSellerAccount({
      userId: newUser, email: null, subdomain: `rf-${tag}-new`, phone: "01011112222", referralCode: code!.toLowerCase(),
    });
    expect(ok.success).toBe(true);
    const [row] = await db.select({ by: s.sellers.referredBySellerId, at: s.sellers.referredAt }).from(s.sellers).where(eq(s.sellers.id, newUser));
    expect(row).toMatchObject({ by: referrer });
    expect(row!.at).not.toBeNull();

    const samePhone = randomUUID();
    await db.insert(s.users).values({ id: samePhone, isGuest: false });
    created.push(samePhone);
    await ensure.ensureSellerAccount({ userId: samePhone, email: null, subdomain: `rf-${tag}-sp`, phone: "+20 109 999 0000", referralCode: code });
    const [sp] = await db.select({ by: s.sellers.referredBySellerId }).from(s.sellers).where(eq(s.sellers.id, samePhone));
    expect(sp!.by).toBeNull();

    // An existing seller "signing up" again with a code keeps no referrer.
    const other = await makeSeller();
    await ensure.ensureSellerAccount({ userId: other, email: null, subdomain: `rf-${tag}-x`, phone: "01011113333", referralCode: code });
    const [ex] = await db.select({ by: s.sellers.referredBySellerId }).from(s.sellers).where(eq(s.sellers.id, other));
    expect(ex!.by).toBeNull();
  });

  it("unlocks at 10 referrals and 10 stores, then pays out the whole balance once", async () => {
    const referrer = await makeSeller();
    expect((await ref.requestReferralPayout(referrer, { method: "vodafone_cash", holderName: "Omar Ali", phone: "01012345678" })))
      .toEqual({ success: false, error: "locked" });

    for (let i = 0; i < 10; i++) {
      const referred = await makeSeller({ referrer });
      await paidTopUp(referred, "300.00");
    }
    // Each referred seller has its primary store (0050 trigger), so stores = 10.
    expect(await ref.getReferralCounts(db, referrer)).toEqual({ successfulReferrals: 10, stores: 10 });
    const [seller] = await db.select({ at: s.sellers.referralUnlockedAt }).from(s.sellers).where(eq(s.sellers.id, referrer));
    expect(seller!.at).not.toBeNull();

    const destination = { method: "vodafone_cash", holderName: "Omar Ali", phone: "01012345678" };
    const results = await Promise.all([ref.requestReferralPayout(referrer, destination), ref.requestReferralPayout(referrer, destination)]);
    expect(results.filter((r) => r.success)).toHaveLength(1);
    expect(results.find((r) => r.success)).toEqual({ success: true, amount: "600.00" });
    const open = await db
      .select()
      .from(s.referralPayouts)
      .where(and(eq(s.referralPayouts.referrerSellerId, referrer), eq(s.referralPayouts.status, "requested")));
    expect(open).toHaveLength(1);

    const overview = await ref.getReferralOverview(referrer);
    expect(overview).toMatchObject({ earned: "600.00", available: "0.00", unlocked: true, blockReason: "open_request" });
    expect(overview!.openPayout!.destination).toBe("•••••••5678");
  });

  it("refuses a withdrawal under EGP 500 or from a suspended referrer", async () => {
    const referrer = await makeSeller();
    await db.update(s.sellers).set({ referralUnlockedAt: new Date().toISOString() }).where(eq(s.sellers.id, referrer));
    const referred = await makeSeller({ referrer });
    await paidTopUp(referred, "2499.95"); // 499.99 commission
    const destination = { method: "vodafone_cash", holderName: "Omar Ali", phone: "01012345678" };
    expect(await ref.requestReferralPayout(referrer, destination)).toEqual({ success: false, error: "below_minimum" });
    await db.update(s.sellers).set({ status: "suspended" }).where(eq(s.sellers.id, referrer));
    expect(await ref.requestReferralPayout(referrer, destination)).toEqual({ success: false, error: "suspended" });
  });
});
