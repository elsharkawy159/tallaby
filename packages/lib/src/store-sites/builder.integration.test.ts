import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { storeSectionRegistry } from "@workspace/store-sections/render";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import {
  createStorePage,
  deleteStorePage,
  discardStoreDrafts,
  getPublishedStoreSite,
  getStoreForEditor,
  getStoreSiteStatus,
  listStoreRevisions,
  publishStoreSite,
  reorderStorePages,
  restoreRevisionToDraft,
  saveStoreChrome,
  saveStoreDesignSystem,
  saveStorePageDraft,
  unpublishStoreSite,
  updateStorePage,
} from "./server";

/**
 * Builder storage (PLAN.md P4-04) and isolation tests 1–3 for the new
 * functions, against the staging copy. Skipped without TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const ALLOWED = storeSectionRegistry.allowedSections();
const hero = (title: string) => ({ sections: [{ id: "h1", sectionId: "hero-banner", version: 1, props: { title } }] });

describe.skipIf(!TEST_DATABASE_URL)("store builder (integration)", { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 4 });
  const db = drizzle(client, { schema: DB_SCHEMA });
  const s = DB_SCHEMA;
  let w: IsolationWorld;

  beforeAll(async () => {
    w = await createIsolationWorld(db);
  }, 60_000);

  afterAll(async () => {
    await w?.cleanup();
    await client.end();
  });

  it("saves the design system with optimistic concurrency, and only valid tokens", async () => {
    const editor = await getStoreForEditor(w.a.sellerId, w.a.a2, db);
    const version = editor!.designSystem.version;
    const theme = { colors: { primary: "#ff3366" }, typography: {}, spacing: { borderRadius: 6 } };
    const saved = await saveStoreDesignSystem(w.a.sellerId, w.a.a2, theme, version, db);
    expect(saved).toEqual({ success: true, data: { version: version + 1 } });
    expect(await saveStoreDesignSystem(w.a.sellerId, w.a.a2, theme, version, db)).toMatchObject({ error: "version_conflict" });
    expect(
      await saveStoreDesignSystem(w.a.sellerId, w.a.a2, { colors: { primary: "red;}<script>" } }, version + 1, db),
    ).toMatchObject({ error: "invalid_content" });
    expect(await saveStoreDesignSystem(w.b.sellerId, w.a.a2, theme, version + 1, db)).toMatchObject({ error: "not_found" });
  });

  it("saves the header and footer from the section library only", async () => {
    const header = { id: "hdr", sectionId: "store-header", version: 1, props: { announcement: "شحن مجاني" } };
    const v0 = (await getStoreForEditor(w.a.sellerId, w.a.a2, db))!.store.chromeVersion;
    expect(await saveStoreChrome(w.a.sellerId, w.a.a2, "header", header, v0, { allowedSections: ALLOWED }, db)).toEqual({ success: true, data: { version: v0 + 1 } });
    const [store] = await db.select().from(s.stores).where(eq(s.stores.id, w.a.a2));
    expect(store!.sharedHeader).toMatchObject({ sectionId: "store-header", props: { announcement: "شحن مجاني" } });

    const bad = { id: "x", sectionId: "custom-html", version: 1, props: {} };
    expect(await saveStoreChrome(w.a.sellerId, w.a.a2, "footer", bad, v0 + 1, { allowedSections: ALLOWED }, db)).toMatchObject({ error: "invalid_content" });
    expect(await saveStoreChrome(w.a.sellerId, w.a.a2, "footer", null, v0 + 1, { allowedSections: ALLOWED }, db)).toEqual({ success: true, data: { version: v0 + 2 } });
    expect(await saveStoreChrome(w.b.sellerId, w.a.a2, "header", header, v0 + 2, { allowedSections: ALLOWED }, db)).toMatchObject({ error: "not_found" });
  });

  it("creates, renames, reorders and deletes pages with slug rules", async () => {
    // A2 started from Tallaby Classic, which already has an "about" page.
    expect(await createStorePage(w.a.sellerId, w.a.a2, { name: { ar: "x" }, slug: "about" }, db)).toMatchObject({ error: "slug_taken" });
    const about = await createStorePage(w.a.sellerId, w.a.a2, { name: { ar: "فريقنا" }, slug: "team" }, db);
    expect(about).toMatchObject({ success: true, data: { slug: "team" } });
    expect(await createStorePage(w.a.sellerId, w.a.a2, { name: { ar: "x" }, slug: "team" }, db)).toMatchObject({ error: "slug_taken" });
    expect(await createStorePage(w.a.sellerId, w.a.a2, { name: { ar: "x" }, slug: "cart" }, db)).toMatchObject({ error: "reserved_slug" });
    expect(await createStorePage(w.a.sellerId, w.a.a2, { name: { ar: "x" }, slug: "Bad Slug" }, db)).toMatchObject({ error: "invalid_slug" });
    expect(await createStorePage(w.a.sellerId, w.a.a2, { name: {}, slug: "empty-name" }, db)).toMatchObject({ error: "invalid_input" });
    // The same slug in another store is fine.
    expect(await createStorePage(w.b.sellerId, w.b.b1, { name: { ar: "فريقنا" }, slug: "team" }, db)).toMatchObject({ success: true });

    const aboutId = about.success ? about.data.id : "";
    expect(
      await updateStorePage(w.a.sellerId, w.a.a2, aboutId, { name: { ar: "قصتنا", en: "Our story" }, slug: "story", seo: { title: "قصتنا" }, showInNav: false }, db),
    ).toEqual({ success: true, data: null });
    const [page] = await db.select().from(s.storePages).where(eq(s.storePages.id, aboutId));
    expect(page).toMatchObject({ slug: "story", name: { ar: "قصتنا", en: "Our story" }, showInNav: false, seo: { title: "قصتنا" } });

    const homeId = w.a.a2Home;
    await updateStorePage(w.a.sellerId, w.a.a2, homeId, { slug: "landing" }, db);
    expect((await db.select().from(s.storePages).where(eq(s.storePages.id, homeId)))[0]!.slug).toBe("home");

    const others = (await db.select({ id: s.storePages.id }).from(s.storePages).where(eq(s.storePages.storeId, w.a.a2)))
      .map((r) => r.id)
      .filter((id) => id !== aboutId && id !== homeId);
    const order = [aboutId, ...others, homeId];
    expect(await reorderStorePages(w.a.sellerId, w.a.a2, order, db)).toEqual({ success: true, data: null });
    const ordered = await db.select({ id: s.storePages.id }).from(s.storePages).where(eq(s.storePages.storeId, w.a.a2)).orderBy(s.storePages.orderIndex);
    expect(ordered.map((r) => r.id)).toEqual(order);
    expect(await reorderStorePages(w.a.sellerId, w.a.a2, [aboutId], db)).toMatchObject({ error: "invalid_input" });
    expect(await reorderStorePages(w.a.sellerId, w.a.a2, [aboutId, w.b.b1Home], db)).toMatchObject({ error: "invalid_input" });

    expect(await deleteStorePage(w.a.sellerId, w.a.a2, homeId, db)).toMatchObject({ error: "home_page" });
    // A page of another store is never reachable through this store.
    expect(await deleteStorePage(w.a.sellerId, w.a.a2, w.a.a1Home, db)).toMatchObject({ error: "not_found" });
    expect(await updateStorePage(w.b.sellerId, w.a.a2, aboutId, { showInNav: true }, db)).toMatchObject({ error: "not_found" });
    expect(await deleteStorePage(w.a.sellerId, w.a.a2, aboutId, db)).toEqual({ success: true, data: null });
  });

  describe("product page", () => {
    let productId = "";

    beforeAll(async () => {
      // Store b1 of seller B gets a product page, as the Task 3 seeding will.
      const [row] = await db
        .insert(s.storePages)
        .values({ storeId: w.b.b1, slug: "product", kind: "product", showInNav: false, name: { ar: "صفحة المنتج", en: "Product page" }, orderIndex: 99 })
        .returning({ id: s.storePages.id });
      productId = row!.id;
    });

    it("buildDraftSiteConfig maps kind and the product page validates", async () => {
      const editor = await getStoreForEditor(w.b.sellerId, w.b.b1, db);
      expect(editor!.pages.find((p) => p.id === productId)).toMatchObject({ slug: "product", kind: "product", showInNav: false });
      expect(editor!.pages.filter((p) => p.id !== productId).every((p) => !("kind" in p))).toBe(true);
      // Publishing validates the draft config built from the rows, product page included.
      const published = await publishStoreSite(w.b.sellerId, w.b.b1, w.b.sellerId, { allowedSections: ALLOWED }, db);
      expect(published.success).toBe(true);
      const site = await getPublishedStoreSite(w.b.b1, db);
      expect(site!.pages.find((p) => p.slug === "product")).toMatchObject({ kind: "product" });
    });

    it("deleteStorePage on product page returns product_page_locked", async () => {
      expect(await deleteStorePage(w.b.sellerId, w.b.b1, productId, db)).toMatchObject({ error: "product_page_locked" });
      expect(await db.select().from(s.storePages).where(eq(s.storePages.id, productId))).toHaveLength(1);
    });

    it("updateStorePage cannot change product page slug or showInNav", async () => {
      expect(await updateStorePage(w.b.sellerId, w.b.b1, productId, { slug: "shop" }, db)).toMatchObject({ error: "product_page_locked" });
      expect(await updateStorePage(w.b.sellerId, w.b.b1, productId, { showInNav: true }, db)).toMatchObject({ error: "product_page_locked" });
      expect(await updateStorePage(w.b.sellerId, w.b.b1, productId, { name: { ar: "صفحة التفاصيل" } }, db)).toEqual({ success: true, data: null });
      const [row] = await db.select().from(s.storePages).where(eq(s.storePages.id, productId));
      expect(row).toMatchObject({ slug: "product", showInNav: false, kind: "product", name: { ar: "صفحة التفاصيل" } });
    });

    it("createStorePage with slug product returns reserved_slug", async () => {
      expect(await createStorePage(w.b.sellerId, w.b.b1, { name: { ar: "x" }, slug: "product" }, db)).toMatchObject({ error: "reserved_slug" });
    });

    it("restoreRevisionToDraft keeps kind", async () => {
      const revisions = await listStoreRevisions(w.b.sellerId, w.b.b1, 20, db);
      const live = revisions?.[0];
      expect(live).toBeDefined();
      await db.delete(s.storePages).where(eq(s.storePages.id, productId));
      const restored = await restoreRevisionToDraft(w.b.sellerId, w.b.b1, live!.id, db);
      expect(restored.success).toBe(true);
      const [row] = await db.select().from(s.storePages).where(and(eq(s.storePages.storeId, w.b.b1), eq(s.storePages.slug, "product")));
      expect(row).toMatchObject({ kind: "product", showInNav: false });
    });
  });

  it("reports unpublished changes from the drafts, not from store settings", async () => {
    const before = await getStoreSiteStatus(w.a.sellerId, w.a.a1, db);
    expect(before).toMatchObject({ isLive: true, hasUnpublishedChanges: false });
    await db.update(s.stores).set({ updatedAt: sql`now() + interval '1 minute'` }).where(eq(s.stores.id, w.a.a1));
    expect((await getStoreSiteStatus(w.a.sellerId, w.a.a1, db))!.hasUnpublishedChanges).toBe(false);

    const [home] = await db.select().from(s.storePages).where(eq(s.storePages.id, w.a.a1Home));
    await saveStorePageDraft(w.a.sellerId, w.a.a1, w.a.a1Home, hero("Changed"), home!.draftVersion, { allowedSections: ALLOWED }, db);
    expect((await getStoreSiteStatus(w.a.sellerId, w.a.a1, db))!.hasUnpublishedChanges).toBe(true);
    expect(await getStoreSiteStatus(w.b.sellerId, w.a.a1, db)).toBeNull();
  });

  it("discards drafts back to the live revision", async () => {
    expect(await discardStoreDrafts(w.a.sellerId, w.a.a1, db)).toMatchObject({ success: true });
    expect((await getStoreSiteStatus(w.a.sellerId, w.a.a1, db))!.hasUnpublishedChanges).toBe(false);
    expect(await discardStoreDrafts(w.a.sellerId, w.a.a2, db)).toMatchObject({ error: "not_published" });
    expect(await discardStoreDrafts(w.b.sellerId, w.a.a1, db)).toMatchObject({ error: "not_found" });
  });

  it("lists revisions with the live one marked, for the owner only", async () => {
    await publishStoreSite(w.a.sellerId, w.a.a1, w.a.sellerId, { allowedSections: ALLOWED }, db);
    const revisions = await listStoreRevisions(w.a.sellerId, w.a.a1, 20, db);
    expect(revisions!.length).toBeGreaterThanOrEqual(2);
    expect(revisions![0]!.isLive).toBe(true);
    expect(revisions!.slice(1).every((r) => !r.isLive)).toBe(true);
    expect(revisions![0]!.revisionNumber).toBeGreaterThan(revisions![1]!.revisionNumber);
    expect(await listStoreRevisions(w.b.sellerId, w.a.a1, 20, db)).toBeNull();
  });

  it("unpublishes: the storefront falls back to Classic", async () => {
    expect(await unpublishStoreSite(w.b.sellerId, w.a.a1, db)).toMatchObject({ error: "not_found" });
    expect(await unpublishStoreSite(w.a.sellerId, w.a.a1, db)).toEqual({ success: true, data: null });
    expect(await getPublishedStoreSite(w.a.a1, db)).toBeNull();
    const [store] = await db.select().from(s.stores).where(and(eq(s.stores.id, w.a.a1)));
    expect(store!.siteStatus).toBe("unpublished");
    expect(await unpublishStoreSite(w.a.sellerId, w.a.a1, db)).toMatchObject({ error: "not_published" });
    expect(await getPublishedStoreSite(w.b.b1, db)).not.toBeNull();
  });
});
