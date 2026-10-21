import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "./isolation.fixtures";
import {
  deleteStoreShippingZone,
  getStoreShipping,
  saveStoreShippingZone,
  applyStoreShippingTemplate,
  getStorefrontShippingContext,
  updateStoreShippingSettings,
} from "./server";
import { defaultZoneGroups, templateZones } from "../shipping/store-zones";

/** Store shipping settings and zones (P3-08 Part A; seller delivery default 2026-10-21): store-scoped, no overlaps, audited. */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

const zone = (over: Record<string, unknown> = {}) => ({
  nameAr: "القاهرة الكبرى",
  nameEn: "Greater Cairo",
  places: ["EG/CAIRO", "EG/GIZA"],
  price: 45.5,
  freeOver: 1000,
  deliveryDaysMin: 1,
  deliveryDaysMax: 3,
  codEnabled: true,
  enabled: true,
  ...over,
});

describe.skipIf(!TEST_DATABASE_URL)("store shipping (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  let w: IsolationWorld;
  let cairoZone = "";

  beforeAll(async () => {
    w = await createIsolationWorld(db);
  }, 60_000);
  afterAll(async () => {
    await w?.cleanup();
    await client.end();
  });

  it("defaults to seller (own) delivery with no zones", async () => {
    expect(await getStoreShipping(w.a.sellerId, w.a.a1, db)).toEqual({
      settings: { method: "own", handlingDays: 1, freeShippingOver: null, otherPlaces: "tallaby_rates" },
      zones: [],
    });
  });

  it("refuses Tallaby delivery while it is disabled, and saves own delivery with no zones", async () => {
    const tallaby = await updateStoreShippingSettings(w.a.sellerId, w.a.sellerId, w.a.a1, { method: "tallaby", handlingDays: 1, freeShippingOver: null, otherPlaces: "tallaby_rates" }, db);
    expect(tallaby).toEqual({ success: false, error: "tallaby_unavailable" });
    const own = await updateStoreShippingSettings(w.a.sellerId, w.a.sellerId, w.a.a1, { method: "own", handlingDays: 2, freeShippingOver: null, otherPlaces: "tallaby_rates" }, db);
    expect(own).toMatchObject({ success: true, data: { method: "own", handlingDays: 2 } });
  });

  it("creates a zone with exact money and refuses an overlapping one", async () => {
    const res = await saveStoreShippingZone(w.a.sellerId, w.a.sellerId, w.a.a1, null, zone(), db);
    if (!res.success) throw new Error(res.error);
    cairoZone = res.data.id;
    expect(res.data).toMatchObject({ price: 45.5, freeOver: 1000, places: ["EG/CAIRO", "EG/GIZA"] });

    const overlap = await saveStoreShippingZone(w.a.sellerId, w.a.sellerId, w.a.a1, null, zone({ nameAr: "الجيزة", places: ["EG/GIZA"] }), db);
    expect(overlap).toEqual({ success: false, error: "overlap" });
    const disabled = await saveStoreShippingZone(
      w.a.sellerId,
      w.a.sellerId,
      w.a.a1,
      null,
      zone({ nameAr: "الجيزة", places: ["EG/GIZA"], enabled: false }),
      db,
    );
    expect(disabled.success).toBe(true);
  });

  it("the DB trigger also refuses an overlap written around the app", async () => {
    // The trigger is deferred, so it fires at COMMIT of an explicit transaction.
    await expect(
      db.transaction(async (tx) => {
        await tx.insert(DB_SCHEMA.storeShippingZones).values({ storeId: w.a.a1, name: { ar: "x" }, places: ["EG/CAIRO"], price: "10.00" });
      }),
    ).rejects.toThrow();
  });

  it("accepts a nested zone (a city inside an enabled region)", async () => {
    const res = await saveStoreShippingZone(w.a.sellerId, w.a.sellerId, w.a.a1, null, zone({ nameAr: "مدينة نصر", places: ["EG/CAIRO/nasr-city"], price: 30 }), db);
    expect(res.success).toBe(true);
  });

  it("round-trips the otherPlaces setting", async () => {
    const res = await updateStoreShippingSettings(w.a.sellerId, w.a.sellerId, w.a.a1, { method: "own", handlingDays: 2, freeShippingOver: null, otherPlaces: "refuse" }, db);
    expect(res).toMatchObject({ success: true, data: { otherPlaces: "refuse" } });
    expect((await getStoreShipping(w.a.sellerId, w.a.a1, db))?.settings.otherPlaces).toBe("refuse");
  });

  it("lets the last enabled zone be turned off (uncovered governorates use the default rates)", async () => {
    expect(await saveStoreShippingZone(w.a.sellerId, w.a.sellerId, w.a.a1, cairoZone, zone({ enabled: false }), db)).toMatchObject({
      success: true,
    });
    expect(await saveStoreShippingZone(w.a.sellerId, w.a.sellerId, w.a.a1, cairoZone, zone(), db)).toMatchObject({ success: true });

    const audit = await db
      .select({ action: DB_SCHEMA.storeSettingsAudit.action })
      .from(DB_SCHEMA.storeSettingsAudit)
      .where(and(eq(DB_SCHEMA.storeSettingsAudit.storeId, w.a.a1), eq(DB_SCHEMA.storeSettingsAudit.section, "shipping")));
    expect(audit.map((a) => a.action).sort()).toEqual(["settings_updated", "settings_updated", "zone_created", "zone_created", "zone_created", "zone_updated", "zone_updated"]);
  });

  it("applies a template: zones_exist without replace, exactly the template zones with replace", async () => {
    const groups = defaultZoneGroups();
    const names = groups.map((g) => ({ nameAr: `توصيل ${g.price}`, nameEn: `Delivery ${g.price}` }));
    const base = { template: "tallaby_rates", names, replace: false };
    expect(await applyStoreShippingTemplate(w.a.sellerId, w.a.sellerId, w.a.a2, { ...base, names: names.slice(1) }, db)).toEqual({ success: false, error: "invalid_input" });
    const res = await applyStoreShippingTemplate(w.a.sellerId, w.a.sellerId, w.a.a2, base, db);
    if (!res.success) throw new Error(res.error);
    expect(res.data.map((z) => ({ places: z.places, price: z.price }))).toEqual(groups);
    expect(await applyStoreShippingTemplate(w.a.sellerId, w.a.sellerId, w.a.a2, base, db)).toEqual({ success: false, error: "zones_exist" });
    expect(await applyStoreShippingTemplate(w.b.sellerId, w.b.sellerId, w.a.a2, base, db)).toEqual({ success: false, error: "not_found" });

    const flat = await applyStoreShippingTemplate(w.a.sellerId, w.a.sellerId, w.a.a2, { template: "egypt_flat", names: [{ nameAr: "كل مصر" }], price: 60, replace: true }, db);
    if (!flat.success) throw new Error(flat.error);
    expect(flat.data.map((z) => ({ places: z.places, price: z.price }))).toEqual(templateZones("egypt_flat", { price: 60 }));
    expect((await getStoreShipping(w.a.sellerId, w.a.a2, db))?.zones).toHaveLength(1);

    // No valid price means no template zones: invalid input, and the existing zones stay.
    expect(await applyStoreShippingTemplate(w.a.sellerId, w.a.sellerId, w.a.a2, { template: "egypt_flat", names: [], replace: true }, db)).toEqual({ success: false, error: "invalid_input" });
    expect((await getStoreShipping(w.a.sellerId, w.a.a2, db))?.zones).toHaveLength(1);
    const audit = await db
      .select({ action: DB_SCHEMA.storeSettingsAudit.action })
      .from(DB_SCHEMA.storeSettingsAudit)
      .where(and(eq(DB_SCHEMA.storeSettingsAudit.storeId, w.a.a2), eq(DB_SCHEMA.storeSettingsAudit.section, "shipping")));
    expect(audit.map((x) => x.action)).toEqual(["template_applied", "template_applied"]);
    // Clean up so the other tests on a2 start empty.
    await db.delete(DB_SCHEMA.storeShippingZones).where(eq(DB_SCHEMA.storeShippingZones.storeId, w.a.a2));
  });

  it("loads the storefront context by store id: enabled zones only, null for an unknown id", async () => {
    const ctx = await getStorefrontShippingContext(w.a.a1, db);
    expect(ctx).not.toBeNull();
    expect(ctx!.zones.length).toBeGreaterThan(0);
    expect(ctx!.zones.every((z) => z.enabled)).toBe(true);
    expect(ctx!.settings.otherPlaces).toBe("refuse");
    expect(await getStorefrontShippingContext("00000000-0000-4000-8000-000000000000", db)).toBeNull();
    expect(await getStorefrontShippingContext("not-a-uuid", db)).toBeNull();
  });

  it("refuses foreign stores and foreign zones as not_found", async () => {
    expect(await getStoreShipping(w.b.sellerId, w.a.a1, db)).toBeNull();
    expect(await saveStoreShippingZone(w.b.sellerId, w.b.sellerId, w.a.a1, null, zone(), db)).toEqual({ success: false, error: "not_found" });
    // B's own store, but A's zone id.
    expect(await saveStoreShippingZone(w.b.sellerId, w.b.sellerId, w.b.b1, cairoZone, zone(), db)).toEqual({
      success: false,
      error: "not_found",
    });
    expect(await deleteStoreShippingZone(w.b.sellerId, w.b.sellerId, w.b.b1, cairoZone, db)).toEqual({ success: false, error: "not_found" });
  });

  it("rejects invalid zone input", async () => {
    expect(await saveStoreShippingZone(w.a.sellerId, w.a.sellerId, w.a.a2, null, zone({ price: -1 }), db)).toEqual({
      success: false,
      error: "invalid_input",
    });
  });
});
