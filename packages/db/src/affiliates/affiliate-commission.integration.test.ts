import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "../drizzle/schema";
import * as DB_RELATIONS from "../drizzle/relations";
import { joinAffiliateProgram, getAffiliateAccount } from "./join";
import { resolveAffiliateForCoupon } from "./commission";
import {
  createPendingAffiliateCommission,
  earnAffiliateCommission,
  cancelPendingAffiliateCommission,
  reverseAffiliateCommission,
} from "./commission";
import { getAffiliateOverview } from "./queries";
import { getUserWalletSummary } from "../wallet/user-wallet";

// Mirrors packages/db/src/drizzle/database.ts's schema merge — see
// user-wallet.integration.test.ts for why this is built locally rather than
// importing database.ts (which opens a DATABASE_URL connection on import).
const schema = { ...DB_SCHEMA, ...DB_RELATIONS };

/**
 * Integration tests for the affiliate program's financial core, against a
 * REAL Postgres instance — skipped entirely when TEST_DATABASE_URL is not
 * set. See user-wallet.integration.test.ts for how to point this at a
 * scratch database; this suite additionally needs migration
 * 0029_affiliate_program.sql applied.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("affiliate commissions (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused");
  const db = drizzle(client, { schema });

  const createdUserIds: string[] = [];

  async function makeUser(fullName = "Affiliate Test User") {
    const id = randomUUID();
    await db.insert(schema.users).values({
      id,
      email: `affiliate-test-${id}@example.com`,
      fullName,
      isGuest: false,
    });
    createdUserIds.push(id);
    return id;
  }

  async function makeOrder(userId: string, subtotal: number, shippingCost = 0) {
    const [order] = await db
      .insert(schema.orders)
      .values({
        orderNumber: `TEST-${randomUUID().slice(0, 8).toUpperCase()}`,
        userId,
        subtotal: subtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        totalAmount: (subtotal + shippingCost).toFixed(2),
      })
      .returning({ id: schema.orders.id });
    if (!order) throw new Error("order insert returned no row");
    return order.id;
  }

  async function readWalletBalance(userId: string) {
    const summary = await getUserWalletSummary(db, userId);
    return summary ? Number(summary.balance) : 0;
  }

  async function countCommissionRows(orderId: string) {
    const rows = await db
      .select({ id: schema.affiliateCommissions.id })
      .from(schema.affiliateCommissions)
      .where(eq(schema.affiliateCommissions.orderId, orderId));
    return rows.length;
  }

  beforeAll(async () => {
    const [applied] = await db.execute<{ exists: boolean }>(
      sql`select to_regclass('public.affiliate_commissions') is not null as exists`
    );
    if (!applied?.exists) {
      throw new Error(
        "TEST_DATABASE_URL is missing migration 0029_affiliate_program.sql"
      );
    }
  });

  afterAll(async () => {
    // affiliates / affiliate_commissions / orders / user_wallets all cascade
    // from users, except orders (no ON DELETE on orders.user_id in some
    // paths) — delete explicitly to be safe either way.
    for (const id of createdUserIds) {
      await db.delete(schema.orders).where(eq(schema.orders.userId, id));
      await db.delete(schema.users).where(eq(schema.users.id, id));
    }
    await client.end();
  });

  // -------------------------------------------------------------------------
  // Joining
  // -------------------------------------------------------------------------

  it("creates a unique, permanent, reusable code and prevents duplicate accounts", async () => {
    const userId = await makeUser("Omar Elsharkawy");

    const account = await joinAffiliateProgram(db, { userId, fullName: "Omar Elsharkawy" });
    expect(account.code.startsWith("OMAR10")).toBe(true);
    expect(account.status).toBe("active");

    const coupon = await db.query.coupons.findFirst({
      where: eq(schema.coupons.id, account.couponId),
    });
    expect(coupon?.isOneTimeUse).toBe(false);
    expect(coupon?.discountType).toBe("percentage");
    expect(Number(coupon?.discountValue)).toBe(10);

    // Idempotent: joining again returns the SAME account, not a second one.
    const second = await joinAffiliateProgram(db, { userId, fullName: "Omar Elsharkawy" });
    expect(second.affiliateId).toBe(account.affiliateId);
    expect(second.code).toBe(account.code);

    const affiliateRows = await db
      .select({ id: schema.affiliates.id })
      .from(schema.affiliates)
      .where(eq(schema.affiliates.userId, userId));
    expect(affiliateRows).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // Attribution
  // -------------------------------------------------------------------------

  it("does not attribute commission when the affiliate uses their own code", async () => {
    const affiliateUserId = await makeUser();
    const account = await joinAffiliateProgram(db, { userId: affiliateUserId, fullName: "Self Referrer" });

    const attribution = await resolveAffiliateForCoupon(db, account.couponId, affiliateUserId);
    expect(attribution).toBeNull();
  });

  it("attributes commission when a different customer uses the code", async () => {
    const affiliateUserId = await makeUser();
    const buyerUserId = await makeUser();
    const account = await joinAffiliateProgram(db, { userId: affiliateUserId, fullName: "Referrer" });

    const attribution = await resolveAffiliateForCoupon(db, account.couponId, buyerUserId);
    expect(attribution?.affiliateId).toBe(account.affiliateId);
  });

  // -------------------------------------------------------------------------
  // Earning — the core "when is commission earned" invariant
  // -------------------------------------------------------------------------

  it("excludes shipping: commission is 10% of the eligible amount only", async () => {
    const affiliateUserId = await makeUser();
    const buyerUserId = await makeUser();
    const account = await joinAffiliateProgram(db, { userId: affiliateUserId, fullName: "Referrer" });
    const attribution = { affiliateId: account.affiliateId, affiliateUserId, couponId: account.couponId };

    const orderId = await makeOrder(buyerUserId, 1000, 80);
    await db.transaction((tx) =>
      createPendingAffiliateCommission(tx, {
        affiliate: attribution,
        orderId,
        orderEligibleAmount: "1000.00",
        shippingAmount: "80.00",
      })
    );

    const row = await db.query.affiliateCommissions.findFirst({
      where: and(
        eq(schema.affiliateCommissions.orderId, orderId),
        eq(schema.affiliateCommissions.type, "commission")
      ),
    });

    expect(row?.status).toBe("pending");
    expect(Number(row?.commissionAmount)).toBe(100); // 10% of 1000, not of 1080
  });

  it("is NOT earned at order creation or shipped — only at delivered, and delivers exactly one wallet credit even under duplicate events", async () => {
    const affiliateUserId = await makeUser();
    const buyerUserId = await makeUser();
    const account = await joinAffiliateProgram(db, { userId: affiliateUserId, fullName: "Referrer" });
    const attribution = { affiliateId: account.affiliateId, affiliateUserId, couponId: account.couponId };

    const orderId = await makeOrder(buyerUserId, 500, 50);
    await db.transaction((tx) =>
      createPendingAffiliateCommission(tx, {
        affiliate: attribution,
        orderId,
        orderEligibleAmount: "500.00",
        shippingAmount: "50.00",
      })
    );

    const balanceAtCreation = await readWalletBalance(affiliateUserId);
    expect(balanceAtCreation).toBe(0);

    // Simulates the order moving through shipped/out_for_delivery — nothing
    // in this suite calls earnAffiliateCommission for those, so the pending
    // row (and the wallet) stay untouched. Delivered is the only trigger:
    await db.transaction((tx) => earnAffiliateCommission(tx, orderId));

    expect(await readWalletBalance(affiliateUserId)).toBe(50); // 10% of 500

    // A retried webhook / duplicate delivery event / admin re-save must not
    // double-credit.
    await db.transaction((tx) => earnAffiliateCommission(tx, orderId));
    await db.transaction((tx) => earnAffiliateCommission(tx, orderId));

    expect(await readWalletBalance(affiliateUserId)).toBe(50);
    expect(await countCommissionRows(orderId)).toBe(1);

    const overview = await getAffiliateOverview(db, affiliateUserId);
    expect(overview?.totals.totalProfit).toBe("50.00");
    expect(overview?.totals.pendingProfit).toBe("0.00");
    expect(overview?.totals.deliveredOrders).toBe(1);
  });

  it("cancelled orders never earn commission", async () => {
    const affiliateUserId = await makeUser();
    const buyerUserId = await makeUser();
    const account = await joinAffiliateProgram(db, { userId: affiliateUserId, fullName: "Referrer" });
    const attribution = { affiliateId: account.affiliateId, affiliateUserId, couponId: account.couponId };

    const orderId = await makeOrder(buyerUserId, 200, 20);
    await db.transaction((tx) =>
      createPendingAffiliateCommission(tx, {
        affiliate: attribution,
        orderId,
        orderEligibleAmount: "200.00",
        shippingAmount: "20.00",
      })
    );

    await db.transaction((tx) => cancelPendingAffiliateCommission(tx, orderId));
    // A cancellation racing after a delivery must not undo the earn.
    await db.transaction((tx) => earnAffiliateCommission(tx, orderId));

    expect(await readWalletBalance(affiliateUserId)).toBe(0);

    const row = await db.query.affiliateCommissions.findFirst({
      where: eq(schema.affiliateCommissions.orderId, orderId),
    });
    expect(row?.status).toBe("cancelled");
  });

  // -------------------------------------------------------------------------
  // Reversal
  // -------------------------------------------------------------------------

  it("reverses an earned commission via a NEW ledger row, not a mutation, and is idempotent", async () => {
    const affiliateUserId = await makeUser();
    const buyerUserId = await makeUser();
    const account = await joinAffiliateProgram(db, { userId: affiliateUserId, fullName: "Referrer" });
    const attribution = { affiliateId: account.affiliateId, affiliateUserId, couponId: account.couponId };

    const orderId = await makeOrder(buyerUserId, 1000, 0);
    await db.transaction((tx) =>
      createPendingAffiliateCommission(tx, {
        affiliate: attribution,
        orderId,
        orderEligibleAmount: "1000.00",
        shippingAmount: "0.00",
      })
    );
    await db.transaction((tx) => earnAffiliateCommission(tx, orderId));
    expect(await readWalletBalance(affiliateUserId)).toBe(100);

    await db.transaction((tx) => reverseAffiliateCommission(tx, orderId));
    expect(await readWalletBalance(affiliateUserId)).toBe(0);

    const rows = await db
      .select({ type: schema.affiliateCommissions.type, status: schema.affiliateCommissions.status })
      .from(schema.affiliateCommissions)
      .where(eq(schema.affiliateCommissions.orderId, orderId));
    expect(rows).toHaveLength(2); // original 'commission' row + a new 'reversal' row
    expect(rows.find((r) => r.type === "commission")?.status).toBe("reversed");
    expect(rows.find((r) => r.type === "reversal")?.status).toBe("reversed");

    // Duplicate reversal events (retried webhook, admin re-save) must not
    // double-debit.
    await db.transaction((tx) => reverseAffiliateCommission(tx, orderId));
    expect(await readWalletBalance(affiliateUserId)).toBe(0);
    expect(await countCommissionRows(orderId)).toBe(2);
  });

  it("supports proportional reversal for a partial refund", async () => {
    const affiliateUserId = await makeUser();
    const buyerUserId = await makeUser();
    const account = await joinAffiliateProgram(db, { userId: affiliateUserId, fullName: "Referrer" });
    const attribution = { affiliateId: account.affiliateId, affiliateUserId, couponId: account.couponId };

    const orderId = await makeOrder(buyerUserId, 1000, 0);
    await db.transaction((tx) =>
      createPendingAffiliateCommission(tx, {
        affiliate: attribution,
        orderId,
        orderEligibleAmount: "1000.00",
        shippingAmount: "0.00",
      })
    );
    await db.transaction((tx) => earnAffiliateCommission(tx, orderId));
    expect(await readWalletBalance(affiliateUserId)).toBe(100);

    // Half the order (500 of 1000) was refunded -> half the commission (50) reverses.
    await db.transaction((tx) =>
      reverseAffiliateCommission(tx, orderId, { refundedAmount: "500.00" })
    );
    expect(await readWalletBalance(affiliateUserId)).toBe(50);
  });
});
