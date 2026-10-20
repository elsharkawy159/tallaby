import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { storeSectionRegistry } from "@workspace/store-sections/render";
import {
  getPublishedStoreSite,
  getStoreDraftVersions,
  getStoreForEditor,
  publishStoreSite,
  restoreRevisionToDraft,
  saveStoreChrome,
  saveStorePageDraft,
} from "./server";

/**
 * Against a real Postgres with migrations 0050–0057 applied (the staging copy).
 * Skipped when TEST_DATABASE_URL is unset. Creates and deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

// The real section library: stores start as Tallaby Classic (classic header/footer, P4-03).
const ALLOWED = storeSectionRegistry.allowedSections();
const hero = (title: string) => ({
  sections: [{ id: "s1", sectionId: "classic-hero", version: 1, props: { title } }],
});

describe.skipIf(!TEST_DATABASE_URL)("store sites (integration)", () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;

  const sellerA = randomUUID();
  const sellerB = randomUUID();
  const tag = sellerA.slice(0, 8);
  let storeA: string;
  let storeB: string;
  let homeA: string;

  beforeAll(async () => {
    await db.insert(s.users).values([
      { id: sellerA, isGuest: false, role: "seller" },
      { id: sellerB, isGuest: false, role: "seller" },
    ]);
    await db.insert(s.sellers).values(
      [sellerA, sellerB].map((id, i) => ({
        id,
        businessName: `Site Test ${i}`,
        displayName: `Site Test ${i}`,
        slug: `st-${tag}-${i}`,
        subdomain: `st-${tag}-${i}`,
        businessType: "individual",
        legalAddress: { country: "EG" },
        supportEmail: "it@example.com",
        status: (i === 0 ? "approved" : "restricted") as "approved" | "restricted",
      })),
    );
    const rows = await db.select().from(s.stores).where(inArray(s.stores.sellerId, [sellerA, sellerB]));
    storeA = rows.find((r) => r.sellerId === sellerA)!.id;
    storeB = rows.find((r) => r.sellerId === sellerB)!.id;
  });

  afterAll(async () => {
    await db.delete(s.users).where(inArray(s.users.id, [sellerA, sellerB]));
    await client.end();
  });

  it("loads the editor for the owner and scaffolds a home page for backfilled stores", async () => {
    const editor = await getStoreForEditor(sellerA, storeA, db);
    expect(editor).not.toBeNull();
    expect(editor!.pages).toEqual([expect.objectContaining({ slug: "home", isHome: true, draftVersion: 1 })]);
    expect(editor!.designSystem).toMatchObject({ colors: {}, typography: {}, spacing: {} });
    homeA = editor!.pages[0]!.id;
  });

  it("never loads another seller's store", async () => {
    expect(await getStoreForEditor(sellerB, storeA, db)).toBeNull();
  });

  it("saves a draft with optimistic concurrency", async () => {
    const first = await saveStorePageDraft(sellerA, storeA, homeA, hero("Hello"), 1, { allowedSections: ALLOWED }, db);
    expect(first).toEqual({ success: true, data: { draftVersion: 2 } });
    const stale = await saveStorePageDraft(sellerA, storeA, homeA, hero("Stale"), 1, { allowedSections: ALLOWED }, db);
    expect(stale).toEqual({ success: false, error: "version_conflict" });
  });

  it("sanitizes and validates draft content", async () => {
    const dirty = await saveStorePageDraft(
      sellerA,
      storeA,
      homeA,
      { sections: [{ id: "s1", sectionId: "classic-hero", version: 1, props: { title: "<script>x</script>Hi" } }] },
      2,
      { allowedSections: ALLOWED },
      db,
    );
    expect(dirty.success).toBe(true);
    const [page] = await db.select().from(s.storePages).where(eq(s.storePages.id, homeA));
    expect(page!.draftContent).toMatchObject({ sections: [{ props: { title: "Hi" } }] });

    const bad = await saveStorePageDraft(
      sellerA,
      storeA,
      homeA,
      { sections: [{ id: "s1", sectionId: "booking", version: 1, props: {} }] },
      3,
      { allowedSections: ALLOWED },
      db,
    );
    expect(bad).toMatchObject({ success: false, error: "invalid_content" });
  });

  it("refuses to save into a page of another store", async () => {
    const result = await saveStorePageDraft(sellerB, storeB, homeA, hero("x"), 3, { allowedSections: ALLOWED }, db);
    expect(result).toEqual({ success: false, error: "not_found" });
  });

  it("publishes atomically into a numbered, immutable revision", async () => {
    await saveStorePageDraft(sellerA, storeA, homeA, hero("Published v1"), 3, { allowedSections: ALLOWED }, db);
    const result = await publishStoreSite(sellerA, storeA, sellerA, { allowedSections: ALLOWED }, db);
    expect(result).toMatchObject({ success: true, data: { revisionNumber: 1 } });
    const [store] = await db.select().from(s.stores).where(eq(s.stores.id, storeA));
    expect(store).toMatchObject({ siteStatus: "published" });
    expect(store!.firstPublishedAt).not.toBeNull();
    expect(store!.publishedRevisionId).toBe(result.success ? result.data.revisionId : "");

    const site = await getPublishedStoreSite(storeA, db);
    expect(site?.pages[0]?.content.sections[0]?.props.title).toBe("Published v1");
  });

  it("does not leak drafts to the public site until the next publish", async () => {
    await saveStorePageDraft(sellerA, storeA, homeA, hero("Draft v2"), 4, { allowedSections: ALLOWED }, db);
    const site = await getPublishedStoreSite(storeA, db);
    expect(site?.pages[0]?.content.sections[0]?.props.title).toBe("Published v1");
    const second = await publishStoreSite(sellerA, storeA, sellerA, { allowedSections: ALLOWED }, db);
    expect(second).toMatchObject({ success: true, data: { revisionNumber: 2 } });
    expect((await getPublishedStoreSite(storeA, db))?.pages[0]?.content.sections[0]?.props.title).toBe("Draft v2");
  });

  it("restores an old revision into the drafts without changing the live site", async () => {
    const [rev1] = await db.select().from(s.storeSiteRevisions).where(eq(s.storeSiteRevisions.revisionNumber, 1));
    const revisions = await db.select().from(s.storeSiteRevisions).where(eq(s.storeSiteRevisions.storeId, storeA));
    const first = revisions.find((r) => r.revisionNumber === 1)!;
    expect(rev1).toBeDefined();
    const restored = await restoreRevisionToDraft(sellerA, storeA, first.id, db);
    expect(restored.success).toBe(true);
    const [page] = await db.select().from(s.storePages).where(eq(s.storePages.id, homeA));
    expect(page!.draftContent).toMatchObject({ sections: [{ props: { title: "Published v1" } }] });
    expect((await getPublishedStoreSite(storeA, db))?.pages[0]?.content.sections[0]?.props.title).toBe("Draft v2");
  });

  it("saveStoreChrome with a stale version returns version_conflict and leaves shared_header unchanged", async () => {
    const header = { id: "hdr", sectionId: "store-header", version: 1, props: { announcement: "first" } };
    const stale = { ...header, props: { announcement: "stale" } };
    const v = (await getStoreForEditor(sellerA, storeA, db))!.store.chromeVersion;
    expect(await saveStoreChrome(sellerA, storeA, "header", header, v, { allowedSections: ALLOWED }, db)).toEqual({ success: true, data: { version: v + 1 } });
    expect(await saveStoreChrome(sellerA, storeA, "header", stale, v, { allowedSections: ALLOWED }, db)).toEqual({ success: false, error: "version_conflict" });
    const [store] = await db.select().from(s.stores).where(eq(s.stores.id, storeA));
    expect(store!.sharedHeader).toMatchObject({ props: { announcement: "first" } });
    expect(store!.chromeVersion).toBe(v + 1);
  });

  it("restoreRevisionToDraft bumps chrome_version", async () => {
    const revisions = await db.select().from(s.storeSiteRevisions).where(eq(s.storeSiteRevisions.storeId, storeA));
    const before = (await getStoreForEditor(sellerA, storeA, db))!.store.chromeVersion;
    expect((await restoreRevisionToDraft(sellerA, storeA, revisions[0]!.id, db)).success).toBe(true);
    expect((await getStoreForEditor(sellerA, storeA, db))!.store.chromeVersion).toBe(before + 1);
  });

  it("refuses restoring another store's revision", async () => {
    const [rev] = await db.select().from(s.storeSiteRevisions).where(eq(s.storeSiteRevisions.storeId, storeA)).limit(1);
    expect(await restoreRevisionToDraft(sellerB, storeB, rev!.id, db)).toEqual({ success: false, error: "not_found" });
  });

  it("blocks publishing for restricted sellers (A5)", async () => {
    expect(await publishStoreSite(sellerB, storeB, sellerB, { allowedSections: ALLOWED }, db)).toEqual({
      success: false,
      error: "publish_blocked",
    });
  });

  it("returns no public site for a store that never published", async () => {
    expect(await getPublishedStoreSite(storeB, db)).toBeNull();
  });

  it("getStoreDraftVersions returns page, design and chrome versions, and refuses another seller", async () => {
    const versions = await getStoreDraftVersions(sellerA, storeA, db);
    expect(versions).not.toBeNull();
    expect(Object.keys(versions!.pages).length).toBeGreaterThan(0);
    expect(versions!.designVersion).toBeGreaterThanOrEqual(0);
    expect(versions!.chromeVersion).toBeGreaterThanOrEqual(1);
    expect(versions!.editedByAdminAt).toBeNull();

    const at = new Date("2026-10-20T10:00:00.000Z");
    await db.update(s.stores).set({ siteEditedByAdminAt: at.toISOString() }).where(eq(s.stores.id, storeA));
    expect((await getStoreDraftVersions(sellerA, storeA, db))!.editedByAdminAt).toBe(at.toISOString());

    expect(await getStoreDraftVersions(sellerB, storeA, db)).toBeNull();
  });
});
