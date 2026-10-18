import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as s from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "./isolation.fixtures";
import { getStore, updateStoreSettings, updateStoreSocialLinks } from "./server";
import { publicStoreSocialLinks, readStoreSocialLinks } from "./stores.lib";

/**
 * Website › Social media (PLAN.md §8.8, P4-15): links are stored per store in
 * `contact.social`, normalized, never touch phone/email, and only the owner
 * can change them. Skipped without TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("store social links (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: s });
  let w: IsolationWorld;

  beforeAll(async () => {
    w = await createIsolationWorld(db);
    const contact = await updateStoreSettings(w.a.sellerId, w.a.a1, { contact: { phone: "01012345678", email: "a1@example.com" } }, db);
    expect(contact.success).toBe(true);
  }, 60_000);

  afterAll(async () => {
    if (w) await w.cleanup();
    await client.end();
  });

  it("saves normalized links on that store only and keeps phone/email", async () => {
    const result = await updateStoreSocialLinks(
      w.a.sellerId,
      w.a.a1,
      [
        { platform: "whatsapp", value: "01012345678", enabled: true, order: 3 },
        { platform: "instagram", value: "@a1_shop", enabled: true, order: 1 },
        { platform: "tiktok", value: "@a1shop", enabled: false, order: 2 },
      ],
      db,
    );
    expect(result.success).toBe(true);

    const a1 = await getStore(w.a.sellerId, w.a.a1, db);
    const contact = a1!.contact as Record<string, unknown>;
    expect(contact.phone).toBe("01012345678");
    expect(contact.email).toBe("a1@example.com");
    expect(readStoreSocialLinks(contact).map((l) => [l.platform, l.order])).toEqual([
      ["instagram", 0],
      ["tiktok", 1],
      ["whatsapp", 2],
    ]);
    // The storefront renders enabled links only, in order.
    expect(publicStoreSocialLinks(contact)).toEqual([
      { platform: "instagram", url: "https://www.instagram.com/a1_shop" },
      { platform: "whatsapp", url: "https://wa.me/201012345678" },
    ]);

    // The sibling store and the other seller's store are untouched.
    const [a2] = await db.select({ contact: s.stores.contact }).from(s.stores).where(eq(s.stores.id, w.a.a2));
    const [b1] = await db.select({ contact: s.stores.contact }).from(s.stores).where(eq(s.stores.id, w.b.b1));
    expect(publicStoreSocialLinks(a2!.contact)).toEqual([]);
    expect(publicStoreSocialLinks(b1!.contact)).toEqual([]);
  });

  it("editing the general contact keeps the social links", async () => {
    await updateStoreSettings(w.a.sellerId, w.a.a1, { contact: { phone: "01198765432" } }, db);
    const a1 = await getStore(w.a.sellerId, w.a.a1, db);
    expect(publicStoreSocialLinks(a1!.contact)).toHaveLength(2);
  });

  it("refuses links off the platform's domain and duplicate platforms", async () => {
    const offDomain = await updateStoreSocialLinks(w.a.sellerId, w.a.a1, [{ platform: "facebook", value: "https://evil.com/x", enabled: true, order: 0 }], db);
    expect(offDomain).toEqual({ success: false, error: "invalid_input" });
    const duplicate = await updateStoreSocialLinks(
      w.a.sellerId,
      w.a.a1,
      [
        { platform: "x", value: "@a", enabled: true, order: 0 },
        { platform: "x", value: "@b", enabled: true, order: 1 },
      ],
      db,
    );
    expect(duplicate).toEqual({ success: false, error: "invalid_input" });
    const extraKey = await updateStoreSocialLinks(w.a.sellerId, w.a.a1, [{ platform: "x", value: "@a", enabled: true, order: 0, url: "javascript:1" }], db);
    expect(extraKey).toEqual({ success: false, error: "invalid_input" });
  });

  it("seller B cannot change A's links", async () => {
    const result = await updateStoreSocialLinks(w.b.sellerId, w.a.a1, [], db);
    expect(result).toEqual({ success: false, error: "not_found" });
    const a1 = await getStore(w.a.sellerId, w.a.a1, db);
    expect(publicStoreSocialLinks(a1!.contact)).toHaveLength(2);
  });
});
