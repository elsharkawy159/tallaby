import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import {
  archiveStore,
  checkStoreSubdomain,
  createStore,
  getStore,
  getStoreBySubdomain,
  listStores,
  restoreStore,
  updateStorePolicies,
  updateStoreSettings,
  updateStoreSubdomain,
} from "./server";

/**
 * Against a real Postgres with migrations 0050–0057 applied (the staging copy).
 * Skipped when TEST_DATABASE_URL is unset. Creates and deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("stores (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;

  const sellerA = randomUUID();
  const sellerB = randomUUID();
  const tag = sellerA.slice(0, 8);
  const sub = (name: string) => `it-${tag}-${name}`;

  let primaryA: string;
  let primaryB: string;

  beforeAll(async () => {
    await db.insert(s.users).values([
      { id: sellerA, isGuest: false, role: "seller" },
      { id: sellerB, isGuest: false, role: "seller" },
    ]);
    await db.insert(s.sellers).values(
      [sellerA, sellerB].map((id, i) => ({
        id,
        businessName: `IT Seller ${i}`,
        displayName: `IT Seller ${i}`,
        slug: `it-${tag}-seller-${i}`,
        subdomain: sub(`primary-${i}`),
        businessType: "individual",
        legalAddress: { country: "EG" },
        supportEmail: "it@example.com",
        status: "approved" as const,
      })),
    );
    const rows = await db.select().from(s.stores).where(inArray(s.stores.sellerId, [sellerA, sellerB]));
    primaryA = rows.find((r) => r.sellerId === sellerA)!.id;
    primaryB = rows.find((r) => r.sellerId === sellerB)!.id;
  });

  afterAll(async () => {
    await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, [sellerA, sellerB]));
    await db.delete(s.users).where(inArray(s.users.id, [sellerA, sellerB]));
    await client.end();
  });

  it("gives every new seller one primary store (trigger)", async () => {
    const list = await listStores(sellerA, db);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: primaryA, isPrimary: true, subdomain: sub("primary-0") });
  });

  it("creates stores up to the Free limit of 3, then refuses", async () => {
    const second = await createStore(sellerA, { name: "Second", subdomain: sub("second") }, db);
    expect(second.success).toBe(true);
    const third = await createStore(sellerA, { name: "Third", subdomain: sub("third") }, db);
    expect(third.success).toBe(true);
    const fourth = await createStore(sellerA, { name: "Fourth", subdomain: sub("fourth") }, db);
    expect(fourth).toEqual({ success: false, error: "limit_reached" });
  });

  it("scaffolds a design system and a home page for a new store", async () => {
    const [store] = await db.select().from(s.stores).where(eq(s.stores.subdomain, sub("second")));
    const pages = await db.select().from(s.storePages).where(eq(s.storePages.storeId, store!.id));
    expect(pages).toEqual([expect.objectContaining({ slug: "home", isHome: true })]);
    const ds = await db.select().from(s.storeDesignSystems).where(eq(s.storeDesignSystems.storeId, store!.id));
    expect(ds).toHaveLength(1);
  });

  it("counts archived stores toward the limit (D26)", async () => {
    const [third] = await db.select().from(s.stores).where(eq(s.stores.subdomain, sub("third")));
    expect((await archiveStore(sellerA, third!.id, db)).success).toBe(true);
    const again = await createStore(sellerA, { name: "Again", subdomain: sub("again") }, db);
    expect(again).toEqual({ success: false, error: "limit_reached" });
    expect((await restoreStore(sellerA, third!.id, db)).success).toBe(true);
  });

  it("respects an admin override of the store limit (D27)", async () => {
    await db.update(s.sellers).set({ maxStoresOverride: 4 }).where(eq(s.sellers.id, sellerA));
    const fourth = await createStore(sellerA, { name: "Fourth", subdomain: sub("fourth") }, db);
    expect(fourth.success).toBe(true);
    await db.update(s.sellers).set({ maxStoresOverride: null }).where(eq(s.sellers.id, sellerA));
  });

  it("allows only one winner when two creates race at the limit", async () => {
    // Seller B has 1 store; limit 3 → two slots. Three concurrent creates → exactly two succeed.
    const results = await Promise.all(
      ["r1", "r2", "r3"].map((n) => createStore(sellerB, { name: `Race ${n}`, subdomain: sub(`race-${n}`) }, db)),
    );
    expect(results.filter((r) => r.success)).toHaveLength(2);
    expect(results.filter((r) => !r.success)).toEqual([{ success: false, error: "limit_reached" }]);
    expect(await listStores(sellerB, db)).toHaveLength(3);
  });

  it("refuses a subdomain used by any store, seller or other seller's old link", async () => {
    expect(await checkStoreSubdomain(sellerB, sub("second"), {}, db)).toMatchObject({ status: "taken" });
    expect(await checkStoreSubdomain(sellerB, "admin", {}, db)).toMatchObject({ status: "reserved" });
    expect(await checkStoreSubdomain(sellerB, "a", {}, db)).toMatchObject({ status: "tooShort" });
    const free = await checkStoreSubdomain(sellerB, sub("free-name"), {}, db);
    expect(free).toEqual({ status: "available", subdomain: sub("free-name"), suggestions: [] });
    const taken = await checkStoreSubdomain(sellerB, sub("second"), {}, db);
    expect(taken.suggestions.length).toBeGreaterThan(0);
    expect(taken.suggestions).not.toContain(sub("second"));
  });

  it("never returns another seller's store", async () => {
    expect(await getStore(sellerB, primaryA, db)).toBeNull();
    expect(await getStore(sellerA, primaryA, db)).toMatchObject({ id: primaryA });
    expect(await updateStoreSettings(sellerB, primaryA, { description: "hacked" }, db)).toEqual({
      success: false,
      error: "not_found",
    });
    expect(await archiveStore(sellerB, primaryA, db)).toEqual({ success: false, error: "not_found" });
  });

  it("updates general settings on the owner's store only", async () => {
    const result = await updateStoreSettings(
      sellerA,
      primaryA,
      { description: "Fresh", contact: { email: "shop@example.com" } },
      db,
    );
    expect(result.success).toBe(true);
    const [row] = await db.select().from(s.stores).where(eq(s.stores.id, primaryA));
    expect(row).toMatchObject({ description: "Fresh", contact: { email: "shop@example.com" } });
    const [other] = await db.select().from(s.stores).where(eq(s.stores.id, primaryB));
    expect(other!.description).not.toBe("Fresh");
  });

  it("replaces phone/whatsapp/email as a set but keeps other contact keys", async () => {
    await db.update(s.stores).set({ contact: { email: "a@example.com", phone: "0100", social: { fb: "x" } } }).where(eq(s.stores.id, primaryA));
    const result = await updateStoreSettings(sellerA, primaryA, { contact: { whatsapp: "01112345678" } }, db);
    expect(result.success).toBe(true);
    const [row] = await db.select({ contact: s.stores.contact }).from(s.stores).where(eq(s.stores.id, primaryA));
    expect(row!.contact).toEqual({ whatsapp: "01112345678", social: { fb: "x" } });
  });

  it("rejects invalid settings", async () => {
    expect(await updateStoreSettings(sellerA, primaryA, { status: "suspended" } as never, db)).toEqual({
      success: false,
      error: "invalid_input",
    });
  });

  it("does not let the primary store be archived", async () => {
    expect(await archiveStore(sellerA, primaryA, db)).toEqual({ success: false, error: "primary_store" });
  });

  it("makes archived stores read-only", async () => {
    const [second] = await db.select().from(s.stores).where(eq(s.stores.subdomain, sub("second")));
    await archiveStore(sellerA, second!.id, db);
    expect(await updateStoreSettings(sellerA, second!.id, { description: "x" }, db)).toEqual({
      success: false,
      error: "store_read_only",
    });
    await restoreStore(sellerA, second!.id, db);
  });

  it("moves a primary store's subdomain, keeps the old one as a redirect and syncs sellers.subdomain", async () => {
    const result = await updateStoreSubdomain(sellerA, primaryA, sub("moved"), db);
    expect(result).toEqual({ success: true, data: { subdomain: sub("moved"), previous: sub("primary-0") } });
    const [seller] = await db.select({ subdomain: s.sellers.subdomain }).from(s.sellers).where(eq(s.sellers.id, sellerA));
    expect(seller!.subdomain).toBe(sub("moved"));
    const redirects = await db
      .select()
      .from(s.sellerSubdomainRedirects)
      .where(and(eq(s.sellerSubdomainRedirects.subdomain, sub("primary-0"))));
    expect(redirects).toEqual([expect.objectContaining({ sellerId: sellerA, storeId: primaryA })]);
    // Another seller cannot claim the old link.
    expect(await checkStoreSubdomain(sellerB, sub("primary-0"), {}, db)).toMatchObject({ status: "taken" });
    // The owner can take it back on any of their stores.
    expect(await checkStoreSubdomain(sellerA, sub("primary-0"), { storeId: primaryA }, db)).toMatchObject({
      status: "available",
    });
  });

  it("refuses moving onto a taken subdomain", async () => {
    expect(await updateStoreSubdomain(sellerA, primaryA, sub("primary-1"), db)).toEqual({
      success: false,
      error: "taken",
    });
  });

  it("resolves a public storefront by subdomain only when active and approved", async () => {
    expect(await getStoreBySubdomain(sub("moved"), db)).toMatchObject({ id: primaryA, sellerId: sellerA });
    const [second] = await db.select().from(s.stores).where(eq(s.stores.subdomain, sub("second")));
    await archiveStore(sellerA, second!.id, db);
    expect(await getStoreBySubdomain(sub("second"), db)).toBeNull();
    await restoreStore(sellerA, second!.id, db);
    await db.update(s.sellers).set({ status: "suspended" }).where(eq(s.sellers.id, sellerA));
    expect(await getStoreBySubdomain(sub("moved"), db)).toBeNull();
    await db.update(s.sellers).set({ status: "approved" }).where(eq(s.sellers.id, sellerA));
  });
});

describe.skipIf(!TEST_DATABASE_URL)("store policies (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 2 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  const sellerId = randomUUID();
  const other = randomUUID();
  let storeId: string;

  beforeAll(async () => {
    await db.insert(s.users).values([
      { id: sellerId, isGuest: false, role: "seller" },
      { id: other, isGuest: false, role: "seller" },
    ]);
    await db.insert(s.sellers).values(
      [sellerId, other].map((id, i) => ({
        id,
        businessName: `Pol ${i}`,
        displayName: `Pol ${i}`,
        slug: `pol-${id.slice(0, 8)}`,
        subdomain: `pol-${id.slice(0, 8)}`,
        businessType: "individual",
        legalAddress: { country: "EG" },
        supportEmail: "pol@example.com",
        returnPolicy: "Old returns",
        status: "approved" as const,
      })),
    );
    const [store] = await db.select().from(s.stores).where(eq(s.stores.sellerId, sellerId));
    storeId = store!.id;
  });

  afterAll(async () => {
    await db.delete(s.users).where(inArray(s.users.id, [sellerId, other]));
    await client.end();
  });

  it("starts from the seller's existing policies (backfill / trigger)", async () => {
    const store = await getStore(sellerId, storeId, db);
    expect(store?.policies).toMatchObject({ return: "Old returns" });
  });

  it("updates the store policies and mirrors return/shipping to the storefront's seller row", async () => {
    const result = await updateStorePolicies(sellerId, storeId, { return: "30 days", shipping: "2-4 days", terms: "Be nice" }, db);
    expect(result.success).toBe(true);
    const store = await getStore(sellerId, storeId, db);
    expect(store?.policies).toEqual({ return: "30 days", shipping: "2-4 days", terms: "Be nice" });
    const [seller] = await db.select().from(s.sellers).where(eq(s.sellers.id, sellerId));
    expect(seller).toMatchObject({ returnPolicy: "30 days", shippingPolicy: "2-4 days" });
  });

  it("removes a policy saved as empty text", async () => {
    await updateStorePolicies(sellerId, storeId, { terms: "" }, db);
    const store = await getStore(sellerId, storeId, db);
    expect(store?.policies).not.toHaveProperty("terms");
  });

  it("refuses another seller's store", async () => {
    expect(await updateStorePolicies(other, storeId, { return: "hijack" }, db)).toEqual({ success: false, error: "not_found" });
  });
});
