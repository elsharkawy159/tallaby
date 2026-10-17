import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { createIsolationWorld, type IsolationWorld } from "./isolation.fixtures";
import { archiveStore, createStore, getStore, getStoreBySubdomain, listStores, updateStoreSettings } from "./server";
import {
  getPublishedStoreSite,
  getStoreForEditor,
  publishStoreSite,
  restoreRevisionToDraft,
  saveStorePageDraft,
} from "../store-sites/server";

/**
 * Mandatory tenant isolation tests (PLAN.md §17, P1-05): 1, 2, 3, 5, 11.
 * The others are added by the phases that build those features.
 * Skipped when TEST_DATABASE_URL is unset.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const hero = (title: string) => ({ sections: [{ id: "s1", sectionId: "classic-hero", version: 1, props: { title } }] });

describe.skipIf(!TEST_DATABASE_URL)("tenant isolation (integration)", () => {
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

  it("1. A cannot load B's store, page or revision", async () => {
    expect(await getStore(w.a.sellerId, w.b.b1, db)).toBeNull();
    expect(await getStoreForEditor(w.a.sellerId, w.b.b1, db)).toBeNull();
    expect((await listStores(w.a.sellerId, db)).map((x) => x.id).sort()).toEqual([w.a.a1, w.a.a2].sort());
    expect(await updateStoreSettings(w.a.sellerId, w.b.b1, { description: "x" }, db)).toEqual({
      success: false,
      error: "not_found",
    });
    expect(await archiveStore(w.a.sellerId, w.b.b1, db)).toEqual({ success: false, error: "not_found" });
  });

  it("2. A cannot save into B's page, nor into A1's page through A2", async () => {
    expect(await saveStorePageDraft(w.a.sellerId, w.b.b1, w.b.b1Home, hero("x"), 2, {}, db)).toEqual({
      success: false,
      error: "not_found",
    });
    expect(await saveStorePageDraft(w.a.sellerId, w.a.a1, w.b.b1Home, hero("x"), 2, {}, db)).toEqual({
      success: false,
      error: "not_found",
    });
    expect(await saveStorePageDraft(w.a.sellerId, w.a.a2, w.a.a1Home, hero("x"), 2, {}, db)).toEqual({
      success: false,
      error: "not_found",
    });
    const [b1Page] = await db.select().from(DB_SCHEMA.storePages).where(eq(DB_SCHEMA.storePages.id, w.b.b1Home));
    expect(b1Page!.draftContent).toMatchObject({ sections: [{ props: { title: "B1 live" } }] });
  });

  it("3. A cannot publish B's store or restore B's revision", async () => {
    expect(await publishStoreSite(w.a.sellerId, w.b.b1, w.a.sellerId, {}, db)).toEqual({
      success: false,
      error: "not_found",
    });
    expect(await restoreRevisionToDraft(w.a.sellerId, w.b.b1, w.b.b1Revision, db)).toEqual({
      success: false,
      error: "not_found",
    });
    // A's own store with B's revision id: still not found.
    expect(await restoreRevisionToDraft(w.a.sellerId, w.a.a1, w.b.b1Revision, db)).toEqual({
      success: false,
      error: "not_found",
    });
    // A1's revision cannot be restored into A2 either.
    expect(await restoreRevisionToDraft(w.a.sellerId, w.a.a2, w.a.a1Revision, db)).toEqual({
      success: false,
      error: "not_found",
    });
  });

  it("5. drafts never reach a public host, and A1's site never shows on A2's host", async () => {
    await saveStorePageDraft(w.a.sellerId, w.a.a1, w.a.a1Home, hero("A1 secret draft"), 2, {}, db);
    const a1Public = await getPublishedStoreSite(w.a.a1, db);
    expect(a1Public?.pages[0]?.content.sections[0]?.props.title).toBe("A1 live");

    const a2Host = await getStoreBySubdomain(w.a.a2Sub, db);
    expect(a2Host?.id).toBe(w.a.a2);
    expect(await getPublishedStoreSite(a2Host!.id, db)).toBeNull();

    const b1Host = await getStoreBySubdomain(w.b.b1Sub, db);
    const b1Public = await getPublishedStoreSite(b1Host!.id, db);
    expect(JSON.stringify(b1Public)).not.toContain("A1");
  });

  it("11. a 4th store on Free fails, and of 2 concurrent creates at count 2 exactly one succeeds", async () => {
    expect(await listStores(w.a.sellerId, db)).toHaveLength(2);
    const tag = w.a.sellerId.slice(0, 8);
    const results = await Promise.all([
      createStore(w.a.sellerId, { name: "Race 1", subdomain: `iso-${tag}-r1` }, db),
      createStore(w.a.sellerId, { name: "Race 2", subdomain: `iso-${tag}-r2` }, db),
    ]);
    expect(results.filter((r) => r.success)).toHaveLength(1);
    expect(results.find((r) => !r.success)).toEqual({ success: false, error: "limit_reached" });
    expect(await createStore(w.a.sellerId, { name: "Fourth", subdomain: `iso-${tag}-r4` }, db)).toEqual({
      success: false,
      error: "limit_reached",
    });
    expect(await listStores(w.a.sellerId, db)).toHaveLength(3);
  });
});
