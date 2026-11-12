import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAuthUsers } from "../../../db/src/testing/auth-users";
import * as DB_SCHEMA from "@workspace/db/schema";

/**
 * Affiliate program (F-37) against a Postgres with 0117 and 0168 applied.
 * Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

type ServerModule = typeof import("./referrals.server");
type TopUpModule = typeof import("../store-wallet/top-up.server");
type EnsureModule = typeof import("../sellers/ensure-seller-account");
type AppDbModule = typeof import("@workspace/db");

describe.skipIf(!TEST_DATABASE_URL)("affiliate program (integration)", { timeout: 120_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const tag = randomUUID().slice(0, 6);
  const created: string[] = [];
  let ref: ServerModule;
  let topUps: TopUpModule;
  let ensure: EnsureModule;
  let app: AppDbModule;

  async function makeSeller(opts: { phone?: string; referrer?: string; status?: "approved" | "suspended" } = {}) {
    const id = randomUUID();
    const sub = `rf-${tag}-${created.length}`;
    await createAuthUsers(id);
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

  /**
   * A top-up already marked succeeded (no wallet entry: the wallet currency of
   * a test database may differ), then the referral hook exactly as both
   * success paths call it. `usd` is what the wallet received; without it the
   * row is an old EGP-credited top-up.
   */
  async function succeeded(sellerId: string, opts: { egp: string; usd?: string }, program?: "percent" | "signup_bonus") {
    const [row] = await db
      .insert(s.sellerWalletTopUps)
      .values({
        sellerId,
        amount: opts.egp,
        provider: "kashier",
        status: "succeeded",
        ...(opts.usd ? { creditAmount: opts.usd, creditCurrency: "USD" } : {}),
      })
      .returning({ id: s.sellerWalletTopUps.id });
    const topUp = {
      id: row!.id,
      sellerId,
      amount: opts.egp,
      credit: opts.usd ? { amount: opts.usd, currency: "USD" as const } : { amount: opts.egp, currency: "EGP" as const },
    };
    const post = () => app.db.transaction((tx) => ref.postReferralCommission(tx, topUp, program));
    return { topUp, post, result: await post() };
  }

  const commissions = (referrerId: string) =>
    db.select().from(s.referralCommissions).where(eq(s.referralCommissions.referrerSellerId, referrerId));

  const destination = { method: "vodafone_cash", holderName: "Omar Ali", phone: "01012345678" };

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    ref = await import("./referrals.server");
    topUps = await import("../store-wallet/top-up.server");
    ensure = await import("../sellers/ensure-seller-account");
    app = await import("@workspace/db");
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

  it("pays EGP 100 once, on the top-up that takes the seller to $5, however often it repeats", async () => {
    const referrer = await makeSeller();
    const referred = await makeSeller({ referrer });
    expect((await succeeded(referred, { egp: "110.00", usd: "2.00" })).result).toEqual({ posted: false });
    const crossing = await succeeded(referred, { egp: "165.00", usd: "3.00" });
    expect(crossing.result).toEqual({ posted: true });
    // Kashier repeats the event, twice at once.
    await Promise.all([crossing.post(), crossing.post()]);
    // A later top-up earns nothing more.
    expect((await succeeded(referred, { egp: "550.00", usd: "10.00" })).result).toEqual({ posted: false });
    const rows = await commissions(referrer);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      kind: "signup_bonus",
      amount: "100.00",
      topUpId: crossing.topUp.id,
      status: "earned",
      referredSellerId: referred,
    });
  });

  it("pays no bonus to a seller already at $5 before (paid by percentage then)", async () => {
    const referrer = await makeSeller();
    const referred = await makeSeller({ referrer });
    await succeeded(referred, { egp: "300.00", usd: "5.00" }, "percent");
    expect((await succeeded(referred, { egp: "300.00", usd: "5.00" })).result).toEqual({ posted: false });
    const rows = await commissions(referrer);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "percent", amount: "75.00" });
  });

  it("keeps the percent path dormant but working, once per top-up", async () => {
    const referrer = await makeSeller();
    const referred = await makeSeller({ referrer });
    const first = await succeeded(referred, { egp: "150.00" }, "percent");
    await Promise.all([first.post(), first.post()]);
    const rows = await commissions(referrer);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "percent", amount: "37.50", topUpAmount: "150.00" });
  });

  it("posts nothing for unreferred sellers or failed top-ups", async () => {
    const referrer = await makeSeller();
    const lone = await makeSeller();
    expect((await succeeded(lone, { egp: "300.00", usd: "5.00" })).result).toEqual({ posted: false });
    const referred = await makeSeller({ referrer });
    const [row] = await db
      .insert(s.sellerWalletTopUps)
      .values({ sellerId: referred, amount: "100.00", provider: "kashier", status: "pending" })
      .returning({ id: s.sellerWalletTopUps.id });
    await topUps.applyStoreTopUpWebhook({ topUpId: row!.id, status: "FAILURE", amount: "100.00", currency: "EGP", transactionId: "f" });
    expect(await commissions(referrer)).toHaveLength(0);
  });

  it("never pays the bonus for an account an admin excluded as fake", async () => {
    const referrer = await makeSeller();
    const referred = await makeSeller({ referrer });
    await db.update(s.sellers).set({ referralExcludedAt: new Date().toISOString() }).where(eq(s.sellers.id, referred));
    expect((await succeeded(referred, { egp: "300.00", usd: "5.00" })).result).toEqual({ posted: false });
    expect(await commissions(referrer)).toHaveLength(0);
  });

  it("attributes only new accounts, never by the referrer's own phone", async () => {
    const referrer = await makeSeller({ phone: "01099990000" });
    const code = await ref.getOrCreateReferralCode(referrer);
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{7}$/);

    const newUser = randomUUID();
    await createAuthUsers(newUser);
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
    await createAuthUsers(samePhone);
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

  it("needs no referral count to withdraw, pays out the whole balance once, and counts who qualified", async () => {
    const referrer = await makeSeller();
    expect(await ref.requestReferralPayout(referrer, destination)).toEqual({ success: false, error: "below_minimum" });

    for (let i = 0; i < 5; i++) {
      const referred = await makeSeller({ referrer });
      await succeeded(referred, { egp: "300.00", usd: "5.00" });
    }
    await makeSeller({ referrer }); // signed up, never topped up
    expect(await ref.getReferralCounts(db, referrer)).toEqual({ referred: 6, qualified: 5 });

    const results = await Promise.all([ref.requestReferralPayout(referrer, destination), ref.requestReferralPayout(referrer, destination)]);
    expect(results.filter((r) => r.success)).toHaveLength(1);
    expect(results.find((r) => r.success)).toEqual({ success: true, amount: "500.00" });
    const open = await db
      .select()
      .from(s.referralPayouts)
      .where(and(eq(s.referralPayouts.referrerSellerId, referrer), eq(s.referralPayouts.status, "requested")));
    expect(open).toHaveLength(1);

    const overview = await ref.getReferralOverview(referrer);
    expect(overview).toMatchObject({ earned: "500.00", available: "0.00", bonus: "100.00", blockReason: "open_request" });
    expect(overview!.counts).toEqual({ referred: 6, qualified: 5 });
    expect(overview!.referrals.filter((r) => r.qualified)).toHaveLength(5);
    expect(overview!.openPayout!.destination).toBe("•••••••5678");
  });

  it("refuses a withdrawal under EGP 500 or from a suspended referrer", async () => {
    const referrer = await makeSeller();
    for (let i = 0; i < 4; i++) await succeeded(await makeSeller({ referrer }), { egp: "300.00", usd: "5.00" }); // EGP 400
    expect(await ref.requestReferralPayout(referrer, destination)).toEqual({ success: false, error: "below_minimum" });
    await succeeded(await makeSeller({ referrer }), { egp: "300.00", usd: "5.00" }); // EGP 500
    await db.update(s.sellers).set({ status: "suspended" }).where(eq(s.sellers.id, referrer));
    expect(await ref.requestReferralPayout(referrer, destination)).toEqual({ success: false, error: "suspended" });
  });
});
