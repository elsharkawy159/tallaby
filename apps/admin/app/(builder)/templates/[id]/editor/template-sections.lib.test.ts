import { describe, expect, it } from "vitest";
import type { SiteConfig } from "@workspace/store-sections";
import { getCodeTemplate, templateConfigJson } from "@workspace/store-sections/templates";
import { templateWorking, type TemplateWorking } from "./template-adapter.lib";
import { applySectionChange, categoryFits, fieldText, newSectionId, withFieldText, type TemplateSectionChange } from "./template-sections.lib";

const AHLAM = getCodeTemplate("ahlam")!;
/** The stored form: every library section a ref with no tree. */
const stored = (): SiteConfig => JSON.parse(templateConfigJson(AHLAM)) as SiteConfig;
const working = (): TemplateWorking => templateWorking(stored());
const random = () => "abc123";

function apply(w: TemplateWorking, change: TemplateSectionChange): TemplateWorking {
  const result = applySectionChange(w, change, random);
  if (!result.ok) throw new Error(`refused: ${result.error}`);
  return result.working;
}

const home = (w: TemplateWorking) => w.config.pages.find((p) => p.isHome)!.content.sections;

describe("template section changes", () => {
  it("sets one section's values and keeps it a ref with no tree", () => {
    const w = working();
    const first = home(w)[0]!;
    const next = apply(w, { kind: "section-props", slot: { page: "home" }, sectionId: first.id, props: { title: { ar: "أهلاً", en: "Hello" } } });
    const section = home(next)[0]!;
    expect(section.libraryRef).toMatchObject({ key: first.libraryRef!.key, props: { title: { ar: "أهلاً", en: "Hello" } }, corners: 18 });
    expect(section.componentTree).toBeUndefined();
    const cleared = apply(next, { kind: "section-props", slot: { page: "home" }, sectionId: first.id, props: {} });
    expect(home(cleared)[0]!.libraryRef!.props).toBeUndefined();
  });

  it("edits the header's values", () => {
    const w = working();
    const next = apply(w, { kind: "section-props", slot: { part: "header" }, sectionId: w.config.header!.id, props: { "cta.href": "/contact" } });
    expect(next.config.header!.libraryRef!.props).toEqual({ "cta.href": "/contact" });
  });

  it("refuses a value for a locked prop", () => {
    const w = working();
    const result = applySectionChange(w, { kind: "section-props", slot: { page: "home" }, sectionId: home(w)[0]!.id, props: { "title.role": "storeName" } });
    expect(result).toEqual({ ok: false, error: "invalid_config" });
  });

  it("adds, moves and removes library sections", () => {
    const w = working();
    const count = home(w).length;
    const added = apply(w, { kind: "section-add", page: "home", key: "faq-columns", category: "faq", index: 1 });
    expect(home(added)).toHaveLength(count + 1);
    expect(home(added)[1]).toMatchObject({ id: "faq-columns-abc123", sectionId: "custom-section", libraryRef: { key: "faq-columns" }, source: "faq-columns@1" });
    const moved = apply(added, { kind: "section-move", page: "home", sectionId: "faq-columns-abc123", index: 0 });
    expect(home(moved)[0]!.id).toBe("faq-columns-abc123");
    const removed = apply(moved, { kind: "section-remove", page: "home", sectionId: "faq-columns-abc123" });
    expect(home(removed).map((s) => s.id)).toEqual(home(w).map((s) => s.id));
  });

  it("keeps sections in their place: no header on a page, product-page sections only on the product page", () => {
    const w = working();
    expect(applySectionChange(w, { kind: "section-add", page: "home", key: "header-line", category: "headers", index: 0 })).toEqual({ ok: false, error: "invalid_input" });
    expect(applySectionChange(w, { kind: "section-add", page: "home", key: "pp-gallery", category: "product-page", index: 0 }).ok).toBe(false);
    expect(categoryFits("product-page", { productPage: true })).toBe(true);
    expect(categoryFits("hero", { productPage: true })).toBe(false);
    expect(categoryFits("footers", { part: "footer" })).toBe(true);
    expect(categoryFits("headers", { part: "footer" })).toBe(false);
  });

  it("replaces the header with another library header", () => {
    const w = working();
    const next = apply(w, { kind: "chrome-set", part: "header", key: "header-line", category: "headers" });
    expect(next.config.header).toMatchObject({ id: "header-line-abc123", libraryRef: { key: "header-line" } });
    expect(applySectionChange(w, { kind: "chrome-set", part: "header", key: "hero-halves", category: "hero" }).ok).toBe(false);
  });

  it("refuses unknown sections and pages", () => {
    const w = working();
    expect(applySectionChange(w, { kind: "section-remove", page: "home", sectionId: "nope" })).toEqual({ ok: false, error: "not_found" });
    expect(applySectionChange(w, { kind: "section-add", page: "nope", key: "faq-columns", category: "faq", index: 0 })).toEqual({ ok: false, error: "not_found" });
  });

  it("makes unique section ids", () => {
    let n = 0;
    const ids = ["a1", "a1", "b2"];
    expect(newSectionId("hero", new Set(["hero-a1"]), () => ids[n++]!)).toBe("hero-b2");
  });

  it("edits one language of a copy value", () => {
    expect(withFieldText(undefined, "en", "Hi", { ar: "أهلاً", en: "Hello" })).toEqual({ ar: "أهلاً", en: "Hi" });
    expect(withFieldText("نص", "ar", "نص جديد", null)).toEqual({ ar: "نص جديد", en: "نص" });
    expect(fieldText({ ar: "أ", en: "a" }, "en")).toBe("a");
    expect(fieldText(null, "ar")).toBeUndefined();
  });
});
