import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Buying extra campaign emails (ROADMAP.md F-69) against staging. Each test runs
 * in one transaction that always rolls back, so the USD switch never stays on.
 * Runs only when TEST_DATABASE_URL is set; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

class Rollback extends Error {}

describe.skipIf(!TEST_DATABASE_URL)("email packs (integration)", { timeout: 90_000 }, () => {
  let sellerId = "";

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("./email-campaigns.server")),
  });

  async function inRollback(fn: (tx: any) => Promise<void>) {
    const { db, sql } = await load();
    await db
      .transaction(async (tx) => {
        await tx.execute(sql`SELECT * FROM billing_switch_to_usd(50)`);
        await fn(tx);
        throw new Rollback();
      })
      .catch((error: unknown) => {
        if (!(error instanceof Rollback)) throw error;
      });
  }

  const walletOf = async (tx: any) => {
    const { sellerWallet, eq } = await load();
    const [row] = await tx.select().from(sellerWallet).where(eq(sellerWallet.sellerId, sellerId));
    return Number(row.balance);
  };
  const setBalance = async (tx: any, amount: number) => {
    const { sql } = await load();
    await tx.execute(sql`UPDATE seller_wallet SET balance = ${amount} WHERE seller_id = ${sellerId}`);
    await tx.execute(sql`UPDATE sellers SET wallet_balance = ${amount} WHERE id = ${sellerId}`);
  };
  const boughtOf = async (tx: any) => {
    const { sellerEmailCredits, eq } = await load();
    const [row] = await tx.select().from(sellerEmailCredits).where(eq(sellerEmailCredits.sellerId, sellerId));
    return row?.purchasedRemaining ?? 0;
  };

  beforeAll(async () => {
    const { db, sellerWallet } = await load();
    sellerId = (await db.select({ id: sellerWallet.sellerId }).from(sellerWallet).limit(1))[0]!.id;
  }, 90_000);

  afterAll(async () => {
    const { db, billingSettings } = await load();
    const [row] = await db.select({ live: billingSettings.usdLive }).from(billingSettings);
    expect(row!.live).toBe(false);
  }, 90_000);

  it("charges $1.50 and adds 1,000 emails", async () => {
    const { buyEmailPacks } = await load();
    await inRollback(async (tx) => {
      await setBalance(tx, 10);
      const result = await buyEmailPacks(sellerId, sellerId, 1, tx);
      expect(result).toEqual({ success: true, emails: 1000 });
      expect(await walletOf(tx)).toBeCloseTo(8.5, 2);
      expect(await boughtOf(tx)).toBe(1000);
      await buyEmailPacks(sellerId, sellerId, 1, tx);
      expect(await boughtOf(tx)).toBe(2000);
    });
  });

  it("refuses a short wallet and adds nothing", async () => {
    const { buyEmailPacks } = await load();
    await inRollback(async (tx) => {
      await setBalance(tx, 1);
      const before = await boughtOf(tx);
      const result = await buyEmailPacks(sellerId, sellerId, 1, tx);
      expect(result).toEqual({ success: false, error: "insufficient_balance" });
      expect(await walletOf(tx)).toBe(1);
      expect(await boughtOf(tx)).toBe(before);
    });
  });

  it("refuses a bad pack count", async () => {
    const { buyEmailPacks, db } = await load();
    expect(await buyEmailPacks(sellerId, sellerId, 0, db)).toEqual({ success: false, error: "invalid" });
    expect(await buyEmailPacks(sellerId, sellerId, 1.5, db)).toEqual({ success: false, error: "invalid" });
  });

  it("counts this month's emails for the account", async () => {
    const { countEmailsUsedThisMonth } = await load();
    await inRollback(async (tx) => {
      expect(await countEmailsUsedThisMonth(sellerId, tx)).toBeGreaterThanOrEqual(0);
    });
  });
});
