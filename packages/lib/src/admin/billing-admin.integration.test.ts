import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { getStoreWalletSummary } from "@workspace/db/wallet";
import { getBillingDryRun, updateBillingSettingsByAdmin } from "./billing-admin.server";
import { adjustStoreWalletByAdmin, applySellerOverride } from "./overrides.server";
import { getStoreWalletBreakdownForAdmin, getStoreWalletTotals, listStoreWalletsForAdmin } from "./wallet-view.server";

/**
 * Admin billing against the staging copy (ROADMAP.md F-55f, F-56f). Every write
 * is in a transaction that rolls back; the USD switch is never called: the USD
 * wallet here is one test row. Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("admin billing (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const adminId = randomUUID();
  const sellerId = randomUUID();
  const name = `bil-${sellerId.slice(0, 8)}`;

  class Rollback extends Error {}
  type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
  const rolledBack = (run: (tx: Tx) => Promise<void>) =>
    db
      .transaction(async (tx) => {
        await run(tx);
        throw new Rollback();
      })
      .catch((error) => {
        if (!(error instanceof Rollback)) throw error;
      });

  beforeAll(async () => {
    // users.id points at auth.users, whose delete cascades everything created here (0134).
    for (const id of [adminId, sellerId]) {
      await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${`qa-${id.slice(0, 8)}@example.test`}, 'authenticated', 'authenticated')`);
    }
    // The auth trigger made the users rows.
    await db.update(s.users).set({ isGuest: false, role: "admin", isVerified: true, fullName: "QA Admin" }).where(eq(s.users.id, adminId));
    await db.update(s.users).set({ isGuest: false, role: "seller" }).where(eq(s.users.id, sellerId));
    await db.insert(s.sellers).values({
      id: sellerId,
      businessName: name,
      displayName: name,
      slug: name,
      subdomain: name,
      businessType: "individual",
      legalAddress: { country: "EG" },
      supportEmail: "bil@example.com",
      status: "approved",
      feeTrialEligible: false,
    });
  });

  afterAll(async () => {
    for (const id of [sellerId, adminId]) await db.execute(sql`DELETE FROM auth.users WHERE id = ${id}`);
    await client.end();
  });

  const planOf = async (tx: Tx) =>
    (
      await tx
        .select({
          plan: s.sellers.plan,
          until: s.sellers.planExpiresAt,
          granted: s.sellers.planAdminGranted,
          cancel: s.sellers.planCancelAtPeriodEnd,
          grace: s.sellers.planGraceUntil,
        })
        .from(s.sellers)
        .where(eq(s.sellers.id, sellerId))
    )[0]!;

  it("set_plan grants free Pro, clears grace and cancel, and Free clears it all", async () => {
    await rolledBack(async (tx) => {
      const reason = "Owner approved";
      const future = new Date(Date.now() + 30 * 86_400_000).toISOString();
      const override = (input: Record<string, unknown>) =>
        applySellerOverride(adminId, { action: "set_plan", sellerId, reason, ...input }, tx);

      // A paid plan in grace with a cancel pending becomes a clean grant.
      await tx
        .update(s.sellers)
        .set({ plan: "pro", planExpiresAt: future, planGraceUntil: future, planCancelAtPeriodEnd: true })
        .where(eq(s.sellers.id, sellerId));
      expect(await override({ plan: "pro" })).toMatchObject({
        success: true,
        data: { before: { planAdminGranted: false }, after: { plan: "pro", planExpiresAt: null, planAdminGranted: true } },
      });
      expect(await planOf(tx)).toEqual({ plan: "pro", until: null, granted: true, cancel: false, grace: null });

      // The same grant again changes nothing; a new end date does.
      expect(await override({ plan: "pro" })).toEqual({ success: false, error: "no_change" });
      expect(await override({ plan: "pro", planExpiresAt: future })).toMatchObject({ success: true });
      expect(new Date((await planOf(tx)).until!).toISOString()).toBe(future);

      // A date in the past, or on Free, is refused.
      expect(await override({ plan: "pro", planExpiresAt: "2020-01-01T00:00:00.000Z" })).toEqual({ success: false, error: "invalid_input" });
      expect(await override({ plan: "free", planExpiresAt: future })).toEqual({ success: false, error: "invalid_input" });

      expect(await override({ plan: "free" })).toMatchObject({ success: true });
      expect(await planOf(tx)).toEqual({ plan: "free", until: null, granted: false, cancel: false, grace: null });
      expect(await override({ plan: "free" })).toEqual({ success: false, error: "no_change" });

      const audit = await tx.select().from(s.adminAuditLog).where(eq(s.adminAuditLog.sellerId, sellerId));
      expect(audit.filter((row) => row.action === "set_plan")).toHaveLength(3);
    });
  });

  it("a USD wallet's ledger check ignores its EGP rows, and currencies are not added together", async () => {
    await rolledBack(async (tx) => {
      await tx.insert(s.sellerWallet).values({ sellerId, balance: "0", currency: "USD" });
      // Old EGP history that nets to zero, as the conversion leaves it.
      await tx.insert(s.walletTransactions).values([
        { sellerId, type: "adjustment", amount: "100.00", balanceBefore: "0", balanceAfter: "100.00", currency: "EGP", referenceType: "usd_conversion", referenceId: `${sellerId}:a` },
        { sellerId, type: "adjustment", amount: "-100.00", balanceBefore: "100.00", balanceAfter: "0", currency: "EGP", referenceType: "usd_conversion", referenceId: `${sellerId}:b` },
      ]);

      // A form opened while the wallet was EGP is refused, not posted as dollars.
      const stale = await adjustStoreWalletByAdmin(
        adminId,
        { sellerId, amount: "5", currency: "EGP", reason: "Stale form", idempotencyKey: randomUUID() },
        tx,
      );
      expect(stale).toEqual({ success: false, error: "wallet_currency_changed" });

      const posted = await adjustStoreWalletByAdmin(
        adminId,
        { sellerId, amount: "5", currency: "USD", reason: "Goodwill", idempotencyKey: randomUUID() },
        tx,
      );
      expect(posted).toMatchObject({ success: true, data: { status: "applied" } });

      const summary = await getStoreWalletSummary(tx, sellerId);
      expect(summary).toMatchObject({ currency: "USD" });
      expect(Number(summary!.ledgerTotal)).toBe(5);

      const { rows } = await listStoreWalletsForAdmin({ search: name }, tx);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ currency: "USD", mismatch: false });
      expect(Number(rows[0]!.ledgerTotal)).toBe(5);

      const { byType, byStore } = await getStoreWalletBreakdownForAdmin(sellerId, tx);
      expect(byType.map((row) => [row.type, row.currency, Number(row.total)])).toEqual([
        ["adjustment", "EGP", 0],
        ["adjustment", "USD", 5],
      ]);
      expect(byStore.map((row) => row.currency)).toEqual(["EGP", "USD"]);

      // Staging isn't live: the platform totals still read EGP and the query runs.
      expect((await getStoreWalletTotals(tx)).currency).toBe("EGP");
    });
  });

  it("the settings write is audited, refuses a repeat and non-admins, and the dry run only reads", async () => {
    await rolledBack(async (tx) => {
      const input = { rateOverride: 51.25, taxEnabled: true };
      expect(await updateBillingSettingsByAdmin(sellerId, input, tx)).toEqual({ success: false, error: "not_admin" });
      expect(await updateBillingSettingsByAdmin(adminId, { ...input, rateOverride: 5 }, tx)).toEqual({ success: false, error: "invalid_input" });
      expect(await updateBillingSettingsByAdmin(adminId, input, tx)).toMatchObject({ success: true });
      expect(await updateBillingSettingsByAdmin(adminId, input, tx)).toEqual({ success: false, error: "no_change" });

      const [settings] = await tx.select().from(s.billingSettings);
      expect(settings).toMatchObject({ taxEnabled: true, usdLive: false });
      expect(Number(settings!.rateOverride)).toBe(51.25);

      const audit = await tx.select().from(s.adminAuditLog).where(eq(s.adminAuditLog.actorId, adminId));
      expect(audit.filter((row) => row.action === "update_billing_settings")).toHaveLength(1);
    });

    const dryRun = await getBillingDryRun(50, db);
    expect(dryRun.rate).toBe(50);
    expect(dryRun.wallets).toBeGreaterThanOrEqual(dryRun.positiveWallets + dryRun.negativeWallets);
  });
});
