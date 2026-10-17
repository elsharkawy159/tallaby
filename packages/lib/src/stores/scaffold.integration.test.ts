import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { classicHomeContent } from "@workspace/store-sections/templates";
import { createIsolationWorld, type IsolationWorld } from "./isolation.fixtures";
import { ensureStoreSiteScaffold } from "./server";
import { getStoreForEditor } from "../store-sites/server";

/** Stores start as Tallaby Classic (PLAN.md P4-03). Skipped without TEST_DATABASE_URL. */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_DATABASE_URL)("site scaffold (integration)", { timeout: 60_000 }, () => {
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

  const home = async (storeId: string) =>
    (await db.select().from(s.storePages).where(and(eq(s.storePages.storeId, storeId), eq(s.storePages.isHome, true))))[0]!;
  const store = async (storeId: string) => (await db.select().from(s.stores).where(eq(s.stores.id, storeId)))[0]!;

  it("an unpublished store gets the classic header, footer and home page", async () => {
    await getStoreForEditor(w.a.sellerId, w.a.a2, db);
    expect((await store(w.a.a2)).sharedHeader).toMatchObject({ sectionId: "classic-header" });
    expect((await store(w.a.a2)).sharedFooter).toMatchObject({ sectionId: "classic-footer" });
    expect((await home(w.a.a2)).draftContent).toEqual(classicHomeContent());
  });

  it("never replaces what a seller made or published", async () => {
    // A1 was published by the fixture with its own hero.
    const before = await home(w.a.a1);
    await db.update(s.stores).set({ sharedHeader: null }).where(eq(s.stores.id, w.a.a1));
    await ensureStoreSiteScaffold(db, w.a.a1);
    expect((await home(w.a.a1)).draftContent).toEqual(before.draftContent);
    // Published stores keep their own chrome choice, even "none".
    expect((await store(w.a.a1)).sharedHeader).toBeNull();

    // An emptied draft on a published store stays empty: the seller chose it.
    await db.update(s.storePages).set({ draftContent: { sections: [] } }).where(eq(s.storePages.id, before.id));
    await ensureStoreSiteScaffold(db, w.a.a1);
    expect((await home(w.a.a1)).draftContent).toEqual({ sections: [] });
  });

  it("is idempotent", async () => {
    await ensureStoreSiteScaffold(db, w.a.a2);
    await ensureStoreSiteScaffold(db, w.a.a2);
    const pages = await db.select().from(s.storePages).where(eq(s.storePages.storeId, w.a.a2));
    expect(pages.filter((p) => p.isHome)).toHaveLength(1);
    expect(pages[0]!.draftContent).toEqual(classicHomeContent());
  });
});
