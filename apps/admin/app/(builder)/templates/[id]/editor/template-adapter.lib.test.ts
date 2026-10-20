import { describe, expect, it } from "vitest";
import { validateSiteConfig, type SiteConfig } from "@workspace/store-sections";
import { storeSectionRegistry } from "@workspace/store-sections/render";
import { getCodeTemplate, templateMeta } from "@workspace/store-sections/templates";
import {
  applyEditorChange,
  siteConfigToEditorInitial,
  templatePageId,
  templateWorking,
  type TemplateWorking,
} from "./template-adapter.lib";

const CLASSIC = getCodeTemplate("tallaby-classic")!;
const meta = templateMeta(CLASSIC);

function config(): SiteConfig {
  const result = validateSiteConfig(CLASSIC.config(), { allowedSections: storeSectionRegistry.allowedSections() });
  if (!result.success) throw new Error("Classic does not validate");
  return result.data;
}

function blank(): SiteConfig {
  return {
    schemaVersion: config().schemaVersion,
    designSystem: { colors: {}, typography: {}, spacing: {} },
    header: null,
    footer: null,
    settings: { defaultLocale: "en", locales: ["en", "ar"] },
    pages: [{ slug: "home", isHome: true, name: "الرئيسية", showInNav: true, seo: {}, content: { sections: [] } }],
  };
}

const valid = (c: SiteConfig) => validateSiteConfig(c, { allowedSections: storeSectionRegistry.allowedSections() }).success;

function apply(working: TemplateWorking, change: Parameters<typeof applyEditorChange>[1]): TemplateWorking {
  const result = applyEditorChange(working, change);
  if (!result.ok) throw new Error(`refused: ${result.error}`);
  expect(valid(result.working.config)).toBe(true);
  return result.working;
}

describe("siteConfigToEditorInitial", () => {
  it("maps every page to page:<slug> with the draft version, localized names from meta and the demo catalog", () => {
    const c = config();
    const initial = siteConfigToEditorInitial(c, meta, 7);
    expect(initial.pages.map((p) => p.id)).toEqual(c.pages.map((p) => templatePageId(p.slug)));
    expect(initial.pages.every((p) => p.version === 7)).toBe(true);
    const home = initial.pages.find((p) => p.isHome)!;
    expect(home.name).toEqual(meta.pageNames.home);
    expect(home.content).toEqual(c.pages.find((p) => p.isHome)!.content);
    expect(initial.header).toEqual(c.header);
    expect(initial.footer).toEqual(c.footer);
    expect(initial.designSystem).toEqual(c.designSystem);
    expect(initial.catalog.products).toEqual(meta.demo.products);
    expect(initial.catalog.categories).toEqual(meta.demo.categories);
    expect(initial.defaultLocale).toBe(c.settings.defaultLocale);
    expect(initial.locales).toEqual(c.settings.locales);
  });

  it("takes the locales from the config's settings and falls back to the stored page name", () => {
    const initial = siteConfigToEditorInitial(blank(), { ...meta, pageNames: {} }, 1);
    expect(initial.defaultLocale).toBe("en");
    expect(initial.locales).toEqual(["en", "ar"]);
    expect(initial.pages[0]!.name).toEqual({ ar: "الرئيسية", en: "الرئيسية" });
  });
});

describe("applyEditorChange", () => {
  it("round-trips the editor's page content, design system and chrome into the expected SiteConfig", () => {
    const c = config();
    const initial = siteConfigToEditorInitial(c, meta, 1);
    let working = templateWorking(c);
    // Unchanged content round-trips to the same config.
    for (const page of initial.pages) working = apply(working, { kind: "page", pageId: page.id, content: page.content });
    expect(working.config).toEqual(c);

    const home = initial.pages.find((p) => p.isHome)!;
    const content = { ...home.content, sections: home.content.sections.slice(1) };
    working = apply(working, { kind: "page", pageId: home.id, content });
    const designSystem = { ...c.designSystem, colors: { ...c.designSystem.colors, primary: "#112233" } };
    working = apply(working, { kind: "design", designSystem });
    working = apply(working, { kind: "chrome", part: "header", instance: null });
    working = apply(working, { kind: "chrome", part: "footer", instance: c.header });

    const expected: SiteConfig = {
      ...c,
      designSystem,
      header: null,
      footer: c.header,
      pages: c.pages.map((p) => (p.isHome ? { ...p, content } : p)),
    };
    expect(working.config).toEqual(expected);
  });

  it("creates, updates, reorders and removes pages", () => {
    let working = templateWorking(blank());
    const created = applyEditorChange(working, { kind: "pages", op: "create", name: { en: "About" }, slug: "about" });
    if (!created.ok) throw new Error(created.error);
    expect(created.page).toEqual({ id: "page:about", slug: "about" });
    working = created.working;
    expect(valid(working.config)).toBe(true);
    expect(working.config.pages[1]).toMatchObject({ slug: "about", isHome: false, name: "About", showInNav: true, content: { sections: [] } });

    working = apply(working, { kind: "pages", op: "update", pageId: "page:about", name: { ar: "من نحن", en: "About" }, showInNav: false, seo: { title: "About us" } });
    expect(working.config.pages[1]).toMatchObject({ name: "من نحن", showInNav: false, seo: { title: "About us" } });

    working = apply(working, { kind: "pages", op: "reorder", pageIds: ["page:about", "page:home"] });
    expect(working.config.pages.map((p) => p.slug)).toEqual(["about", "home"]);

    working = apply(working, { kind: "pages", op: "remove", pageId: "page:about" });
    expect(working.config).toEqual(blank());
    expect(working.pageIds).toEqual({ "page:home": "home" });
  });

  it("keeps a renamed page addressable by its editor id", () => {
    let working = templateWorking(blank());
    working = apply(working, { kind: "pages", op: "create", name: { ar: "عنا" }, slug: "about" });
    working = apply(working, { kind: "pages", op: "update", pageId: "page:about", slug: "about-us" });
    expect(working.config.pages[1]!.slug).toBe("about-us");
    expect(working.pageIds["page:about"]).toBe("about-us");

    const content = { sections: [] as never[], elementStyles: { x: { color: "red" } } };
    working = apply(working, { kind: "page", pageId: "page:about", content });
    expect(working.config.pages[1]!.content).toEqual(content);

    // A new page on the old slug gets its own editor id.
    const again = applyEditorChange(working, { kind: "pages", op: "create", name: { ar: "عن" }, slug: "about" });
    if (!again.ok) throw new Error(again.error);
    expect(again.page!.id).not.toBe("page:about");
    expect(again.working.pageIds[again.page!.id]).toBe("about");
    expect(again.working.pageIds["page:about"]).toBe("about-us");
  });

  it("refuses to remove the home page", () => {
    expect(applyEditorChange(templateWorking(blank()), { kind: "pages", op: "remove", pageId: "page:home" })).toEqual({ ok: false, error: "home_page" });
  });

  it("refuses a duplicate slug on create and on rename", () => {
    let working = templateWorking(blank());
    expect(applyEditorChange(working, { kind: "pages", op: "create", name: { ar: "ب" }, slug: "home" })).toEqual({ ok: false, error: "slug_taken" });
    working = apply(working, { kind: "pages", op: "create", name: { ar: "أ" }, slug: "a" });
    working = apply(working, { kind: "pages", op: "create", name: { ar: "ب" }, slug: "b" });
    expect(applyEditorChange(working, { kind: "pages", op: "update", pageId: "page:b", slug: "a" })).toEqual({ ok: false, error: "slug_taken" });
  });

  it("refuses bad slugs, unknown pages, invalid content and an incomplete reorder", () => {
    const working = templateWorking(blank());
    expect(applyEditorChange(working, { kind: "pages", op: "create", name: { ar: "x" }, slug: "Bad Slug" })).toEqual({ ok: false, error: "invalid_slug" });
    expect(applyEditorChange(working, { kind: "pages", op: "create", name: { ar: "x" }, slug: "cart" })).toEqual({ ok: false, error: "reserved_slug" });
    expect(applyEditorChange(working, { kind: "page", pageId: "page:nope", content: { sections: [] } })).toEqual({ ok: false, error: "not_found" });
    expect(applyEditorChange(working, { kind: "page", pageId: "page:home", content: { sections: [{ id: "x", sectionId: "rawHtml", version: 1 }] } })).toEqual({
      ok: false,
      error: "invalid_config",
    });
    expect(applyEditorChange(working, { kind: "pages", op: "reorder", pageIds: [] })).toEqual({ ok: false, error: "invalid_input" });
  });

  it("does not mutate the working state it was given", () => {
    const working = templateWorking(blank());
    const before = structuredClone(working);
    apply(working, { kind: "pages", op: "create", name: { ar: "أ" }, slug: "a" });
    apply(working, { kind: "design", designSystem: { colors: { primary: "#000000" }, typography: {}, spacing: {} } });
    expect(working).toEqual(before);
  });
});
