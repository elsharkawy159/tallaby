import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * The first top-up rule against the staging database (ROADMAP.md F-68). The USD
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

  it("doesn't count a gift or admin adjustment, and does count a top_up ledger entry", async () => {
    const { getOrderLock, db, postStoreWalletEntry } = {
      ...(await load()),
      ...(await import("@workspace/db/wallet")),
    };
    await db.transaction((tx) =>
      postStoreWalletEntry(tx, {
        sellerId,
        type: "adjustment",
        amount: "5.00",
        referenceType: "qa",
        referenceId: randomUUID(),
        description: "QA gift",
      }),
    );
    expect((await getOrderLock(sellerId)).locked).toBe(true);

    await db.transaction((tx) =>
      postStoreWalletEntry(tx, {
        sellerId,
        type: "top_up",
        amount: "5.00",
        referenceType: "top_up",
        referenceId: randomUUID(),
        description: "QA top-up",
      }),
    );
    expect((await getOrderLock(sellerId)).locked).toBe(false);
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
