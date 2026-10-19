import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import { AdminActorError, assertAdminActor } from "./guard.server";
import { adjustStoreWalletByAdmin, applyAdminStoreAction, applySellerOverride } from "./overrides.server";
import {
  getSellerAccountForAdmin,
  listAdminAuditLog,
  listIntegrationErrors,
  listSellerIntegrationsForAdmin,
  listSellerStoresForAdmin,
  listStoreWalletEntriesForAdmin,
} from "./seller-view.server";

/**
 * Audited admin overrides (PLAN.md P9-01, P9-02, P9-03) against the staging
 * copy: the admin guard, one audit row per change, idempotent wallet
 * adjustments through postStoreWalletEntry, store actions scoped to the
 * store's seller, append-only audit, and no secrets in admin reads.
 * Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("admin overrides (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const adminId = randomUUID();
  const unverifiedAdminId = randomUUID();
  const sellerUserId = randomUUID();
  const sellerC = randomUUID();
  let w: IsolationWorld;

  const auditRows = (sellerId: string) =>
    db.select().from(s.adminAuditLog).where(eq(s.adminAuditLog.sellerId, sellerId));
  const balance = async (sellerId: string) =>
    (await db.select({ b: s.sellerWallet.balance }).from(s.sellerWallet).where(eq(s.sellerWallet.sellerId, sellerId)))[0]?.b ?? null;

  beforeAll(async () => {
    w = await createIsolationWorld(db);
    await db.insert(s.users).values([
      { id: adminId, isGuest: false, role: "admin", isVerified: true, fullName: "QA Admin" },
      { id: unverifiedAdminId, isGuest: false, role: "admin", isVerified: false },
      { id: sellerUserId, isGuest: false, role: "seller", isVerified: true },
      { id: sellerC, isGuest: false, role: "seller" },
    ]);
    // Seller C is not eligible, so its first store does not start a trial (0067).
    const sub = `adm-${sellerC.slice(0, 8)}`;
    await db.insert(s.sellers).values({
      id: sellerC,
      businessName: sub,
      displayName: sub,
      slug: sub,
      subdomain: sub,
      businessType: "individual",
      legalAddress: { country: "EG" },
      supportEmail: "adm@example.com",
      status: "approved",
      feeTrialEligible: false,
    });
  });

  afterAll(async () => {
    await w?.cleanup();
    await db.delete(s.sellerSubdomainRedirects).where(eq(s.sellerSubdomainRedirects.sellerId, sellerC));
    await db.delete(s.users).where(inArray(s.users.id, [sellerC, adminId, unverifiedAdminId, sellerUserId]));
    await client.end();
  });

  it("the guard refuses non-admins, unverified admins and unknown ids", async () => {
    await expect(assertAdminActor(db, adminId)).resolves.toMatchObject({ id: adminId, role: "admin" });
    for (const actor of [sellerUserId, unverifiedAdminId, randomUUID(), "not-a-uuid", w.a.sellerId]) {
      await expect(assertAdminActor(db, actor)).rejects.toBeInstanceOf(AdminActorError);
    }

    const input = { action: "set_store_limit", sellerId: w.a.sellerId, reason: "Try it", maxStoresOverride: 9 };
    expect(await applySellerOverride(sellerUserId, input, db)).toEqual({ success: false, error: "not_admin" });
    expect(await applySellerOverride(unverifiedAdminId, input, db)).toEqual({ success: false, error: "not_admin" });
    expect(
      await applyAdminStoreAction(sellerUserId, { action: "suspend_store", sellerId: w.a.sellerId, storeId: w.a.a2, reason: "Try it" }, db),
    ).toEqual({ success: false, error: "not_admin" });
    expect(
      await adjustStoreWalletByAdmin(sellerUserId, { sellerId: w.a.sellerId, amount: "10", reason: "Try it", idempotencyKey: randomUUID() }, db),
    ).toEqual({ success: false, error: "not_admin" });

    const [seller] = await db.select({ o: s.sellers.maxStoresOverride }).from(s.sellers).where(eq(s.sellers.id, w.a.sellerId));
    expect(seller!.o).toBeNull();
    expect(await auditRows(w.a.sellerId)).toHaveLength(0);
    expect(await balance(w.a.sellerId)).toBeNull();
  });

  it("an override changes the seller and writes one audit row; a repeat is no_change", async () => {
    const input = { action: "set_store_limit", sellerId: w.a.sellerId, reason: "Pilot seller, owner approved", maxStoresOverride: 5 };
    const result = await applySellerOverride(adminId, input, db);
    expect(result).toMatchObject({ success: true, data: { before: { maxStoresOverride: null }, after: { maxStoresOverride: 5 } } });

    const account = await getSellerAccountForAdmin(w.a.sellerId, db);
    expect(account).toMatchObject({ maxStoresOverride: 5, maxStores: 5, planMaxStores: 3, storeCount: 2 });

    const rows = await auditRows(w.a.sellerId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actorId: adminId,
      storeId: null,
      action: "set_store_limit",
      before: { maxStoresOverride: null },
      after: { maxStoresOverride: 5 },
      reason: "Pilot seller, owner approved",
    });

    expect(await applySellerOverride(adminId, input, db)).toEqual({ success: false, error: "no_change" });
    expect(await applySellerOverride(adminId, { ...input, reason: "" }, db)).toEqual({ success: false, error: "invalid_input" });
    expect(await applySellerOverride(adminId, { ...input, sellerId: randomUUID() }, db)).toEqual({ success: false, error: "not_found" });
    expect(await auditRows(w.a.sellerId)).toHaveLength(1);
  });

  it("plan and fee plan are the only values that exist (no_change), exemption toggles", async () => {
    const reason = "Checking the only plan";
    expect(await applySellerOverride(adminId, { action: "set_plan", sellerId: w.a.sellerId, reason, plan: "free" }, db)).toEqual({
      success: false,
      error: "no_change",
    });
    expect(
      await applySellerOverride(adminId, { action: "set_fee_plan", sellerId: w.a.sellerId, reason, feePlan: "flat_5" }, db),
    ).toEqual({ success: false, error: "no_change" });
    const exempt = await applySellerOverride(adminId, { action: "set_commission_exempt", sellerId: w.a.sellerId, reason: "Charity store", exempt: true }, db);
    expect(exempt).toMatchObject({ success: true, data: { before: { isCommissionExempt: false }, after: { isCommissionExempt: true } } });
  });

  it("trial: extend only a started trial to a later date; grant/revoke only before it starts", async () => {
    // A has a store, which started its trial (0067).
    const [a] = await db
      .select({ endsAt: s.sellers.feeTrialEndsAt, startedAt: s.sellers.feeTrialStartedAt })
      .from(s.sellers)
      .where(eq(s.sellers.id, w.a.sellerId));
    expect(a!.startedAt).not.toBeNull();
    const reason = "Owner extended the pilot";
    const later = new Date(new Date(a!.endsAt!).getTime() + 10 * 86_400_000).toISOString();
    const earlier = new Date(new Date(a!.endsAt!).getTime() - 86_400_000).toISOString();

    expect(await applySellerOverride(adminId, { action: "extend_trial", sellerId: w.a.sellerId, reason, endsAt: earlier }, db)).toEqual({
      success: false,
      error: "end_not_later",
    });
    const tooFar = new Date(Date.now() + 400 * 86_400_000).toISOString();
    expect(await applySellerOverride(adminId, { action: "extend_trial", sellerId: w.a.sellerId, reason, endsAt: tooFar }, db)).toEqual({
      success: false,
      error: "invalid_input",
    });
    expect(await applySellerOverride(adminId, { action: "extend_trial", sellerId: w.a.sellerId, reason, endsAt: later }, db)).toMatchObject({
      success: true,
    });
    const [after] = await db.select({ endsAt: s.sellers.feeTrialEndsAt }).from(s.sellers).where(eq(s.sellers.id, w.a.sellerId));
    expect(new Date(after!.endsAt!).toISOString()).toBe(later);
    expect(await applySellerOverride(adminId, { action: "revoke_trial", sellerId: w.a.sellerId, reason }, db)).toEqual({
      success: false,
      error: "trial_already_started",
    });

    // C: not started.
    expect(await applySellerOverride(adminId, { action: "extend_trial", sellerId: sellerC, reason, endsAt: later }, db)).toEqual({
      success: false,
      error: "trial_not_started",
    });
    expect(await applySellerOverride(adminId, { action: "revoke_trial", sellerId: sellerC, reason }, db)).toEqual({
      success: false,
      error: "no_change",
    });
    expect(await applySellerOverride(adminId, { action: "grant_trial", sellerId: sellerC, reason }, db)).toMatchObject({
      success: true,
      data: { before: { feeTrialEligible: false }, after: { feeTrialEligible: true } },
    });
    expect((await getSellerAccountForAdmin(sellerC, db))?.trial.state).toBe("not_started");
    expect(await applySellerOverride(adminId, { action: "revoke_trial", sellerId: sellerC, reason }, db)).toMatchObject({ success: true });
    expect((await getSellerAccountForAdmin(sellerC, db))?.trial.state).toBe("none");
    expect((await auditRows(sellerC)).map((r) => r.action).sort()).toEqual(["grant_trial", "revoke_trial"]);
  });

  it("negative limit is set on the wallet row (created lazily) without moving the balance", async () => {
    const result = await applySellerOverride(
      adminId,
      { action: "set_negative_limit", sellerId: sellerC, reason: "Allow ads on credit", negativeLimit: "300" },
      db,
    );
    expect(result).toMatchObject({ success: true, data: { before: { negativeLimit: null }, after: { negativeLimit: "300.00" } } });
    const [wallet] = await db.select().from(s.sellerWallet).where(eq(s.sellerWallet.sellerId, sellerC));
    expect(wallet).toMatchObject({ negativeLimit: "300.00", balance: "0.00" });
    expect(
      await applySellerOverride(adminId, { action: "set_negative_limit", sellerId: sellerC, reason: "Same again", negativeLimit: "300.00" }, db),
    ).toEqual({ success: false, error: "no_change" });
  });

  it("store actions: unpublish, suspend and unsuspend one store, scoped to its seller", async () => {
    const reason = "Reported counterfeit goods";
    const unpublished = await applyAdminStoreAction(adminId, { action: "unpublish_store", sellerId: w.a.sellerId, storeId: w.a.a1, reason }, db);
    expect(unpublished).toMatchObject({ success: true, data: { storeId: w.a.a1, sellerId: w.a.sellerId, subdomain: w.a.a1Sub } });
    const [a1] = await db.select().from(s.stores).where(eq(s.stores.id, w.a.a1));
    expect(a1).toMatchObject({ siteStatus: "unpublished", publishedRevisionId: null, status: "active" });
    expect(await applyAdminStoreAction(adminId, { action: "unpublish_store", sellerId: w.a.sellerId, storeId: w.a.a1, reason }, db)).toEqual({
      success: false,
      error: "not_published",
    });

    expect(await applyAdminStoreAction(adminId, { action: "suspend_store", sellerId: w.a.sellerId, storeId: w.a.a2, reason }, db)).toMatchObject({
      success: true,
    });
    expect((await db.select({ st: s.stores.status }).from(s.stores).where(eq(s.stores.id, w.a.a2)))[0]!.st).toBe("suspended");
    // A1 untouched by A2's suspension.
    expect((await db.select({ st: s.stores.status }).from(s.stores).where(eq(s.stores.id, w.a.a1)))[0]!.st).toBe("active");
    expect(await applyAdminStoreAction(adminId, { action: "suspend_store", sellerId: w.a.sellerId, storeId: w.a.a2, reason }, db)).toEqual({
      success: false,
      error: "no_change",
    });
    expect(await applyAdminStoreAction(adminId, { action: "unsuspend_store", sellerId: w.a.sellerId, storeId: w.a.a2, reason }, db)).toMatchObject({
      success: true,
    });
    expect((await db.select({ st: s.stores.status }).from(s.stores).where(eq(s.stores.id, w.a.a2)))[0]!.st).toBe("active");

    // B's store through A's seller id: not found, B untouched.
    expect(await applyAdminStoreAction(adminId, { action: "suspend_store", sellerId: w.a.sellerId, storeId: w.b.b1, reason }, db)).toEqual({
      success: false,
      error: "not_found",
    });
    expect((await db.select({ st: s.stores.status }).from(s.stores).where(eq(s.stores.id, w.b.b1)))[0]!.st).toBe("active");

    const storeRows = (await auditRows(w.a.sellerId)).filter((r) => r.storeId);
    expect(storeRows.map((r) => r.action).sort()).toEqual(["suspend_store", "unpublish_store", "unsuspend_store"]);
    expect(storeRows.find((r) => r.action === "unpublish_store")).toMatchObject({
      storeId: w.a.a1,
      before: { siteStatus: "published", publishedRevisionId: w.a.a1Revision },
      after: { siteStatus: "unpublished", publishedRevisionId: null },
    });
  });

  it("wallet adjustment posts once per idempotency key, may go negative, and writes one audit row", async () => {
    const key = randomUUID();
    const credit = { sellerId: w.a.sellerId, storeId: w.a.a1, amount: "100", reason: "Goodwill credit", idempotencyKey: key };
    const first = await adjustStoreWalletByAdmin(adminId, credit, db);
    expect(first).toMatchObject({ success: true, data: { status: "applied", balanceBefore: "0.00", balanceAfter: "100.00" } });

    // Double submit / replay with the same key: nothing changes.
    const replays = await Promise.all([1, 2, 3].map(() => adjustStoreWalletByAdmin(adminId, credit, db)));
    for (const replay of replays) expect(replay).toEqual({ success: true, data: { status: "already_applied" } });
    expect(await balance(w.a.sellerId)).toBe("100.00");

    const debit = await adjustStoreWalletByAdmin(
      adminId,
      { sellerId: w.a.sellerId, amount: "-150.00", reason: "Correct a duplicate sale", idempotencyKey: randomUUID() },
      db,
    );
    expect(debit).toMatchObject({ success: true, data: { status: "applied", balanceAfter: "-50.00" } });

    // B's store on A's wallet: refused.
    expect(
      await adjustStoreWalletByAdmin(adminId, { ...credit, storeId: w.b.b1, idempotencyKey: randomUUID() }, db),
    ).toEqual({ success: false, error: "not_found" });

    const entries = await db
      .select()
      .from(s.walletTransactions)
      .where(and(eq(s.walletTransactions.sellerId, w.a.sellerId), eq(s.walletTransactions.type, "adjustment")));
    expect(entries).toHaveLength(2);
    expect(entries.find((e) => e.referenceId === key)).toMatchObject({
      referenceType: "admin",
      storeId: w.a.a1,
      amount: "100.00",
      createdBy: adminId,
      metadata: { source: "admin", reason: "Goodwill credit" },
    });

    const account = await getSellerAccountForAdmin(w.a.sellerId, db);
    expect(account?.wallet).toMatchObject({ balance: "-50.00", ledgerTotal: "-50.00" });
    const [mirror] = await db.select({ b: s.sellers.walletBalance }).from(s.sellers).where(eq(s.sellers.id, w.a.sellerId));
    expect(mirror!.b).toBe("-50.00");

    const walletAudit = (await auditRows(w.a.sellerId)).filter((r) => r.action === "wallet_adjustment");
    expect(walletAudit).toHaveLength(2);
    expect(walletAudit.find((r) => r.storeId === w.a.a1)).toMatchObject({
      before: { balance: "0.00" },
      after: { balance: "100.00", amount: "100.00", reference: `admin:${key}` },
      reason: "Goodwill credit",
    });

    const listed = await listStoreWalletEntriesForAdmin(w.a.sellerId, 10, db);
    expect(listed[0]).toMatchObject({ amount: "-150.00", reason: "Correct a duplicate sale" });
    expect(listed.find((e) => e.referenceId === key)).toMatchObject({ storeName: "Iso " + w.a.a1Sub });
  });

  it("admin_audit_log is append-only and store ids must belong to the seller", async () => {
    const [row] = await auditRows(w.a.sellerId);
    await expect(db.execute(sql`UPDATE admin_audit_log SET reason = 'edited' WHERE id = ${row!.id}`)).rejects.toThrow();
    await expect(db.execute(sql`DELETE FROM admin_audit_log WHERE id = ${row!.id}`)).rejects.toThrow();
    await expect(
      db.insert(s.adminAuditLog).values({ actorId: adminId, sellerId: w.a.sellerId, storeId: w.b.b1, action: "suspend_store", reason: "cross store" }),
    ).rejects.toThrow();
    await expect(
      db.insert(s.adminAuditLog).values({ actorId: adminId, sellerId: w.a.sellerId, action: "set_plan", reason: " " }),
    ).rejects.toThrow();
  });

  it("admin reads: audit trail newest first, stores with revisions, integrations without secrets", async () => {
    const trail = await listAdminAuditLog(w.a.sellerId, 50, db);
    expect(trail.length).toBeGreaterThanOrEqual(5);
    expect(trail[0]!.action).toBe("wallet_adjustment");
    expect(trail.every((r) => r.actorName === "QA Admin")).toBe(true);

    const storesForAdmin = await listSellerStoresForAdmin(w.a.sellerId, db);
    expect(storesForAdmin.map((x) => x.id).sort()).toEqual([w.a.a1, w.a.a2].sort());
    const a1 = storesForAdmin.find((x) => x.id === w.a.a1)!;
    expect(a1).toMatchObject({ isPrimary: true, templateKey: "tallaby-classic", revisionCount: 1, siteStatus: "unpublished" });
    expect(a1.firstPublishedAt).not.toBeNull();
    expect(a1.revisions).toHaveLength(1);
    expect(a1.host).toContain(w.a.a1Sub);
    expect(await listSellerStoresForAdmin(randomUUID(), db)).toEqual([]);

    await db.insert(s.storeIntegrations).values({
      storeId: w.a.a1,
      sellerId: w.a.sellerId,
      provider: "meta_capi",
      status: "error",
      config: { pixelId: "123" },
      credentialsEncrypted: "v1:super-secret-token",
      lastError: "Token expired",
    });
    const integrations = await listSellerIntegrationsForAdmin(w.a.sellerId, db);
    expect(integrations).toHaveLength(1);
    expect(integrations[0]).toMatchObject({ provider: "meta_capi", status: "error", lastError: "Token expired" });
    const errors = (await listIntegrationErrors(500, db)).filter((r) => r.sellerId === w.a.sellerId);
    expect(errors).toHaveLength(1);
    for (const row of [...integrations, ...errors]) {
      expect(JSON.stringify(row)).not.toContain("super-secret-token");
      expect(Object.keys(row)).not.toContain("credentialsEncrypted");
      expect(Object.keys(row)).not.toContain("config");
    }
    expect(await listSellerIntegrationsForAdmin(w.b.sellerId, db)).toHaveLength(0);
  });
});
