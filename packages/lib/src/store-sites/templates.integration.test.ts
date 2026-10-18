import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { contentOverrideKeys, storeSectionRegistry } from "@workspace/store-sections/render";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import { getStoreForEditor, saveStoreDesignSystem, saveStorePageDraft } from "./server";
import { applyStoreTemplate, listStoreTemplates, undoStoreTemplate } from "./templates.server";

/**
 * Templates apply/undo (PLAN.md §8.1, P4-05) against the staging copy, which
 * has Tallaby Classic seeded (0062) and 0064. Skipped without TEST_DATABASE_URL.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const OPTIONS = { allowedSections: storeSectionRegistry.allowedSections(), overrideKeys: contentOverrideKeys(storeSectionRegistry) };

describe.skipIf(!TEST_DATABASE_URL)("store templates (integration)", { timeout: 60_000 }, () => {
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

  const home = async (sellerId: string, storeId: string) => (await getStoreForEditor(sellerId, storeId, db))!.pages.find((p) => p.isHome)!;

  it("lists Tallaby Classic as the store's current template", async () => {
    const gallery = await listStoreTemplates(w.a.sellerId, w.a.a2, db);
    expect(gallery?.currentKey).toBe("tallaby-classic");
    expect(gallery?.templates.find((t) => t.key === "tallaby-classic")?.isDefault).toBe(true);
    expect(await listStoreTemplates(w.b.sellerId, w.a.a2, db)).toBeNull();
  });

  it("applies to drafts only, keeps seller text in matching sections, and leaves other stores alone", async () => {
    const page = await home(w.a.sellerId, w.a.a2);
    const draft = {
      sections: [
        { id: "classic-categories", sectionId: "classic-categories", version: 1, props: { title: "My categories" } },
        { id: "extra", sectionId: "hero-banner", version: 1, props: { title: "Gone after apply" } },
      ],
    };
    expect((await saveStorePageDraft(w.a.sellerId, w.a.a2, page.id, draft, page.draftVersion, OPTIONS, db)).success).toBe(true);
    const ds = (await getStoreForEditor(w.a.sellerId, w.a.a2, db))!.designSystem;
    await saveStoreDesignSystem(w.a.sellerId, w.a.a2, { colors: { primary: "#ff3366" }, typography: {}, spacing: {} }, ds.version, db);

    const [a1Before] = await db.select().from(s.storePages).where(eq(s.storePages.storeId, w.a.a1));
    const [a2Store] = await db.select({ live: s.stores.publishedRevisionId }).from(s.stores).where(eq(s.stores.id, w.a.a2));

    const applied = await applyStoreTemplate(w.a.sellerId, w.a.a2, "tallaby-classic", w.a.sellerId, OPTIONS, db);
    expect(applied).toMatchObject({ success: true, data: { templateKey: "tallaby-classic", pagesUpdated: 1, pagesCreated: 0 } });

    const after = await home(w.a.sellerId, w.a.a2);
    const sections = (after.draftContent as { sections: { sectionId: string; props: Record<string, unknown> }[] }).sections;
    expect(sections.map((x) => x.sectionId)).toEqual(["classic-hero", "classic-categories", "classic-catalog"]);
    expect(sections[1]!.props.title).toBe("My categories");

    const [a1After] = await db.select().from(s.storePages).where(eq(s.storePages.id, a1Before!.id));
    expect(a1After!.draftVersion).toBe(a1Before!.draftVersion);
    const [a2After] = await db.select({ live: s.stores.publishedRevisionId }).from(s.stores).where(eq(s.stores.id, w.a.a2));
    expect(a2After!.live).toBe(a2Store!.live);
    expect((await listStoreTemplates(w.a.sellerId, w.a.a2, db))?.lastInstall?.canUndo).toBe(true);
  });

  it("undo restores the drafts from just before the apply, once", async () => {
    expect(await undoStoreTemplate(w.a.sellerId, w.a.a2, db)).toMatchObject({ success: true });
    const after = await home(w.a.sellerId, w.a.a2);
    const sections = (after.draftContent as { sections: { id: string }[] }).sections;
    expect(sections.map((x) => x.id)).toEqual(["classic-categories", "extra"]);
    expect((await getStoreForEditor(w.a.sellerId, w.a.a2, db))!.designSystem.colors).toMatchObject({ primary: "#ff3366" });
    expect(await undoStoreTemplate(w.a.sellerId, w.a.a2, db)).toMatchObject({ success: false, error: "nothing_to_undo" });
  });

  it("refuses foreign stores and unknown templates", async () => {
    expect(await applyStoreTemplate(w.b.sellerId, w.a.a2, "tallaby-classic", w.b.sellerId, OPTIONS, db)).toMatchObject({ error: "not_found" });
    expect(await undoStoreTemplate(w.b.sellerId, w.a.a2, db)).toMatchObject({ error: "not_found" });
    expect(await applyStoreTemplate(w.a.sellerId, w.a.a2, "no-such-template", w.a.sellerId, OPTIONS, db)).toMatchObject({ error: "template_not_found" });
    expect(await applyStoreTemplate(w.a.sellerId, w.a.a2, "Bad Key!", w.a.sellerId, OPTIONS, db)).toMatchObject({ error: "template_not_found" });
  });
});
