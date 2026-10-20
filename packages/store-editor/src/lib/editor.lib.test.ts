import { describe, expect, it } from "vitest";
import type { PageContent, SectionInstance } from "@workspace/store-sections";
import { storeSectionRegistry } from "@workspace/store-sections/render";
import {
  addItem,
  createInstance,
  dropUnknownSections,
  duplicateSection,
  insertSection,
  moveItem,
  moveSection,
  readItemProp,
  readProp,
  removeItem,
  removeSection,
  resolveCanvasCatalog,
  setItemProp,
  setSectionProp,
} from "./editor.lib";
import { createEditorStore, hasPendingChanges } from "../state/editor.store";

const AR = { locale: "ar" as const, defaultLocale: "ar" as const };
const EN = { locale: "en" as const, defaultLocale: "ar" as const };

const faq = (): SectionInstance => ({
  id: "f1",
  sectionId: "faq",
  version: 1,
  props: { title: "أسئلة", items: [{ question: "س1", answer: "ج1" }, { question: "س2", answer: "ج2" }] },
});

describe("page operations", () => {
  const a = { id: "a", sectionId: "rich-text", version: 1, props: {} };
  const b = { id: "b", sectionId: "faq", version: 1, props: {} };
  const c = { id: "c", sectionId: "spacer", version: 1, props: {} };
  const page: PageContent = { sections: [a, b, c] };

  it("inserts, moves and removes sections immutably", () => {
    expect(moveSection(page, 0, 2).sections.map((s) => s.id)).toEqual(["b", "c", "a"]);
    expect(moveSection(page, 5, 0)).toBe(page);
    expect(insertSection(page, { ...a, id: "x" }, 1).sections.map((s) => s.id)).toEqual(["a", "x", "b", "c"]);
    expect(removeSection(page, "b").sections.map((s) => s.id)).toEqual(["a", "c"]);
    expect(page.sections.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("duplicates right after the original with a new id", () => {
    const { content, newId } = duplicateSection(page, "b");
    expect(content.sections.map((s) => s.sectionId)).toEqual(["rich-text", "faq", "faq", "spacer"]);
    expect(newId).not.toBe("b");
    expect(content.sections[2]!.id).toBe(newId);
  });

  it("creates instances from the library defaults with schema-valid ids", () => {
    const instance = createInstance(storeSectionRegistry.get("custom-section")!);
    expect(instance.id).toMatch(/^[A-Za-z0-9_:-]{1,64}$/);
    expect(instance.props).toEqual(storeSectionRegistry.get("custom-section")!.defaultProps);
    expect(instance.props).not.toBe(storeSectionRegistry.get("custom-section")!.defaultProps);
  });
});

describe("locale-aware editing", () => {
  it("writes Arabic into props and English into the overlay", () => {
    const ar = setSectionProp(faq(), "title", "أسئلة شائعة", { ...AR, translatable: true });
    expect(ar.props.title).toBe("أسئلة شائعة");
    const en = setSectionProp(ar, "title", "FAQ", { ...EN, translatable: true });
    expect(en.props.title).toBe("أسئلة شائعة");
    expect(en.translations?.en?.title).toBe("FAQ");
    expect(readProp(en, "title", { ...EN, translatable: true })).toBe("FAQ");
    expect(readProp(en, "title", { ...AR, translatable: true })).toBe("أسئلة شائعة");
  });

  it("never puts non-translatable fields in the overlay", () => {
    const en = setSectionProp(faq(), "limit", 4, { ...EN, translatable: false });
    expect(en.props.limit).toBe(4);
    expect(en.translations).toBeUndefined();
  });

  it("edits item fields per locale and keeps overlays aligned when items move or go", () => {
    let s = setItemProp(faq(), "items", 1, "question", "Q2", { ...EN, translatable: true });
    expect(readItemProp(s, "items", 1, "question", { ...EN, translatable: true })).toBe("Q2");
    expect(readItemProp(s, "items", 1, "question", { ...AR, translatable: true })).toBe("س2");
    s = moveItem(s, "items", 1, 0);
    expect((s.props.items as { question: string }[])[0]!.question).toBe("س2");
    expect((s.translations!.en!.items as { question?: string }[])[0]!.question).toBe("Q2");
    s = removeItem(s, "items", 0);
    expect(s.props.items).toEqual([{ question: "س1", answer: "ج1" }]);
    expect(s.translations!.en!.items).toEqual([{}]);
    expect(addItem(s, "items", { question: "", answer: "" }, 1)).toBe(s);
  });
});

describe("canvas catalog", () => {
  const catalog = {
    products: [
      { id: "p1", title: { ar: "أ", en: "A" }, slug: "a", image: null, price: 10, compareAtPrice: null, isFeatured: true, categoryId: "c1", inStock: true, createdAt: "", rating: null, sold90: 0, sold14: 0 },
      { id: "p2", title: { ar: "ب", en: "B" }, slug: "b", image: null, price: 20, compareAtPrice: null, isFeatured: false, categoryId: "c2", inStock: true, createdAt: "", rating: null, sold90: 0, sold14: 0 },
    ],
    categories: [{ id: "c1", name: { ar: "قسم", en: "Cat" }, image: null, productCount: 1 }],
  };

  it("answers each section like the storefront resolver", () => {
    const result = resolveCanvasCatalog(
      {
        newest: { kind: "products", source: "newest", limit: 1 },
        featured: { kind: "products", source: "featured", limit: 8 },
        category: { kind: "products", source: "category", categoryId: "c2", limit: 8 },
        picked: { kind: "products", source: "selected", productIds: ["p2", "x", "p1"], limit: 3 },
      },
      catalog,
      "en",
    );
    expect(result.products.newest!.map((p) => p.id)).toEqual(["p1"]);
    expect(result.products.featured!.map((p) => p.id)).toEqual(["p1"]);
    expect(result.products.category!.map((p) => p.title)).toEqual(["B"]);
    expect(result.products.picked!.map((p) => p.id)).toEqual(["p2", "p1"]);
    expect(result.categories[0]!.name).toBe("Cat");
  });
});

describe("editor store", () => {
  const make = () =>
    createEditorStore({
      pages: [{ id: "home", slug: "home", isHome: true, name: { ar: "الرئيسية" }, seo: {}, showInNav: true, content: { sections: [] }, version: 1 }],
      header: null,
      footer: null,
      designSystem: { colors: {}, typography: {}, spacing: {} },
      designVersion: 0,
      chromeVersion: 1,
      defaultLocale: "ar",
    });

  it("tracks dirty pages and undoes/redoes edits", () => {
    const store = make();
    const instance = createInstance(storeSectionRegistry.get("custom-section")!);
    store.getState().editPage("home", (c) => insertSection(c, instance));
    expect(store.getState().pages[0]!.content.sections).toHaveLength(1);
    expect(hasPendingChanges(store.getState())).toBe(true);
    store.getState().undo();
    expect(store.getState().pages[0]!.content.sections).toHaveLength(0);
    store.getState().redo();
    expect(store.getState().pages[0]!.content.sections).toHaveLength(1);
  });

  it("only clears a page after a save of its current content", () => {
    const store = make();
    store.getState().editPage("home", (c) => insertSection(c, createInstance(storeSectionRegistry.get("custom-section")!)));
    const saved = store.getState().pages[0]!.content;
    store.getState().editPage("home", (c) => insertSection(c, createInstance(storeSectionRegistry.get("custom-section")!)));
    store.getState().markPageSaved("home", 2, saved);
    expect(store.getState().dirtyPages.home).toBe(true);
    expect(store.getState().pages[0]!.version).toBe(2);
    store.getState().markPageSaved("home", 3, store.getState().pages[0]!.content);
    expect(hasPendingChanges(store.getState())).toBe(false);
  });
});

describe("dropUnknownSections", () => {
  const allowed = storeSectionRegistry.allowedSections();
  const tree: SectionInstance = { id: "t1", sectionId: "custom-section", version: 1, props: {} };
  const legacy = (id: string, sectionId: string): SectionInstance => ({ id, sectionId, version: 1, props: {} });

  it("removes sections the registry no longer has and marks what changed", () => {
    const pages = [
      { id: "p1", content: { sections: [legacy("a", "hero-split"), tree, legacy("b", "classic-hero")] } },
      { id: "p2", content: { sections: [tree] } },
    ];
    const result = dropUnknownSections({ pages, header: legacy("h", "classic-header"), footer: null }, allowed);
    expect(result.pages[0]!.content.sections.map((s) => s.id)).toEqual(["t1"]);
    expect(result.pages[1]).toBe(pages[1]);
    expect(result.header).toBeNull();
    expect(result.dirtyPages).toEqual({ p1: true });
    expect(result.dirtyChrome).toEqual({ header: true });
    expect(result.dropped).toBe(3);
  });

  it("leaves clean drafts untouched", () => {
    const pages = [{ id: "p1", content: { sections: [tree] } }];
    const result = dropUnknownSections({ pages, header: null, footer: tree }, allowed);
    expect(result.pages[0]).toBe(pages[0]);
    expect(result.footer).toBe(tree);
    expect(result.dropped).toBe(0);
  });
});
