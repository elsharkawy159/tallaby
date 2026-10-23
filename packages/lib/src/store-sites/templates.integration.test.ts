import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as DB_SCHEMA from "@workspace/db/schema";
import { contentOverrideKeys, storeSectionRegistry } from "@workspace/store-sections/render";
import { classicConfig } from "@workspace/store-sections/templates";
import { createIsolationWorld, type IsolationWorld } from "../stores/isolation.fixtures";
import { getStoreForEditor, saveStoreDesignSystem, saveStorePageDraft } from "./server";
import {
  applyStoreTemplate,
  getPublicTemplate,
  getPublicTemplateConfig,
  getStoreTemplateConfig,
  getTemplateMeta,
  listStoreTemplates,
  undoStoreTemplate,
} from "./templates.server";

/**
 * Templates apply/undo (PLAN.md §8.1, P4-05) against the staging copy, which
 * has Tallaby Classic seeded (0052/0062, v3 tree sections in 0071) and 0064.
 * Skipped without TEST_DATABASE_URL.
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

  it("reads one template's config for the preview, only for the seller's own store", async () => {
    const config = await getStoreTemplateConfig(w.a.sellerId, w.a.a2, "tallaby-classic", db);
    expect(config?.pages.some((p) => p.isHome)).toBe(true);
    expect(await getStoreTemplateConfig(w.b.sellerId, w.a.a2, "tallaby-classic", db)).toBeNull();
    expect(await getStoreTemplateConfig(w.a.sellerId, w.a.a2, "no-such-template", db)).toBeNull();
    expect(await getStoreTemplateConfig(w.a.sellerId, w.a.a2, "../bad", db)).toBeNull();
  });

  it("gallery, previews and meta read the database meta and hide soft-deleted templates", async () => {
    const card = (await listStoreTemplates(w.a.sellerId, w.a.a2, db))!.templates.find((t) => t.key === "atelier")!;
    expect(card.palette.length).toBeGreaterThan(0);
    expect(card.formKinds).toEqual(expect.any(Array));
    expect((await getTemplateMeta("atelier", db))?.demo.products.length).toBeGreaterThan(0);
    expect((await getPublicTemplate("atelier", db))?.meta.palette).toEqual(card.palette);

    await db.update(s.templates).set({ deletedAt: new Date().toISOString() }).where(eq(s.templates.key, "atelier"));
    try {
      expect((await listStoreTemplates(w.a.sellerId, w.a.a2, db))!.templates.some((t) => t.key === "atelier")).toBe(false);
      expect(await getPublicTemplateConfig("atelier", db)).toBeNull();
      expect(await getStoreTemplateConfig(w.a.sellerId, w.a.a2, "atelier", db)).toBeNull();
      expect(await getTemplateMeta("atelier", db)).toBeNull();
    } finally {
      await db.update(s.templates).set({ deletedAt: null }).where(eq(s.templates.key, "atelier"));
    }
  });

  // Needs 0071 (Tallaby Classic v3, tree sections) on the test database; skipped until it is applied.
  const classicV3 = async () => {
    const [row] = await db
      .select({ version: s.templateVersions.version })
      .from(s.templates)
      .innerJoin(s.templateVersions, eq(s.templateVersions.id, s.templates.currentVersionId))
      .where(eq(s.templates.key, "tallaby-classic"));
    return (row?.version ?? 0) >= 3;
  };

  it("applyStoreTemplate bumps chrome_version", async (t) => {
    if (!(await classicV3())) return t.skip();
    const before = (await getStoreForEditor(w.a.sellerId, w.a.a2, db))!.store.chromeVersion;
    expect((await applyStoreTemplate(w.a.sellerId, w.a.a2, "tallaby-classic", w.a.sellerId, OPTIONS, db)).success).toBe(true);
    expect((await getStoreForEditor(w.a.sellerId, w.a.a2, db))!.store.chromeVersion).toBeGreaterThan(before);
    expect((await undoStoreTemplate(w.a.sellerId, w.a.a2, db)).success).toBe(true);
  });

  it("applies to drafts only, replaces the home sections, and leaves other stores alone", async (t) => {
    if (!(await classicV3())) return t.skip();
    // A2 started from Classic (store scaffold); the seller removed all but the hero and added a section.
    const page = await home(w.a.sellerId, w.a.a2);
    const [hero] = (classicConfig().pages[0]!.content.sections);
    const draft = { sections: [hero!, { ...hero!, id: "extra" }] };
    expect((await saveStorePageDraft(w.a.sellerId, w.a.a2, page.id, draft, page.draftVersion, OPTIONS, db)).success).toBe(true);
    const ds = (await getStoreForEditor(w.a.sellerId, w.a.a2, db))!.designSystem;
    await saveStoreDesignSystem(w.a.sellerId, w.a.a2, { colors: { primary: "#ff3366" }, typography: {}, spacing: {} }, ds.version, db);

    const [a1Before] = await db.select().from(s.storePages).where(eq(s.storePages.storeId, w.a.a1));
    const [a2Store] = await db.select({ live: s.stores.publishedRevisionId }).from(s.stores).where(eq(s.stores.id, w.a.a2));

    const applied = await applyStoreTemplate(w.a.sellerId, w.a.a2, "tallaby-classic", w.a.sellerId, OPTIONS, db);
    expect(applied).toMatchObject({ success: true, data: { templateKey: "tallaby-classic", pagesUpdated: 7, pagesCreated: 0 } });

    const after = await home(w.a.sellerId, w.a.a2);
    const sections = (after.draftContent as { sections: { id: string }[] }).sections;
    expect(sections.map((x) => x.id)).toEqual(classicConfig().pages[0]!.content.sections.map((x) => x.id));

    const [a1After] = await db.select().from(s.storePages).where(eq(s.storePages.id, a1Before!.id));
    expect(a1After!.draftVersion).toBe(a1Before!.draftVersion);
    const [a2After] = await db.select({ live: s.stores.publishedRevisionId }).from(s.stores).where(eq(s.stores.id, w.a.a2));
    expect(a2After!.live).toBe(a2Store!.live);
    expect((await listStoreTemplates(w.a.sellerId, w.a.a2, db))?.lastInstall?.canUndo).toBe(true);
  });

  it("undo restores the drafts from just before the apply, once", async (t) => {
    if (!(await classicV3())) return t.skip();
    expect(await undoStoreTemplate(w.a.sellerId, w.a.a2, db)).toMatchObject({ success: true });
    const after = await home(w.a.sellerId, w.a.a2);
    const sections = (after.draftContent as { sections: { id: string }[] }).sections;
    expect(sections.map((x) => x.id)).toEqual(["tallaby-hero", "extra"]);
    expect((await getStoreForEditor(w.a.sellerId, w.a.a2, db))!.designSystem.colors).toMatchObject({ primary: "#ff3366" });
    expect(await undoStoreTemplate(w.a.sellerId, w.a.a2, db)).toMatchObject({ success: false, error: "nothing_to_undo" });
  });

  it("undo keeps the product page: restores one that existed, keeps one the install created", async (t) => {
    if (!(await classicV3())) return t.skip();
    const productRows = () =>
      db
        .select({ id: s.storePages.id, draftContent: s.storePages.draftContent })
        .from(s.storePages)
        .where(and(eq(s.storePages.storeId, w.a.a2), eq(s.storePages.kind, "product")));

    // Existed before the install: its own content comes back.
    const [existing] = await productRows();
    if (existing) {
      const marker = { sections: [{ ...classicConfig().pages[0]!.content.sections[0]!, id: "seller-product-edit" }] };
      await db.update(s.storePages).set({ draftContent: marker }).where(eq(s.storePages.id, existing.id));
      expect((await applyStoreTemplate(w.a.sellerId, w.a.a2, "tallaby-classic", w.a.sellerId, OPTIONS, db)).success).toBe(true);
      expect(await undoStoreTemplate(w.a.sellerId, w.a.a2, db)).toMatchObject({ success: true });
      expect(await productRows()).toEqual([{ id: existing.id, draftContent: marker }]);
    }

    // Created by the install (a pre-feature store): undo does not delete it.
    await db.delete(s.storePages).where(and(eq(s.storePages.storeId, w.a.a2), eq(s.storePages.kind, "product")));
    expect((await applyStoreTemplate(w.a.sellerId, w.a.a2, "tallaby-classic", w.a.sellerId, OPTIONS, db)).success).toBe(true);
    const created = await productRows();
    if (!created.length) return t.skip(); // The DB Classic has no product page yet (0102 not applied).
    expect(await undoStoreTemplate(w.a.sellerId, w.a.a2, db)).toMatchObject({ success: true });
    expect(await productRows()).toEqual(created);
  });

  it("refuses foreign stores and unknown templates", async () => {
    expect(await applyStoreTemplate(w.b.sellerId, w.a.a2, "tallaby-classic", w.b.sellerId, OPTIONS, db)).toMatchObject({ error: "not_found" });
    expect(await undoStoreTemplate(w.b.sellerId, w.a.a2, db)).toMatchObject({ error: "not_found" });
    expect(await applyStoreTemplate(w.a.sellerId, w.a.a2, "no-such-template", w.a.sellerId, OPTIONS, db)).toMatchObject({ error: "template_not_found" });
    expect(await applyStoreTemplate(w.a.sellerId, w.a.a2, "Bad Key!", w.a.sellerId, OPTIONS, db)).toMatchObject({ error: "template_not_found" });
  });

  // Needs 0070 (Atelier seed) on the test database; skipped until it is applied.
  it("Atelier: creates and binds its forms, names the pages, fills in the store name; a re-apply reuses the forms", async (t) => {
    const [row] = await db.select({ id: s.templates.id }).from(s.templates).where(eq(s.templates.key, "atelier"));
    if (!row) return t.skip();
    const form = (name: string) => ({ name, fields: [{ id: "email", key: "email", type: "email" as const, label: "Email", required: true, width: "full" as const }], settings: { submitLabel: "Send", successMessage: "Thanks" } });
    const forms = { ...OPTIONS, formInput: (kind: string) => (kind === "newsletter" ? form("Atelier newsletter test") : kind === "contact" ? form("Atelier contact test") : undefined) };

    const applied = await applyStoreTemplate(w.b.sellerId, w.b.b1, "atelier", w.b.sellerId, forms, db);
    // B1 started from Tallaby Classic, which already has About, Contact and FAQ: Atelier fills those.
    expect(applied).toMatchObject({ success: true, data: { templateKey: "atelier", pagesCreated: 0 } });

    const storeForms = await db.select({ id: s.storeForms.id, name: s.storeForms.name }).from(s.storeForms).where(eq(s.storeForms.storeId, w.b.b1));
    const ids = Object.fromEntries(storeForms.map((f) => [f.name, f.id]));
    expect(ids["Atelier newsletter test"]).toBeTruthy();
    expect(ids["Atelier contact test"]).toBeTruthy();

    const editor = (await getStoreForEditor(w.b.sellerId, w.b.b1, db))!;
    const json = JSON.stringify(editor.pages.map((p) => p.draftContent));
    expect(json).toContain(ids["Atelier newsletter test"]!);
    expect(json).toContain(ids["Atelier contact test"]!);
    expect(json).not.toContain("formTemplate");
    const about = editor.pages.find((p) => p.slug === "about")!;
    // An existing page keeps its name; only its content changes.
    expect(about.name).toMatchObject({ ar: "من نحن", en: "About us" });
    const [store] = await db.select({ name: s.stores.name, header: s.stores.sharedHeader }).from(s.stores).where(eq(s.stores.id, w.b.b1));
    expect(JSON.stringify(store!.header)).toContain(store!.name);

    expect(await applyStoreTemplate(w.b.sellerId, w.b.b1, "atelier", w.b.sellerId, forms, db)).toMatchObject({ success: true });
    const again = await db.select({ id: s.storeForms.id }).from(s.storeForms).where(eq(s.storeForms.storeId, w.b.b1));
    expect(again).toHaveLength(storeForms.length);
  });
});
