import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import { archiveStore } from "../stores/server";
import {
  connectIdentifierIntegration,
  disconnectStoreIntegration,
  getStorefrontTracking,
  listStoreIntegrations,
} from "./store-integrations.server";

/**
 * Store apps (PLAN.md §9.1, P7-02) and tenant isolation test 6 (§17): a
 * store's tracking ids are visible on that store only. Skipped when
 * TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("store integrations (integration)", { timeout: 30_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  let w: IsolationWorld;

  beforeAll(async () => {
    w = await createIsolationWorld(db);
  }, 60_000);

  afterAll(async () => {
    await w?.cleanup();
    await client.end();
  });

  it("connects a pixel on one store only, with the normalised id", async () => {
    const result = await connectIdentifierIntegration(w.a.sellerId, w.a.sellerId, w.a.a1, "meta_pixel", " 1234 5678 9012 345 ", db);
    expect(result).toMatchObject({ success: true, data: { provider: "meta_pixel", status: "connected", identifier: "123456789012345" } });

    expect(await listStoreIntegrations(w.a.sellerId, w.a.a1, db)).toEqual([
      expect.objectContaining({ provider: "meta_pixel", identifier: "123456789012345" }),
    ]);
    expect(await listStoreIntegrations(w.a.sellerId, w.a.a2, db)).toEqual([]);
  });

  it("6. A2 and B1 storefronts never get A1's ids", async () => {
    await connectIdentifierIntegration(w.a.sellerId, w.a.sellerId, w.a.a1, "google_analytics", "G-AAAAAA1111", db);
    expect(await getStorefrontTracking(w.a.a1, db)).toEqual({
      metaPixelId: "123456789012345",
      ga4MeasurementId: "G-AAAAAA1111",
      gtmContainerId: null,
      // F-30 defaults: Lead is off, everything else on, Purchase at order.
      metaBlockedEvents: ["Lead"],
    });
    const none = { metaPixelId: null, ga4MeasurementId: null, gtmContainerId: null };
    expect(await getStorefrontTracking(w.a.a2, db)).toEqual(none);
    expect(await getStorefrontTracking(w.b.b1, db)).toEqual(none);
    expect(await getStorefrontTracking("not-a-uuid", db)).toEqual(none);
  });

  it("updates in place instead of adding a second row", async () => {
    await connectIdentifierIntegration(w.a.sellerId, w.a.sellerId, w.a.a1, "meta_pixel", "9999999999999999", db);
    const rows = await db
      .select()
      .from(DB_SCHEMA.storeIntegrations)
      .where(eq(DB_SCHEMA.storeIntegrations.storeId, w.a.a1));
    expect(rows.filter((row) => row.provider === "meta_pixel")).toHaveLength(1);
    expect((await getStorefrontTracking(w.a.a1, db)).metaPixelId).toBe("9999999999999999");
  });

  it("B cannot read, connect or disconnect A's apps", async () => {
    expect(await listStoreIntegrations(w.b.sellerId, w.a.a1, db)).toBeNull();
    expect(await connectIdentifierIntegration(w.b.sellerId, w.b.sellerId, w.a.a1, "meta_pixel", "123456789012345", db)).toEqual({
      success: false,
      error: "not_found",
    });
    expect(await disconnectStoreIntegration(w.b.sellerId, w.a.a1, "meta_pixel", db)).toEqual({ success: false, error: "not_found" });
    expect((await getStorefrontTracking(w.a.a1, db)).metaPixelId).toBe("9999999999999999");
  });

  it("refuses bad ids, unknown and unreleased providers", async () => {
    expect(await connectIdentifierIntegration(w.a.sellerId, w.a.sellerId, w.a.a2, "google_tag_manager", "GTM-<x>", db)).toEqual({
      success: false,
      error: "invalid_id",
    });
    expect(await connectIdentifierIntegration(w.a.sellerId, w.a.sellerId, w.a.a2, "custom_code", "x", db)).toEqual({
      success: false,
      error: "unsupported",
    });
    expect(await connectIdentifierIntegration(w.a.sellerId, w.a.sellerId, w.a.a2, "tiktok_pixel", "C4A1B2C3D4E5F6G7H8I9", db)).toEqual({
      success: false,
      error: "not_available",
    });
  });

  it("disconnecting removes the id from the storefront", async () => {
    expect(await disconnectStoreIntegration(w.a.sellerId, w.a.a1, "google_analytics", db)).toEqual({ success: true, data: null });
    expect((await getStorefrontTracking(w.a.a1, db)).ga4MeasurementId).toBeNull();
  });

  it("archived stores are read-only", async () => {
    await connectIdentifierIntegration(w.a.sellerId, w.a.sellerId, w.a.a2, "google_tag_manager", "GTM-ABC1234", db);
    expect(await archiveStore(w.a.sellerId, w.a.a2, db)).toMatchObject({ success: true });
    expect(await connectIdentifierIntegration(w.a.sellerId, w.a.sellerId, w.a.a2, "meta_pixel", "123456789012345", db)).toEqual({
      success: false,
      error: "store_read_only",
    });
    expect(await disconnectStoreIntegration(w.a.sellerId, w.a.a2, "google_tag_manager", db)).toEqual({
      success: false,
      error: "store_read_only",
    });
  });
});
