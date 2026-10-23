import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, desc, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { productPageOf, siteConfigSchema } from "@workspace/store-sections";
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

  /** Makes a store look pre-feature: no product draft row, none in any revision snapshot. */
  async function stripProductPage(storeId: string) {
    await db.delete(s.storePages).where(and(eq(s.storePages.storeId, storeId), eq(s.storePages.kind, "product")));
    const revisions = await db.select().from(s.storeSiteRevisions).where(eq(s.storeSiteRevisions.storeId, storeId));
    for (const r of revisions) {
      const snap = r.snapshot as { pages: { kind?: string }[] };
      await db
        .update(s.storeSiteRevisions)
        .set({ snapshot: { ...snap, pages: snap.pages.filter((p) => p.kind !== "product") } })
        .where(eq(s.storeSiteRevisions.id, r.id));
    }
  }

  const productRows = (storeId: string) =>
    db.select().from(s.storePages).where(and(eq(s.storePages.storeId, storeId), eq(s.storePages.kind, "product")));
  const revisionCount = async (storeId: string) => (await db.select().from(s.storeSiteRevisions).where(eq(s.storeSiteRevisions.storeId, storeId))).length;
  const liveSnapshot = async (storeId: string) => {
    const [row] = await db.select().from(s.storeSiteRevisions).where(eq(s.storeSiteRevisions.storeId, storeId)).orderBy(desc(s.storeSiteRevisions.revisionNumber)).limit(1);
    return siteConfigSchema.parse(row!.snapshot);
  };

  beforeEach(async () => {
    await stripProductPage(w.a.a1);
    await stripProductPage(w.a.a2);
    await db.update(s.stores).set({ templateKey: "tallaby-classic" }).where(eq(s.stores.id, w.a.a2));
  });

  it("adds draft row and appends to latest published revision", async () => {
    const before = await revisionCount(w.a.a1);
    const out = await backfillStoreProductPageDetailed(db, w.a.a1);
    expect(out.result).toBe("added");
    expect(out.publishedUpdated).toBe(true);

    const rows = await productRows(w.a.a1);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ slug: "product", kind: "product", isHome: false, showInNav: false });

    const live = await liveSnapshot(w.a.a1);
    const page = productPageOf(live);
    expect(page).toMatchObject({ slug: "product", kind: "product", isHome: false });
    expect(page?.id).toBe(rows[0]!.id);
    expect(await revisionCount(w.a.a1)).toBe(before);
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

  it("dry run writes nothing", async () => {
    const out = await backfillStoreProductPageDetailed(db, w.a.a1, { dryRun: true });
    expect(out.result).toBe("added");
    expect(await productRows(w.a.a1)).toHaveLength(0);
    expect(productPageOf(await liveSnapshot(w.a.a1))).toBeUndefined();
  });

  it("skips a store whose /product slug is a normal page", async () => {
    await db.insert(s.storePages).values({ storeId: w.a.a2, slug: "product", kind: "page", name: { ar: "x", en: "x" } });
    const out = await backfillStoreProductPageDetailed(db, w.a.a2);
    expect(out.result).toBe("skipped");
    expect(await productRows(w.a.a2)).toHaveLength(0);
    await db.delete(s.storePages).where(and(eq(s.storePages.storeId, w.a.a2), eq(s.storePages.slug, "product")));
  });
});
