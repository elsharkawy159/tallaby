import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * The seller's WhatsApp page reads and writes against staging (ROADMAP.md
 * F-109, 0180): tenant isolation. Two throwaway sellers, each with its primary
 * store (the 0050 trigger). Message rows are `reply` rows (no order needed).
 * The admin's global row is only read, never changed. Runs only when
 * TEST_DATABASE_URL is set (and 0180 is applied there); never point it at
 * production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("store WhatsApp (integration)", { timeout: 120_000 }, () => {
  const sellerA = randomUUID();
  const sellerB = randomUUID();
  const world = { storeA: "", storeB: "" };

  const load = async () => ({ ...(await import("@workspace/db")), ...(await import("./store.server")) });

  const makeSeller = async (id: string) => {
    const { db, sql, stores, eq } = await load();
    const email = `qa-wa-${id.slice(0, 8)}@example.test`;
    await db.execute(sql`INSERT INTO auth.users (id, email, aud, role) VALUES (${id}, ${email}, 'authenticated', 'authenticated')`);
    await db.execute(sql`INSERT INTO users (id, email, is_guest) VALUES (${id}, ${email}, false) ON CONFLICT DO NOTHING`);
    await db.execute(sql`
      INSERT INTO sellers (id, business_name, display_name, slug, business_type, legal_address, support_email, status)
      SELECT ${id}, 'QA wa', 'QA wa', ${`qa-wa-${id.slice(0, 8)}`}, business_type, legal_address, ${email}, 'approved'
      FROM sellers LIMIT 1`);
    const [store] = await db.select({ id: stores.id }).from(stores).where(eq(stores.sellerId, id));
    return store!.id;
  };

  beforeAll(async () => {
    const { db, whatsappMessages } = await load();
    world.storeA = await makeSeller(sellerA);
    world.storeB = await makeSeller(sellerB);
    await db.insert(whatsappMessages).values([
      { sellerId: sellerA, storeId: world.storeA, event: "reply", kind: "text", dedupeKey: `reply:qa-${randomUUID()}`, toPhone: "201012345678", status: "read" },
      { sellerId: sellerA, storeId: world.storeA, event: "reply", kind: "text", dedupeKey: `reply:qa-${randomUUID()}`, toPhone: "201012345679", status: "failed" },
      { sellerId: sellerB, storeId: world.storeB, event: "reply", kind: "text", dedupeKey: `reply:qa-${randomUUID()}`, toPhone: "201012345670", status: "sent" },
    ]);
  }, 120_000);

  afterAll(async () => {
    const { db, sql } = await load();
    // Deleting the auth users cascades every row this test made (0134).
    await db.execute(sql`DELETE FROM auth.users WHERE id IN (${sellerA}, ${sellerB})`);
  }, 120_000);

  it("lists and counts only the store's own messages, with masked phones", async () => {
    const { listStoreWhatsAppMessages, getStoreWhatsAppOverview } = await load();
    const page = await listStoreWhatsAppMessages(sellerA, world.storeA, { page: 1 });
    expect(page.total).toBe(2);
    expect(page.rows.every((row) => row.phone.includes("•") && !row.phone.includes("12345678"))).toBe(true);
    expect((await listStoreWhatsAppMessages(sellerA, world.storeA, { status: "failed" })).total).toBe(1);
    // An unknown filter is ignored, not passed to SQL.
    expect((await listStoreWhatsAppMessages(sellerA, world.storeA, { status: "nope'; --" })).total).toBe(2);

    const overview = await getStoreWhatsAppOverview(sellerA, world.storeA);
    expect(overview.stats).toMatchObject({ sent: 1, read: 1, failed: 1, costUsdCents: 0 });
  });

  it("refuses another seller's store on every read and write", async () => {
    const { listStoreWhatsAppMessages, getStoreWhatsAppOverview, updateStoreWhatsAppSettings, setStoreWhatsAppEnabled, isStoreWhatsAppOn } = await load();
    await expect(listStoreWhatsAppMessages(sellerB, world.storeA)).rejects.toThrow();
    await expect(getStoreWhatsAppOverview(sellerB, world.storeA)).rejects.toThrow();
    await expect(updateStoreWhatsAppSettings(sellerB, world.storeA, { enabled: true, events: ["order_placed"] })).rejects.toThrow();
    await expect(setStoreWhatsAppEnabled(sellerB, world.storeA, false)).rejects.toThrow();
    await expect(isStoreWhatsAppOn(sellerB, world.storeA)).rejects.toThrow();
  });

  it("validates events and saves only under the store's own seller", async () => {
    const { db, eq, storeWhatsappSettings, updateStoreWhatsAppSettings, setStoreWhatsAppEnabled, getWhatsAppGlobalSettings } = await load();
    expect(await updateStoreWhatsAppSettings(sellerA, world.storeA, { enabled: true, events: ["order_placed", "promo"] })).toEqual({ success: false, error: "invalid" });

    const global = await getWhatsAppGlobalSettings();
    const result = await updateStoreWhatsAppSettings(sellerA, world.storeA, { enabled: true, events: ["order_shipped", "order_placed"] });
    if (!global.enabled) {
      // Shipped dark: nothing about the app can change while the admin switch is off.
      expect(result).toEqual({ success: false, error: "disabled" });
      expect(await setStoreWhatsAppEnabled(sellerA, world.storeA, false)).toEqual({ success: false, error: "disabled" });
      expect(await db.select().from(storeWhatsappSettings).where(eq(storeWhatsappSettings.storeId, world.storeA))).toHaveLength(0);
      return;
    }
    expect(result).toEqual({ success: true, data: { enabled: true, events: ["order_placed", "order_shipped"], saved: true } });
    // The row belongs to seller A.
    expect(await setStoreWhatsAppEnabled(sellerA, world.storeA, false)).toEqual({ success: true, data: null });
    const rows = await db.select().from(storeWhatsappSettings).where(eq(storeWhatsappSettings.storeId, world.storeA));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sellerId: sellerA, enabled: false });
  });
});
