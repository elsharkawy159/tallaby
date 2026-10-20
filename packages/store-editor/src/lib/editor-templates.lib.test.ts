import { describe, expect, it } from "vitest";
import type { PageContent } from "@workspace/store-sections";
import type { TemplateCardView } from "../templates.dto";
import { createEditorCommands } from "./editor-commands.lib";
import { allTemplatePages, instantiateTemplatePage, templatePagesFor } from "./editor-templates.lib";
import { createEditorStore } from "../state/editor.store";

const card = (key: string, pages: [slug: string, isHome?: boolean][], extra: Partial<TemplateCardView> = {}): TemplateCardView => ({
  key,
  name: { en: key },
  description: {},
  category: "general",
  thumbnailUrl: null,
  isDefault: false,
  isPremium: false,
  palette: [],
  formKinds: [],
  version: 1,
  pages: pages.map(([slug, isHome = false]) => ({ slug, isHome, name: slug, sections: [] })),
  ...extra,
});

// Template A: home, about, contact · B: home, about, services · C: home, about, contact, faq.
const catalog = [
  card("a", [["home", true], ["about"], ["contact"]]),
  card("b", [["home", true], ["about"], ["services"]]),
  card("c", [["home", true], ["about"], ["contact"], ["faq"]]),
  card("paid", [["home", true], ["about"]], { isPremium: true }),
];
const keys = (options: ReturnType<typeof templatePagesFor>) => options.map((o) => `${o.template.key}:${o.page.slug}`);

describe("template pages for a page", () => {
  it("matches /about, /contact and the home page; premium templates are left out", () => {
    expect(keys(templatePagesFor(catalog, { slug: "about", isHome: false }))).toEqual(["a:about", "b:about", "c:about"]);
    expect(keys(templatePagesFor(catalog, { slug: "contact", isHome: false }))).toEqual(["a:contact", "c:contact"]);
    expect(keys(templatePagesFor(catalog, { slug: "", isHome: true }))).toEqual(["a:home", "b:home", "c:home"]);
  });

  it("does not invent aliases, and is empty when nothing matches", () => {
    expect(templatePagesFor(catalog, { slug: "about-us", isHome: false })).toEqual([]);
    expect(templatePagesFor(catalog, { slug: "blog", isHome: false })).toEqual([]);
    // A template page with the home slug is not a match for a normal page called "home".
    expect(templatePagesFor(catalog, { slug: "home", isHome: false })).toEqual([]);
    expect(allTemplatePages(catalog)).toHaveLength(10);
  });
});

const templateContent = (): PageContent => ({
  sections: [
    { id: "t-hero", sectionId: "hero-banner", version: 1, props: { title: "Hello" } },
    {
      id: "t-custom",
      sectionId: "custom-section",
      version: 1,
      props: {},
      componentTree: [{ id: "t-n1", type: "vFlex", props: {}, children: [{ id: "t-n2", type: "heading", props: { text: "Hi" }, children: [] }] }],
    },
    { id: "t-header", sectionId: "store-header", version: 1, props: {} },
  ],
  elementStyles: { "t-n2": { color: "primary" }, other: { color: "muted" } },
});

describe("instantiating a template page", () => {
  it("copies with new ids, drops removed and header/footer sections and leaves the template untouched", () => {
    const original = templateContent();
    const before = JSON.stringify(original);
    let i = 0;
    const copy = instantiateTemplatePage(original, () => `s${i++}`, () => `n${i++}`);
    expect(JSON.stringify(original)).toBe(before);
    // hero-banner and store-header were coded sections; they are gone from the registry.
    expect(copy.sections.map((s) => s.sectionId)).toEqual(["custom-section"]);
    expect(copy.sections.map((s) => s.id).some((id) => id.startsWith("t-"))).toBe(false);
    const tree = copy.sections[0]!.componentTree!;
    expect(tree[0]!.id).not.toBe("t-n1");
    expect(tree[0]!.children[0]!.id).not.toBe("t-n2");
    expect(Object.keys(copy.elementStyles!)).toEqual([tree[0]!.children[0]!.id, "other"]);
    // Deep copy: editing the copy can't reach the template.
    tree[0]!.children[0]!.props.text = "Changed";
    expect(original.sections[1]!.componentTree![0]!.children[0]!.props.text).toBe("Hi");
  });
});

describe("applying a template page", () => {
  it("changes only the target page; other pages, header, footer and design stay", () => {
    const header = { id: "hdr", sectionId: "store-header", version: 1, props: { logo: "x" } };
    const designSystem = { colors: { primary: "#111111" }, typography: {}, spacing: {} };
    const home: PageContent = { sections: [{ id: "home-hero", sectionId: "hero-banner", version: 1, props: {} }] };
    const store = createEditorStore({
      pages: [
        { id: "home", slug: "", isHome: true, name: { ar: "الرئيسية" }, seo: {}, showInNav: true, content: home, version: 1 },
        { id: "about", slug: "about", isHome: false, name: { ar: "من نحن" }, seo: {}, showInNav: true, content: { sections: [] }, version: 1 },
      ],
      header,
      footer: null,
      designSystem,
      designVersion: 1,
      defaultLocale: "ar",
    });
    const commands = createEditorCommands(store);
    expect(commands.applyTemplatePage("about", templateContent())).toBe(true);
    const state = store.getState();
    expect(state.pages[0]!.content).toBe(home);
    expect(state.pages[1]!.content.sections.map((s) => s.sectionId)).toEqual(["custom-section"]);
    expect(state.header).toBe(header);
    expect(state.designSystem).toBe(designSystem);
    expect(state.dirtyPages).toEqual({ about: true });
    expect(state.dirtyChrome).toEqual({});
    expect(state.dirtyDesign).toBe(false);
    // One undo step puts the page back.
    state.undo();
    expect(store.getState().pages[1]!.content.sections).toEqual([]);
  });
});
