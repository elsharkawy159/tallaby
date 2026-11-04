import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * The activation rule against the staging database (ROADMAP.md F-68). The USD
 * switch stays off on staging, so `getBillingState` is stubbed to live for this
 * file only. Runs only when TEST_DATABASE_URL is set; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

const live = vi.hoisted(() => ({ usdLive: true, fail: false }));
vi.mock("./billing.server", () => ({
  getBillingState: async () => {
    if (live.fail) throw new Error("boom");
    return { usdLive: live.usdLive };
  },
}));

describe.skipIf(!TEST_DATABASE_URL)("order lock (integration)", { timeout: 90_000 }, () => {
  const sellerId = randomUUID();
  const sub = `lock-${sellerId.slice(0, 8)}`;

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("./order-lock.server")),
  });

  beforeAll(async () => {
    const { db, sql } = await load();
    await db.execute(sql`INSERT INTO auth.users (id) VALUES (${sellerId})`);
    await db.execute(sql`UPDATE users SET is_guest = false, role = 'seller' WHERE id = ${sellerId}`);
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, support_phone)
      VALUES (${sellerId}, ${sub}, ${sub}, ${sub}, ${sub}, 'individual', '{"country":"EG"}'::jsonb, 'l@example.com', '01000000000')`);
  }, 90_000);

  afterAll(async () => {
    const { db, sql } = await load();
    await db.execute(sql`DELETE FROM auth.users WHERE id = ${sellerId}`);
  }, 90_000);

  const topUp = async (provider: string, status: string) => {
    const { db, sql } = await load();
    const id = randomUUID();
    await db.execute(sql`
      INSERT INTO seller_wallet_top_ups (id, seller_id, amount, provider, status, provider_reference, created_by)
      VALUES (${id}, ${sellerId}, 250, ${provider}, ${status}, ${id}, ${sellerId})`);
    return id;
  };

  it("locks, shows review while a manual top-up waits, and unlocks on approval", async () => {
    const { getOrderLock, db, sql } = await load();
    expect(await getOrderLock(sellerId)).toEqual({ locked: true, pendingReview: false });

    // A card attempt waiting at the gateway isn't in review.
    const card = await topUp("kashier", "pending");
    expect(await getOrderLock(sellerId)).toEqual({ locked: true, pendingReview: false });
    await db.execute(sql`DELETE FROM seller_wallet_top_ups WHERE id = ${card}`);

    const manual = await topUp("instapay", "pending");
    expect(await getOrderLock(sellerId)).toEqual({ locked: true, pendingReview: true });

    await db.execute(sql`UPDATE seller_wallet_top_ups SET status = 'failed' WHERE id = ${manual}`);
    expect((await getOrderLock(sellerId)).locked).toBe(true);

    await topUp("vodafone_cash", "succeeded");
    expect(await getOrderLock(sellerId)).toEqual({ locked: false, pendingReview: false });
    await db.execute(sql`DELETE FROM seller_wallet_top_ups WHERE seller_id = ${sellerId}`);
  });

  describe("a balance above zero", () => {
    const made: string[] = [];

    afterAll(async () => {
      const { db, sql } = await load();
      for (const id of made) await db.execute(sql`DELETE FROM auth.users WHERE id = ${id}`);
    }, 90_000);

    // A throwaway seller per test: activation can't be undone, so they can't share one.
    const walletSeller = async (currency: "EGP" | "USD") => {
      const { db, sql, sellerWallet } = await load();
      const id = randomUUID();
      const code = `lock-${id.slice(0, 8)}`;
      made.push(id);
      await db.execute(sql`INSERT INTO auth.users (id) VALUES (${id})`);
      await db.execute(sql`UPDATE users SET is_guest = false, role = 'seller' WHERE id = ${id}`);
      await db.execute(sql`
        INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, support_phone)
        VALUES (${id}, ${code}, ${code}, ${code}, ${code}, 'individual', '{"country":"EG"}'::jsonb, 'l3@example.com', '01000000000')`);
      await db.insert(sellerWallet).values({ sellerId: id, balance: "0", currency });
      return id;
    };
    const post = async (id: string, type: "adjustment" | "fee" | "top_up", amount: string) => {
      const { db } = await load();
      const { postStoreWalletEntry } = await import("@workspace/db/wallet");
      await db.transaction((tx) =>
        postStoreWalletEntry(tx, {
          sellerId: id,
          type,
          amount,
          referenceType: type === "top_up" ? "top_up" : "admin",
          referenceId: randomUUID(),
          description: "QA",
        }),
      );
    };
    const locked = async (id: string) => (await (await load()).getOrderLock(id)).locked;

    it("activates for good, even at zero or below", async () => {
      const id = await walletSeller("USD");
      expect(await locked(id)).toBe(true);
      await post(id, "adjustment", "2.00");
      expect(await locked(id)).toBe(false);
      await post(id, "adjustment", "-2.00");
      expect(await locked(id)).toBe(false);
      await post(id, "fee", "-0.03");
      expect(await locked(id)).toBe(false);
    });

    it("doesn't count an EGP history with no USD entry above zero", async () => {
      const { db, sellerWallet, eq } = await load();
      const id = await walletSeller("EGP");
      await post(id, "adjustment", "100.00");
      await post(id, "adjustment", "-100.00");
      expect(await locked(id)).toBe(true);
      await db.update(sellerWallet).set({ currency: "USD" }).where(eq(sellerWallet.sellerId, id));
      expect(await locked(id)).toBe(true);
    });

    it("counts money that was in the wallet at the switch, once it's spent", async () => {
      const { db, walletTransactions } = await load();
      const id = await walletSeller("USD");
      // The row billing_switch_to_usd writes (0136). The balance stays 0, as if spent since.
      await db.insert(walletTransactions).values({
        sellerId: id,
        type: "adjustment",
        amount: "2.00",
        currency: "USD",
        description: "QA",
        referenceType: "usd_conversion",
        referenceId: `${id}:usd`,
        balanceBefore: "0",
        balanceAfter: "2.00",
      });
      expect(await locked(id)).toBe(false);
    });

    it("stays locked for a negative balance that never went above zero", async () => {
      const id = await walletSeller("USD");
      await post(id, "fee", "-0.03");
      expect(await locked(id)).toBe(true);
      // Back to exactly zero isn't above zero.
      await post(id, "adjustment", "0.03");
      expect(await locked(id)).toBe(true);
      await post(id, "fee", "-0.03");
      expect(await locked(id)).toBe(true);

      await post(id, "adjustment", "0.04");
      expect(await locked(id)).toBe(false);
      await post(id, "fee", "-0.03");
      expect(await locked(id)).toBe(false);
    });

    it("leaves a top_up ledger entry activating for good, in EGP too", async () => {
      const id = await walletSeller("EGP");
      await post(id, "top_up", "6.00");
      expect(await locked(id)).toBe(false);
      await post(id, "adjustment", "-11.00");
      expect(await locked(id)).toBe(false);
    });
  });

  it("the email cron holds a locked seller's queue and sends it after activation", async () => {
    const { db, sql, sellerWallet, eq } = await load();
    const { lockedEmailSellers, startDueCampaigns, claimCampaignRecipients } = await import("../email-campaigns/email-campaigns.server");
    const lockedSeller = randomUUID();
    const code = `lock-${lockedSeller.slice(0, 8)}`;
    const storeId = randomUUID();
    const campaignId = randomUUID();
    await db.execute(sql`INSERT INTO auth.users (id) VALUES (${lockedSeller})`);
    try {
      await db.execute(sql`UPDATE users SET is_guest = false, role = 'seller' WHERE id = ${lockedSeller}`);
      await db.execute(sql`
        INSERT INTO sellers (id, business_name, display_name, slug, subdomain, business_type, legal_address, support_email, support_phone)
        VALUES (${lockedSeller}, ${code}, ${code}, ${code}, ${code}, 'individual', '{"country":"EG"}'::jsonb, 'l2@example.com', '01000000000')`);
      await db.execute(sql`
        INSERT INTO stores (id, seller_id, name, subdomain, status) VALUES (${storeId}, ${lockedSeller}, 'QA lock', ${`qa-${code}`}, 'active')`);
      await db.execute(sql`
        INSERT INTO store_email_campaigns (id, store_id, seller_id, locale, subject, body, status, scheduled_at)
        VALUES (${campaignId}, ${storeId}, ${lockedSeller}, 'en', 'QA', 'QA', 'scheduled', now() - interval '1 minute')`);
      await db.execute(sql`
        INSERT INTO store_email_campaign_recipients (campaign_id, store_id, email) VALUES (${campaignId}, ${storeId}, 'qa-lock@example.test')`);

      const status = async () => {
        const rows = await db.execute(sql`SELECT status FROM store_email_campaigns WHERE id = ${campaignId}`);
        return String((Array.isArray(rows) ? rows : (rows as unknown as { rows: { status: string }[] }).rows)[0]!.status);
      };

      // Locked: another seller's due campaigns may start, this one can't.
      const excluded = await lockedEmailSellers();
      expect(excluded).toContain(lockedSeller);
      // Rolled back: startDueCampaigns is global and must not start other sellers' campaigns on a shared database.
      const rollback = new Error("rollback");
      await db
        .transaction(async (tx) => {
          await startDueCampaigns(tx, excluded);
          const rows = await tx.execute(sql`SELECT status FROM store_email_campaigns WHERE id = ${campaignId}`);
          expect(String((Array.isArray(rows) ? rows : (rows as unknown as { rows: { status: string }[] }).rows)[0]!.status)).toBe("scheduled");
          throw rollback;
        })
        .catch((error) => {
          if (error !== rollback) throw error;
        });
      expect(await status()).toBe("scheduled");

      // Even if it was already sending, its recipients aren't claimed.
      await db.execute(sql`UPDATE store_email_campaigns SET status = 'sending' WHERE id = ${campaignId}`);
      expect(await claimCampaignRecipients({ limit: 5, campaignId, excludeSellerIds: excluded })).toEqual([]);

      // A positive balance activates: the seller leaves the list and the recipient can be claimed.
      await db.insert(sellerWallet).values({ sellerId: lockedSeller, balance: "2.00", currency: "USD" }).onConflictDoUpdate({ target: sellerWallet.sellerId, set: { balance: "2.00" } });
      expect(await db.select({ b: sellerWallet.balance }).from(sellerWallet).where(eq(sellerWallet.sellerId, lockedSeller))).toHaveLength(1);
      const after = await lockedEmailSellers();
      expect(after).not.toContain(lockedSeller);
      expect(await claimCampaignRecipients({ limit: 5, campaignId, excludeSellerIds: after })).toHaveLength(1);
    } finally {
      await db.execute(sql`DELETE FROM auth.users WHERE id = ${lockedSeller}`);
    }
  });

  it("never locks before the switch, or when the check fails", async () => {
    const { getOrderLock } = await load();
    const other = randomUUID();
    live.usdLive = false;
    expect((await getOrderLock(other)).locked).toBe(false);
    live.usdLive = true;
    live.fail = true;
    expect((await getOrderLock(other)).locked).toBe(false);
    live.fail = false;
  });
});
