import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, max } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { productPageOf, siteConfigSchema } from "@workspace/store-sections";
import { getStoreSiteStatus, publishStoreSite } from "./server";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import { backfillStoreProductPage, backfillStoreProductPageDetailed } from "./backfill-product-page.server";

/**
 * Backfill of the template product page into existing stores (spec §8). New stores already get the
 * page, so each test first strips it to look like a store from before the feature. Skipped without
 * TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("backfill product page (integration)", { timeout: 60_000 }, () => {
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

  /**
   * Revisions are append-only (0051 trigger), so a test changes the live site the way publish does:
   * inserts a new revision (copying the live one's schema version and template key) and points the
   * store at it. Returns the new revision id.
   */
  async function publishSnapshot(storeId: string, snapshot: unknown): Promise<string> {
    const [store] = await db.select({ live: s.stores.publishedRevisionId }).from(s.stores).where(eq(s.stores.id, storeId));
    const [live] = await db.select().from(s.storeSiteRevisions).where(eq(s.storeSiteRevisions.id, store!.live!));
    const [{ last } = { last: 0 }] = await db
      .select({ last: max(s.storeSiteRevisions.revisionNumber) })
      .from(s.storeSiteRevisions)
      .where(eq(s.storeSiteRevisions.storeId, storeId));
    const [row] = await db
      .insert(s.storeSiteRevisions)
      .values({ storeId, revisionNumber: (last ?? 0) + 1, schemaVersion: live!.schemaVersion, templateKey: live!.templateKey, snapshot })
      .returning({ id: s.storeSiteRevisions.id });
    await db.update(s.stores).set({ publishedRevisionId: row!.id }).where(eq(s.stores.id, storeId));
    return row!.id;
  }

  /** Makes a store look pre-feature: no product draft row, and a live snapshot without one. */
  async function stripProductPage(storeId: string) {
    await db.delete(s.storePages).where(and(eq(s.storePages.storeId, storeId), eq(s.storePages.kind, "product")));
    const [store] = await db.select({ live: s.stores.publishedRevisionId }).from(s.stores).where(eq(s.stores.id, storeId));
    if (!store?.live) return;
    const [live] = await db.select().from(s.storeSiteRevisions).where(eq(s.storeSiteRevisions.id, store.live));
    const snap = live!.snapshot as { pages: { kind?: string }[] };
    if (!snap.pages.some((p) => p.kind === "product")) return;
    await publishSnapshot(storeId, { ...snap, pages: snap.pages.filter((p) => p.kind !== "product") });
  }

  const productRows = (storeId: string) =>
    db.select().from(s.storePages).where(and(eq(s.storePages.storeId, storeId), eq(s.storePages.kind, "product")));
  const revisionCount = async (storeId: string) => (await db.select().from(s.storeSiteRevisions).where(eq(s.storeSiteRevisions.storeId, storeId))).length;
  /** The live revision, found the way the storefront finds it (stores.published_revision_id). */
  const liveRevision = async (storeId: string) => {
    const [row] = await db
      .select({ id: s.storeSiteRevisions.id, snapshot: s.storeSiteRevisions.snapshot })
      .from(s.stores)
      .innerJoin(s.storeSiteRevisions, eq(s.storeSiteRevisions.id, s.stores.publishedRevisionId))
      .where(eq(s.stores.id, storeId));
    return row!;
  };
  const liveSnapshot = async (storeId: string) => siteConfigSchema.parse((await liveRevision(storeId)).snapshot);

  beforeEach(async () => {
    await stripProductPage(w.a.a1);
    await stripProductPage(w.a.a2);
    await db.update(s.stores).set({ templateKey: "tallaby-classic" }).where(eq(s.stores.id, w.a.a2));
  });

  it("adds the draft row and publishes a new live revision; the old revision is unchanged", async () => {
    const before = await revisionCount(w.a.a1);
    const old = await liveRevision(w.a.a1);
    const [oldRow] = await db.select().from(s.storeSiteRevisions).where(eq(s.storeSiteRevisions.id, old.id));
    const out = await backfillStoreProductPageDetailed(db, w.a.a1);
    expect(out.result).toBe("added");
    expect(out.publishedUpdated).toBe(true);

    const rows = await productRows(w.a.a1);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ slug: "product", kind: "product", isHome: false, showInNav: false });

    const now = await liveRevision(w.a.a1);
    expect(now.id).not.toBe(old.id);
    const [newRow] = await db.select().from(s.storeSiteRevisions).where(eq(s.storeSiteRevisions.id, now.id));
    expect(newRow).toMatchObject({
      revisionNumber: oldRow!.revisionNumber + 1,
      schemaVersion: oldRow!.schemaVersion,
      templateKey: oldRow!.templateKey,
      publishedBy: null,
    });
    expect(out.revisionNumber).toBe(newRow!.revisionNumber);
    const live = siteConfigSchema.parse(now.snapshot);
    expect(live.pages.filter((p) => p.kind === "product")).toHaveLength(1);
    const page = productPageOf(live);
    expect(page).toMatchObject({ slug: "product", kind: "product", isHome: false });
    expect(page?.id).toBe(rows[0]!.id);
    expect(live.pages.filter((p) => p.kind !== "product")).toEqual(siteConfigSchema.parse(old.snapshot).pages);
    expect(await revisionCount(w.a.a1)).toBe(before + 1);

    const [oldAfter] = await db.select().from(s.storeSiteRevisions).where(eq(s.storeSiteRevisions.id, old.id));
    expect(oldAfter).toEqual(oldRow);
  });

  it("draft-only store gets draft row only", async () => {
    const before = await revisionCount(w.a.a2);
    const out = await backfillStoreProductPageDetailed(db, w.a.a2);
    expect(out).toMatchObject({ result: "added", publishedUpdated: false });
    expect(await productRows(w.a.a2)).toHaveLength(1);
    expect(await revisionCount(w.a.a2)).toBe(before);
  });

  it("second run skipped", async () => {
    expect(await backfillStoreProductPage(db, w.a.a1)).toBe("added");
    expect(await backfillStoreProductPage(db, w.a.a1)).toBe("skipped");
    expect(await productRows(w.a.a1)).toHaveLength(1);
    const live = await liveSnapshot(w.a.a1);
    expect(live.pages.filter((p) => p.kind === "product")).toHaveLength(1);
  });

  it("unknown templateKey falls back to classic", async () => {
    await db.update(s.stores).set({ templateKey: "no-such-template" }).where(eq(s.stores.id, w.a.a2));
    const out = await backfillStoreProductPageDetailed(db, w.a.a2);
    expect(out.result).toBe("added");
    expect(out.templateKey).toBe("tallaby-classic");
  });

  it("seller's other drafts untouched", async () => {
    const [home] = await db.select().from(s.storePages).where(and(eq(s.storePages.storeId, w.a.a1), eq(s.storePages.isHome, true)));
    const draft = { sections: [{ id: "d1", sectionId: "classic-hero", version: 1, props: { title: "UNPUBLISHED EDIT" } }] };
    await db.update(s.storePages).set({ draftContent: draft }).where(eq(s.storePages.id, home!.id));
    const liveBefore = await liveSnapshot(w.a.a1);

    await backfillStoreProductPage(db, w.a.a1);

    const [homeAfter] = await db.select().from(s.storePages).where(eq(s.storePages.id, home!.id));
    expect(homeAfter!.draftContent).toEqual(draft);
    expect(homeAfter!.draftVersion).toBe(home!.draftVersion);
    const liveAfter = await liveSnapshot(w.a.a1);
    expect(liveAfter.pages.filter((p) => p.kind !== "product")).toEqual(liveBefore.pages);
  });

  it("dry run writes nothing and reports what apply does", async () => {
    const before = await revisionCount(w.a.a1);
    const liveId = (await liveRevision(w.a.a1)).id;
    const dry = await backfillStoreProductPageDetailed(db, w.a.a1, { dryRun: true });
    expect(dry.result).toBe("added");
    expect(await productRows(w.a.a1)).toHaveLength(0);
    expect(productPageOf(await liveSnapshot(w.a.a1))).toBeUndefined();
    expect(await revisionCount(w.a.a1)).toBe(before);
    expect((await liveRevision(w.a.a1)).id).toBe(liveId);

    const applied = await backfillStoreProductPageDetailed(db, w.a.a1);
    expect(applied).toEqual(dry);
  });

  it("skips a store whose /product slug is a normal page", async () => {
    await db.insert(s.storePages).values({ storeId: w.a.a2, slug: "product", kind: "page", name: { ar: "x", en: "x" } });
    const out = await backfillStoreProductPageDetailed(db, w.a.a2);
    expect(out.result).toBe("skipped");
    expect(await productRows(w.a.a2)).toHaveLength(0);
    await db.delete(s.storePages).where(and(eq(s.storePages.storeId, w.a.a2), eq(s.storePages.slug, "product")));
  });

  it("keeps an in-sync published store free of unpublished changes (English store)", async () => {
    await db.update(s.stores).set({ defaultLocale: "en" }).where(eq(s.stores.id, w.a.a2));
    const published = await publishStoreSite(w.a.sellerId, w.a.a2, w.a.sellerId, {}, db);
    expect(published.success).toBe(true);
    expect((await getStoreSiteStatus(w.a.sellerId, w.a.a2, db))?.hasUnpublishedChanges).toBe(false);

    await stripProductPage(w.a.a2);
    expect((await backfillStoreProductPageDetailed(db, w.a.a2)).publishedUpdated).toBe(true);
    expect((await getStoreSiteStatus(w.a.sellerId, w.a.a2, db))?.hasUnpublishedChanges).toBe(false);
    await db.update(s.stores).set({ defaultLocale: "ar" }).where(eq(s.stores.id, w.a.a2));
  });

  it("skips a store whose live snapshot is invalid", async () => {
    const live = await liveRevision(w.a.a2);
    const broken = await publishSnapshot(w.a.a2, { schemaVersion: 1, pages: "broken" });
    try {
      const out = await backfillStoreProductPageDetailed(db, w.a.a2);
      expect(out.result).toBe("skipped");
      expect(await productRows(w.a.a2)).toHaveLength(0);
      expect((await liveRevision(w.a.a2)).id).toBe(broken);
    } finally {
      await db.update(s.stores).set({ publishedRevisionId: live.id }).where(eq(s.stores.id, w.a.a2));
    }
  });
});
