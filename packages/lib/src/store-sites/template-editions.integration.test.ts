import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { count, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { contentOverrideKeys, storeSectionRegistry } from "@workspace/store-sections/render";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import { getStoreForEditor } from "./server";

// The shipped registry may be empty: the fixture pack (t-shirts on `fashion-luxe`) stands in for it.
vi.mock("@workspace/store-sections/templates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/store-sections/templates")>();
  const { TSHIRTS: pack } = await import("../../../store-sections/src/templates/editions/tshirts.fixture");
  return {
    ...actual,
    editionOnLook: (key: string, niche: unknown) => actual.editionOnLook(key, niche, [pack]),
    templateWithEdition: (key: string, niche: unknown) => actual.templateWithEdition(key, niche, [pack]),
    editionOptions: (key: string) => actual.editionOptions(key, [pack]),
  };
});

import { applyStoreTemplate, getStoreTemplateConfig, listStoreTemplates, undoStoreTemplate } from "./templates.server";

/**
 * Installing a template with a niche edition (ROADMAP F-90, plan §4.5)
 * against the staging copy: the drafts get the look built with the edition,
 * the edition's demo catalog never reaches the store, a bad edition changes
 * nothing, and undo works as for any install. Skipped without TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const OPTIONS = { allowedSections: storeSectionRegistry.allowedSections(), overrideKeys: contentOverrideKeys(storeSectionRegistry) };
const HERO = "Tees that last for years";

describe.skipIf(!TEST_DATABASE_URL)("store templates with a niche edition (integration)", { timeout: 60_000 }, () => {
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

  const drafts = async (sellerId: string, storeId: string) => JSON.stringify((await getStoreForEditor(sellerId, storeId, db))!.pages.map((p) => p.draftContent));
  const productCount = async (sellerId: string) => (await db.select({ n: count() }).from(s.products).where(eq(s.products.sellerId, sellerId)))[0]!.n;

  it("previews with the edition only for the seller's own store, and falls back for a bad edition", async () => {
    const withEdition = await getStoreTemplateConfig(w.a.sellerId, w.a.a2, "fashion-luxe", db, undefined, "tshirts");
    expect(JSON.stringify(withEdition)).toContain(HERO);
    const own = await getStoreTemplateConfig(w.a.sellerId, w.a.a2, "fashion-luxe", db);
    expect(JSON.stringify(own)).not.toContain(HERO);
    expect(JSON.stringify(await getStoreTemplateConfig(w.a.sellerId, w.a.a2, "fashion-luxe", db, undefined, "no-such-niche"))).toBe(JSON.stringify(own));
    expect(await getStoreTemplateConfig(w.b.sellerId, w.a.a2, "fashion-luxe", db, undefined, "tshirts")).toBeNull();
  });

  it("refuses an edition the template does not offer and changes nothing", async () => {
    const before = await drafts(w.a.sellerId, w.a.a2);
    for (const [key, editionId] of [
      ["fashion-luxe", "no-such-niche"],
      ["fashion-luxe", "dresses"],
      ["kabl", "tshirts"],
    ] as const) {
      expect(await applyStoreTemplate(w.a.sellerId, w.a.a2, key, w.a.sellerId, { ...OPTIONS, editionId }, db)).toEqual({ success: false, error: "edition_not_found" });
    }
    expect(await drafts(w.a.sellerId, w.a.a2)).toBe(before);
    expect((await listStoreTemplates(w.a.sellerId, w.a.a2, db))?.currentKey).toBe("tallaby-classic");
  });

  it("refuses another seller's store, with a valid edition too", async () => {
    expect(await applyStoreTemplate(w.b.sellerId, w.a.a2, "fashion-luxe", w.b.sellerId, { ...OPTIONS, editionId: "tshirts" }, db)).toEqual({ success: false, error: "not_found" });
  });

  it("installs the look built with the edition into the drafts, and never its demo catalog", async () => {
    const before = await drafts(w.a.sellerId, w.a.a2);
    const products = await productCount(w.a.sellerId);
    const [live] = await db.select({ id: s.stores.publishedRevisionId }).from(s.stores).where(eq(s.stores.id, w.a.a2));

    const applied = await applyStoreTemplate(w.a.sellerId, w.a.a2, "fashion-luxe", w.a.sellerId, { ...OPTIONS, editionId: "tshirts" }, db);
    expect(applied).toMatchObject({ success: true, data: { templateKey: "fashion-luxe" } });

    const editor = (await getStoreForEditor(w.a.sellerId, w.a.a2, db))!;
    // The edition's copy and product stage; the store keeps its own name.
    expect(await drafts(w.a.sellerId, w.a.a2)).toContain(HERO);
    expect(editor.designSystem.spacing.productStage).toEqual({ ratio: "4:5", fit: "contain" });
    expect(JSON.stringify([editor.store.sharedHeader, editor.store.sharedFooter])).not.toContain("Qotna");
    // Preview data stays preview data: no product, and the live site is untouched.
    expect(await productCount(w.a.sellerId)).toBe(products);
    const [liveAfter] = await db.select({ id: s.stores.publishedRevisionId }).from(s.stores).where(eq(s.stores.id, w.a.a2));
    expect(liveAfter!.id).toBe(live!.id);

    // Undo is the same as for any install.
    expect((await listStoreTemplates(w.a.sellerId, w.a.a2, db))?.lastInstall).toMatchObject({ templateKey: "fashion-luxe", canUndo: true });
    expect(await undoStoreTemplate(w.a.sellerId, w.a.a2, db)).toMatchObject({ success: true });
    expect(await drafts(w.a.sellerId, w.a.a2)).toBe(before);
  });
});
