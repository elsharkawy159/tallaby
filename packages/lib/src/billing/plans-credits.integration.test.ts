import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Pro renewal and AI credits against staging (ROADMAP.md F-55d, F-57). Uses its
 * own throwaway seller on a USD wallet; usd_live itself stays off, so only the
 * entry points that don't read the switch run here. Runs only when
 * TEST_DATABASE_URL is set; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("plans and credits (integration)", { timeout: 120_000 }, () => {
  const sellerId = randomUUID();

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("./plan-billing.server")),
    ...(await import("./ai-credits.server")),
  });

  const setBalance = async (usd: string) => {
    const { db, sellerWallet, eq } = await load();
    await db.update(sellerWallet).set({ balance: usd }).where(eq(sellerWallet.sellerId, sellerId));
  };
  const balance = async () => {
    const { db, sellerWallet, eq } = await load();
    const [row] = await db.select({ b: sellerWallet.balance }).from(sellerWallet).where(eq(sellerWallet.sellerId, sellerId));
    return Number(row!.b);
  };
  const plan = async () => {
    const { db, sellers, eq } = await load();
    const [row] = await db.select().from(sellers).where(eq(sellers.id, sellerId));
    return row!;
  };
  const setPro = async (expires: string, extra: Record<string, unknown> = {}) => {
    const { db, sellers, eq } = await load();
    await db.update(sellers).set({ plan: "pro", planExpiresAt: expires, planGraceUntil: null, planCancelAtPeriodEnd: false, planAdminGranted: false, ...extra }).where(eq(sellers.id, sellerId));
  };

  beforeAll(async () => {
    const { db, sql, sellerWallet } = await load();
    const email = `qa-${sellerId.slice(0, 8)}@example.test`;
    // users.id points at auth.users, whose delete cascades everything this test creates (0134).
    await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${sellerId}, ${email}, 'authenticated', 'authenticated')`);
    await db.execute(sql`INSERT INTO users (id, email, is_guest) VALUES (${sellerId}, ${email}, false) ON CONFLICT DO NOTHING`);
    // Copied from an existing seller, so the fixture keeps up with required columns.
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, business_type, legal_address, support_email, status)
      SELECT ${sellerId}, 'QA credits', 'QA credits', ${`qa-${sellerId.slice(0, 8)}`}, business_type, legal_address, ${email}, 'approved'
      FROM sellers LIMIT 1`);
    await db.insert(sellerWallet).values({ sellerId, balance: "0", currency: "USD" }).onConflictDoUpdate({ target: sellerWallet.sellerId, set: { currency: "USD", balance: "0" } });
  }, 120_000);

  afterAll(async () => {
    const { db, sql } = await load();
    await db.execute(sql`DELETE FROM auth.users WHERE id = ${sellerId}`);
  }, 120_000);

  it("renews from the wallet, once per period", async () => {
    const { renewOnePlan } = await load();
    await setBalance("100.00");
    const end = new Date(Date.now() - 3_600_000).toISOString();
    await setPro(end);
    expect(await renewOnePlan(sellerId)).toBe("renewed");
    expect(await balance()).toBe(71);
    expect(new Date((await plan()).planExpiresAt!).getTime()).toBeGreaterThan(Date.now());
    expect(await renewOnePlan(sellerId)).toBe("skipped");
    expect(await balance()).toBe(71);
  });

  it("gives 3 days' grace, recovers when topped up, and ends after grace", async () => {
    const { renewOnePlan } = await load();
    await setBalance("1.00");
    const end = new Date(Date.now() - 3_600_000).toISOString();
    await setPro(end);
    expect(await renewOnePlan(sellerId)).toBe("grace");
    expect((await plan()).plan).toBe("pro");
    expect((await plan()).planGraceUntil).not.toBeNull();
    expect(await balance()).toBe(1);

    await setBalance("40.00");
    expect(await renewOnePlan(sellerId)).toBe("renewed");
    expect((await plan()).planGraceUntil).toBeNull();
    expect(await balance()).toBe(11);

    await setBalance("1.00");
    await setPro(end, { planGraceUntil: new Date(Date.now() - 1000).toISOString() });
    expect(await renewOnePlan(sellerId)).toBe("ended");
    expect((await plan()).plan).toBe("free");
    expect(await balance()).toBe(1);
  });

  it("ends a cancelled plan and an admin grant without charging", async () => {
    const { renewOnePlan } = await load();
    await setBalance("100.00");
    const end = new Date(Date.now() - 1000).toISOString();
    await setPro(end, { planCancelAtPeriodEnd: true });
    expect(await renewOnePlan(sellerId)).toBe("ended");
    await setPro(end, { planAdminGranted: true });
    expect(await renewOnePlan(sellerId)).toBe("ended");
    expect(await balance()).toBe(100);
  });

  it("loads the monthly allowance, spends it first, and shares it across parallel calls", async () => {
    const { claimAiCredit, getAiCreditStatus, db, sellerAiCredits, eq } = await load();
    const status = await getAiCreditStatus(sellerId);
    expect(status).toMatchObject({ plan: "free", monthlyAllowance: 100, monthlyRemaining: 100, purchasedRemaining: 0 });
    await db.update(sellerAiCredits).set({ monthlyRemaining: 3, purchasedRemaining: 2 }).where(eq(sellerAiCredits.sellerId, sellerId));

    const claims = await Promise.all(Array.from({ length: 8 }, () => claimAiCredit(sellerId, "qa")));
    expect(claims.filter((c) => c.ok)).toHaveLength(5);
    expect(claims.filter((c) => !c.ok)).toHaveLength(3);
    const after = await getAiCreditStatus(sellerId);
    expect(after.total).toBe(0);
  });

  it("gives a credit back once", async () => {
    const { claimAiCredit, refundAiCredit, getAiCreditStatus, db, sellerAiCredits, eq } = await load();
    await db.update(sellerAiCredits).set({ monthlyRemaining: 1, purchasedRemaining: 0 }).where(eq(sellerAiCredits.sellerId, sellerId));
    const claim = await claimAiCredit(sellerId, "qa");
    expect(claim.ok).toBe(true);
    if (!claim.ok) return;
    await refundAiCredit(sellerId, claim.reference);
    await refundAiCredit(sellerId, claim.reference);
    expect((await getAiCreditStatus(sellerId)).monthlyRemaining).toBe(1);
  });

  it("buys packs from the wallet, and refuses to go below zero", async () => {
    const { buyAiCreditPacks, getAiCreditStatus } = await load();
    await setBalance("2.50");
    const start = (await getAiCreditStatus(sellerId)).purchasedRemaining;
    expect(await buyAiCreditPacks(sellerId, sellerId, 2)).toEqual({ success: true, credits: 200 });
    expect(await balance()).toBe(0.5);
    expect((await getAiCreditStatus(sellerId)).purchasedRemaining).toBe(start + 200);
    expect(await buyAiCreditPacks(sellerId, sellerId, 1)).toEqual({ success: false, error: "insufficient_balance" });
    expect(await balance()).toBe(0.5);
    expect(await buyAiCreditPacks(sellerId, sellerId, 0)).toEqual({ success: false, error: "invalid" });
  });

  it("moves to the Pro allowance on upgrade, without carry-over", async () => {
    const { getAiCreditStatus } = await load();
    await setPro(new Date(Date.now() + 86_400_000).toISOString());
    const status = await getAiCreditStatus(sellerId);
    expect(status).toMatchObject({ plan: "pro", monthlyAllowance: 2000, monthlyRemaining: 2000 });
    expect(status.purchasedRemaining).toBeGreaterThan(0);
  });

});
