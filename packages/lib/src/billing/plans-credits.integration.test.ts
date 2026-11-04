import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Pro renewal and AI credits against staging (ROADMAP.md F-55d, F-57). Uses its
 * own throwaway seller on a USD wallet; usd_live itself stays off, so only the
 * entry points that don't read the switch run here. Runs only when
 * TEST_DATABASE_URL is set; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

// The real switch stays off; this flag makes only getBillingState answer "live", for the lock tests.
// `fail` makes the state read throw, so getOrderLock fails open.
const billing = vi.hoisted(() => ({ usdLive: false, fail: false }));
vi.mock("./billing.server", async (original) => {
  const actual = await original<typeof import("./billing.server")>();
  return {
    ...actual,
    getBillingState: async () => {
      if (billing.fail) throw new Error("boom");
      return { ...(await actual.getBillingState()), usdLive: billing.usdLive };
    },
  };
});

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

  const made: string[] = [];
  const createSeller = async (id: string) => {
    const { db, sql, sellerWallet } = await load();
    const email = `qa-${id.slice(0, 8)}@example.test`;
    made.push(id);
    // users.id points at auth.users, whose delete cascades everything this test creates (0134).
    await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${email}, 'authenticated', 'authenticated')`);
    await db.execute(sql`INSERT INTO users (id, email, is_guest) VALUES (${id}, ${email}, false) ON CONFLICT DO NOTHING`);
    // Copied from an existing seller, so the fixture keeps up with required columns.
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, business_type, legal_address, support_email, status)
      SELECT ${id}, 'QA credits', 'QA credits', ${`qa-${id.slice(0, 8)}`}, business_type, legal_address, ${email}, 'approved'
      FROM sellers LIMIT 1`);
    await db.insert(sellerWallet).values({ sellerId: id, balance: "0", currency: "USD" }).onConflictDoUpdate({ target: sellerWallet.sellerId, set: { currency: "USD", balance: "0" } });
  };

  beforeAll(() => createSeller(sellerId), 120_000);

  afterAll(async () => {
    const { db, sql } = await load();
    for (const id of made) await db.execute(sql`DELETE FROM auth.users WHERE id = ${id}`);
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

  it("keeps the normal Free allowance before the USD switch, even with no top-up", async () => {
    const { getAiCreditStatus } = await load();
    await setBalance("0");
    billing.usdLive = false;
    expect(await getAiCreditStatus(sellerId)).toMatchObject({ monthlyAllowance: 100, notActivated: false });
  });

  describe("locked and activated in one month", () => {
    // Their own sellers: the renewals above already left this file's seller activated for good.
    const grantsOf = async (id: string, key: string) => {
      const { db, aiCreditLedger, sql } = await load();
      return db
        .select({ delta: aiCreditLedger.monthlyDelta })
        .from(aiCreditLedger)
        .where(sql`${aiCreditLedger.sellerId} = ${id} AND ${aiCreditLedger.kind} = 'monthly_grant' AND ${aiCreditLedger.reference} LIKE ${`${key}%`}`);
    };
    const deltasOf = async (id: string, key: string) => (await grantsOf(id, key)).map((g) => g.delta).sort((a, b) => a - b);
    const claim = async (id: string, times: number) => {
      const { claimAiCredit } = await load();
      for (let i = 0; i < times; i++) expect((await claimAiCredit(id, "qa")).ok).toBe(true);
    };
    const adjust = async (id: string, amount: string) => {
      const { db } = await load();
      const { postStoreWalletEntry, STORE_WALLET_REFERENCE_TYPES } = await import("@workspace/db/wallet");
      await db.transaction((tx) =>
        postStoreWalletEntry(tx, { sellerId: id, type: "adjustment", amount, referenceType: STORE_WALLET_REFERENCE_TYPES.admin, referenceId: randomUUID(), description: "QA" }),
      );
    };

    afterEach(() => {
      billing.usdLive = false;
      billing.fail = false;
    });

    it("a gift loads the normal allowance and keeps it after the gift runs out", async () => {
      const { getAiCreditStatus } = await load();
      const { cairoMonthKey } = await import("./billing.lib");
      const month = cairoMonthKey();
      const id = randomUUID();
      await createSeller(id);
      billing.usdLive = true;

      // Locked: 20, under its own key.
      expect(await getAiCreditStatus(id)).toMatchObject({ plan: "free", monthlyAllowance: 20, monthlyRemaining: 20, notActivated: true });
      expect(await deltasOf(id, `free-locked:${month}`)).toEqual([20]);
      await claim(id, 1);

      // A gift activates: the normal allowance loads straight away, and the ledger has the real change.
      await adjust(id, "2.00");
      expect(await getAiCreditStatus(id)).toMatchObject({ monthlyAllowance: 100, monthlyRemaining: 100, notActivated: false });
      expect(await deltasOf(id, `free:${month}`)).toEqual([81]);
      await claim(id, 3);

      // It runs out, even below zero: no move back to locked and nothing else in the ledger.
      await adjust(id, "-2.00");
      await adjust(id, "-0.03");
      expect(await getAiCreditStatus(id)).toMatchObject({ monthlyAllowance: 100, monthlyRemaining: 97, notActivated: false });
      expect(await deltasOf(id, `free-locked:${month}`)).toEqual([20]);
    });

    it("a lock check that fails open and recovers moves the period back and forth without anyone gaining credits", async () => {
      const { getAiCreditStatus, db, sellerAiCredits, eq } = await load();
      const { cairoMonthKey } = await import("./billing.lib");
      const month = cairoMonthKey();
      const id = randomUUID();
      await createSeller(id);
      billing.usdLive = true;

      expect(await getAiCreditStatus(id)).toMatchObject({ monthlyAllowance: 20, monthlyRemaining: 20, notActivated: true });
      await claim(id, 1);

      // The check fails: the seller reads as activated, so the Free allowance loads.
      billing.fail = true;
      expect(await getAiCreditStatus(id)).toMatchObject({ monthlyAllowance: 100, monthlyRemaining: 100, notActivated: false });
      expect(await deltasOf(id, `free:${month}`)).toEqual([81]);
      await claim(id, 3);

      // It works again: capped to 20, not reset, and the repeated key doesn't throw.
      billing.fail = false;
      expect(await getAiCreditStatus(id)).toMatchObject({ monthlyAllowance: 20, monthlyRemaining: 20, notActivated: true });
      expect(await deltasOf(id, `free-locked:${month}`)).toEqual([-77, 20]);
      await claim(id, 2);

      // Fails again: no refill, 100 minus the 5 used since Free first loaded.
      billing.fail = true;
      expect((await getAiCreditStatus(id)).monthlyRemaining).toBe(95);
      expect(await deltasOf(id, `free:${month}`)).toEqual([77, 81]);

      // Under 20 when it recovers: stays as it is, not raised to 20.
      await db.update(sellerAiCredits).set({ monthlyRemaining: 7 }).where(eq(sellerAiCredits.sellerId, id));
      billing.fail = false;
      expect((await getAiCreditStatus(id)).monthlyRemaining).toBe(7);

      // Parallel reads make one move and one ledger entry.
      const before = (await grantsOf(id, `free:${month}`)).length;
      billing.fail = true;
      const parallel = await Promise.all(Array.from({ length: 5 }, () => getAiCreditStatus(id)));
      expect(new Set(parallel.map((status) => status.monthlyRemaining))).toEqual(new Set([95]));
      expect((await grantsOf(id, `free:${month}`)).length).toBe(before + 1);

      // Bought credits weren't touched.
      expect(parallel[0]!.purchasedRemaining).toBe(0);
    });
  });

  it("moves to the Pro allowance on upgrade, without carry-over", async () => {
    const { getAiCreditStatus } = await load();
    await setPro(new Date(Date.now() + 86_400_000).toISOString());
    const status = await getAiCreditStatus(sellerId);
    expect(status).toMatchObject({ plan: "pro", monthlyAllowance: 2000, monthlyRemaining: 2000 });
    expect(status.purchasedRemaining).toBeGreaterThan(0);
  });

});
