import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import { listFulfillmentSellerQueue, listFulfillmentQueueSellerIds } from "../fulfillment/queue.server";
import { listCouponsForAdmin, setSellerCouponActiveByAdmin } from "./coupons-admin.server";
import { applyIntegrationAdminAction, listIntegrationsForAdmin } from "./integrations-admin.server";
import { listStoresForAdmin } from "./stores-admin.server";

/**
 * Phase 9B admin views and actions (docs/admin-saas.md) against the staging
 * copy: one fulfillment row per seller, seller coupon switch with audit,
 * integration force-disconnect, store directory scoping. Skipped when
 * TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("admin SaaS views (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const adminId = randomUUID();
  const sellerUserId = randomUUID();
  const couponId = randomUUID();
  const platformCouponId = randomUUID();
  const integrationId = randomUUID();
  let w: IsolationWorld;

  beforeAll(async () => {
    w = await createIsolationWorld(db);
    await db.insert(s.users).values([
      { id: adminId, isGuest: false, role: "admin", isVerified: true, fullName: "QA Admin" },
      { id: sellerUserId, isGuest: false, role: "seller", isVerified: true },
    ]);
    // Seller A asks for all five services; one is already active.
    await db.insert(s.sellerFulfillmentServices).values(
      (["storage", "packaging", "delivery", "customer_service", "returns"] as const).map((serviceType, index) => ({
        sellerId: w.a.sellerId,
        serviceType,
        requestedProvider: "seller" as const,
        activeProvider: "seller" as const,
        status: index === 0 ? ("active" as const) : ("requested" as const),
        requestedAt: new Date(Date.UTC(2026, 9, 1 + index)).toISOString(),
      })),
    );
    const window = { startsAt: "2026-01-01T00:00:00Z", expiresAt: "2027-01-01T00:00:00Z" };
    await db.insert(s.coupons).values([
      { id: couponId, sellerId: w.a.sellerId, code: `SAAS${couponId.slice(0, 6)}`, name: "Seller coupon", discountType: "percentage", discountValue: "10", ...window },
      { id: platformCouponId, sellerId: null, code: `PLAT${platformCouponId.slice(0, 6)}`, name: "Platform", discountType: "percentage", discountValue: "5", ...window },
    ]);
    await db.insert(s.storeIntegrations).values({
      id: integrationId,
      storeId: w.a.a1,
      sellerId: w.a.sellerId,
      provider: "meta_capi",
      status: "error",
      config: { pixelId: "123456", accessHint: "not shown" },
      credentialsEncrypted: "ciphertext",
      lastError: "token expired",
    });
  });

  afterAll(async () => {
    await db.delete(s.coupons).where(inArray(s.coupons.id, [couponId, platformCouponId]));
    await w?.cleanup();
    await db.delete(s.users).where(inArray(s.users.id, [adminId, sellerUserId]));
    await client.end();
  });

  it("lists a seller with five services as one row with open count and oldest request", async () => {
    const { rows } = await listFulfillmentSellerQueue({ state: "open", service: null, review: null, q: "Iso", page: 1 }, db);
    const mine = rows.filter((row) => row.sellerId === w.a.sellerId);
    expect(mine).toHaveLength(1);
    expect(mine[0]!.services).toHaveLength(5);
    expect(mine[0]!.openCount).toBe(4);
    expect(mine[0]!.activeCount).toBe(1);
    expect(new Date(mine[0]!.oldestOpenAt!).toISOString()).toBe(new Date(Date.UTC(2026, 9, 2)).toISOString());
    expect(rows.some((row) => row.sellerId === w.b.sellerId)).toBe(false);

    const storageOpen = await listFulfillmentQueueSellerIds({ state: "open", service: "storage", review: null, q: "Iso" }, db);
    expect(storageOpen).not.toContain(w.a.sellerId); // storage is active, not open
    const returnsOpen = await listFulfillmentQueueSellerIds({ state: "open", service: "returns", review: null, q: "Iso" }, db);
    expect(returnsOpen).toContain(w.a.sellerId);
  });

  it("switches a seller coupon off with an audit row, and refuses platform coupons and non-admins", async () => {
    expect(await setSellerCouponActiveByAdmin(sellerUserId, { couponId, active: false, reason: "abuse" }, db)).toEqual({
      success: false,
      error: "not_admin",
    });
    expect(await setSellerCouponActiveByAdmin(adminId, { couponId: platformCouponId, active: false, reason: "abuse" }, db)).toEqual({
      success: false,
      error: "not_found",
    });
    const result = await setSellerCouponActiveByAdmin(adminId, { couponId, active: false, reason: "abuse report" }, db);
    expect(result).toMatchObject({ success: true, data: { sellerId: w.a.sellerId } });
    expect(await setSellerCouponActiveByAdmin(adminId, { couponId, active: false, reason: "again" }, db)).toEqual({
      success: false,
      error: "no_change",
    });
    const [coupon] = await db.select({ isActive: s.coupons.isActive }).from(s.coupons).where(eq(s.coupons.id, couponId));
    expect(coupon!.isActive).toBe(false);
    const audit = await db
      .select({ action: s.adminAuditLog.action, reason: s.adminAuditLog.reason })
      .from(s.adminAuditLog)
      .where(and(eq(s.adminAuditLog.sellerId, w.a.sellerId), eq(s.adminAuditLog.action, "deactivate_coupon")));
    expect(audit).toEqual([{ action: "deactivate_coupon", reason: "abuse report" }]);

    const { rows } = await listCouponsForAdmin({ scope: "seller", q: null, state: null, sellerId: w.a.sellerId, page: 1 }, db);
    expect(rows.map((row) => row.id)).toEqual([couponId]);
  });

  it("shows public integration ids only and force-disconnect removes the credentials", async () => {
    const { rows } = await listIntegrationsForAdmin({ provider: "meta_capi", status: null, q: null, sellerId: w.a.sellerId, page: 1 }, db);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.publicConfig).toEqual({ pixelId: "123456" });
    expect(rows[0]!.hasCredentials).toBe(true);
    expect(JSON.stringify(rows[0])).not.toContain("ciphertext");

    const result = await applyIntegrationAdminAction(adminId, { action: "disconnect_integration", integrationId, reason: "leaked token" }, db);
    expect(result).toMatchObject({ success: true, data: { sellerId: w.a.sellerId, storeId: w.a.a1 } });
    const [row] = await db
      .select({ status: s.storeIntegrations.status, secret: s.storeIntegrations.credentialsEncrypted })
      .from(s.storeIntegrations)
      .where(eq(s.storeIntegrations.id, integrationId));
    expect(row).toEqual({ status: "disconnected", secret: null });
  });

  it("filters the store directory by seller", async () => {
    const { rows } = await listStoresForAdmin(
      { q: null, status: null, siteStatus: null, hasDomain: null, template: null, sellerId: w.a.sellerId, page: 1 },
      db,
    );
    expect(rows.map((row) => row.id).sort()).toEqual([w.a.a1, w.a.a2].sort());
    expect(rows.every((row) => row.sellerId === w.a.sellerId)).toBe(true);
  });
});
