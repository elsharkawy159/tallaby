import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CODE_TEMPLATES,
  TOP_BAR_PROP,
  drawChrome,
  flushHeaderOnMobile,
  mobileMenuRows,
  sanitizeSiteConfig,
  validatePageContent,
  type ComponentNode,
  type SectionInstance,
  type SiteConfig,
} from "@workspace/store-sections";
import { applySectionOps, codeSectionInstance } from "@workspace/store-sections/agent";
import { SITE_ROOT_CLASS, SectionRenderer, collectPageCss, codeCssTargets, findNode, getDesign, instantiateDesign, storeSectionRegistry, type RenderContext } from "@workspace/store-sections/render";
import { createEditorStore } from "../state/editor.store";
import { starterCodeProps } from "../code/code-file.lib";
import { createEditorCommands } from "./editor-commands.lib";
import { canMoveAboveHeader, sectionToTopBar, topBarRowIds, topBarRowOf, topBarToSection } from "./top-bar.lib";

const classicHeader = () => CODE_TEMPLATES.find((t) => t.key === "tallaby-classic")!.config().header!;
const marquee = (id = "s-top") => instantiateDesign(getDesign("promo-marquee")!, { id });
const rootOf = (header: SectionInstance) => header.componentTree![0]!;
let n = 0;
const deps = (taken: string[] = []) => ({ sectionTaken: (id: string) => taken.includes(id), makeSectionId: () => `s-new-${n++}`, makeNodeId: () => `n-new-${n++}` });

function ids(nodes: readonly ComponentNode[]): string[] {
  return nodes.flatMap((node) => [node.id, ...ids(node.children)]);
}
function fields(nodes: readonly ComponentNode[]): unknown[] {
  return nodes.flatMap((node) => [node.props.field, ...fields(node.children)]);
}

describe("moving a section above the header", () => {
  it("puts a tree section first in the header, as a Box row, with its ids, fields and styles", () => {
    const header = classicHeader();
    const section = marquee();
    const before = rootOf(header).children.map((c) => c.id);
    const next = sectionToTopBar(section, header)!;
    const row = rootOf(next).children[0]!;
    const source = section.componentTree![0]!;
    expect(row.id).toBe(source.id);
    expect(row.type).toBe("div");
    expect(rootOf(next).children.slice(1).map((c) => c.id)).toEqual(before);
    // Every element keeps its id, field name, style and device styles.
    expect(ids([row])).toEqual(ids(section.componentTree!));
    expect(fields([row])).toEqual(fields(section.componentTree!));
    expect(row.style).toEqual(source.style);
    expect(row.breakpointStyles).toEqual(source.breakpointStyles);
    expect(row.children).toEqual(source.children);
    expect(row.props[TOP_BAR_PROP]).toEqual({ id: section.id, source: section.source });
    // Its root's other props stay (name, translations, motion marker).
    const { [TOP_BAR_PROP]: _origin, ...props } = row.props;
    expect(props).toEqual(source.props);
    // Nothing else in the header changes.
    expect({ ...next, componentTree: undefined }).toEqual({ ...header, componentTree: undefined });
    expect(header).toEqual(classicHeader());
  });

  it("moves the section's own custom CSS onto the row and keeps the row's", () => {
    const section = marquee();
    const withCss: SectionInstance = {
      ...section,
      customCss: ".a { color: red; }",
      componentTree: [{ ...section.componentTree![0]!, customCss: ".b { color: blue; }" }],
    };
    const row = rootOf(sectionToTopBar(withCss, classicHeader())!).children[0]!;
    expect(row.customCss).toBe(".a { color: red; }\n.b { color: blue; }");
    // Over the cap together: refused, nothing is cut.
    const big = { ...withCss, customCss: "a{}".padEnd(8 * 1024, " ") + "x" };
    expect(sectionToTopBar(big, classicHeader())).toBeNull();
  });

  it("moves a code section, which still finds its CSS and code in the header", () => {
    const made = codeSectionInstance(starterCodeProps(), { sectionId: "s-code", codeNodeId: "n-code", makeNodeId: () => `n-${n++}` })!;
    const next = sectionToTopBar(made.instance, classicHeader())!;
    expect(findNode(rootOf(next).children[0]!.children, "n-code")?.type).toBe("code");
    // Its CSS is scoped by its node id, so it applies wherever the node is drawn (the header too).
    expect(codeCssTargets([next], { codeNodes: true }).map((t) => t.scope)).toContain(`.${SITE_ROOT_CLASS} [data-node-id="n-code"]`);
    expect(validatePageContent({ sections: [next] }).success).toBe(true);
    // And it goes back to the page as the same code section.
    expect(topBarToSection(next, made.instance.componentTree![0]!.id, deps())!.section).toEqual(made.instance);
  });

  it("keeps section-level motion for the way back, and refuses what a row can't show", () => {
    const section: SectionInstance = { ...marquee(), style: { shell: { scrollEffect: "reveal-scrub", animation: "fade" } } };
    const row = rootOf(sectionToTopBar(section, classicHeader())!).children[0]!;
    expect((row.props[TOP_BAR_PROP] as { style?: unknown }).style).toEqual({ shell: { scrollEffect: "reveal-scrub", animation: "fade" } });
    // A section background, colours or device styles live outside the tree: they would be lost.
    expect(canMoveAboveHeader({ ...marquee(), style: { background: "accent" } }, classicHeader())).toBe(false);
    expect(canMoveAboveHeader({ ...marquee(), style: { shell: { scheme: "dark" } } }, classicHeader())).toBe(false);
    expect(canMoveAboveHeader({ ...marquee(), breakpointStyles: { mobile: { paddingTop: 4 } } }, classicHeader())).toBe(false);
    // Not a tree section, no header, or a header with no root section.
    expect(canMoveAboveHeader({ id: "x", sectionId: "hero-banner", version: 1, props: {} }, classicHeader())).toBe(false);
    expect(canMoveAboveHeader(marquee(), null)).toBe(false);
    expect(canMoveAboveHeader(marquee(), { ...classicHeader(), componentTree: [{ id: "r", type: "hFlex", props: {}, children: [] }] })).toBe(false);
    // An element id the header already uses.
    const header = classicHeader();
    const clash = { ...marquee(), componentTree: [{ ...marquee().componentTree![0]!, id: rootOf(header).children[0]!.id }] };
    expect(canMoveAboveHeader(clash, header)).toBe(false);
  });

  it("passes the chrome save's validation and survives sanitizing unchanged", () => {
    const next = sectionToTopBar(marquee(), classicHeader())!;
    const validated = validatePageContent({ sections: [next] });
    expect(validated.success).toBe(true);
    const saved = validated.success ? validated.data.sections[0]! : null;
    expect(rootOf(saved!).children[0]).toEqual(rootOf(flushHeaderOnMobile(next)).children[0]);
    const config = { ...CODE_TEMPLATES[0]!.config(), header: next } as SiteConfig;
    expect(rootOf(sanitizeSiteConfig(config).header!).children[0]!.props[TOP_BAR_PROP]).toEqual({ id: "s-top", source: marquee().source });
  });
});

describe("moving a header top row back to the page", () => {
  it("brings a moved section back as it was", () => {
    const section: SectionInstance = { ...marquee(), style: { shell: { scrollEffect: "reveal-scrub" } } };
    const header = classicHeader();
    const next = sectionToTopBar(section, header)!;
    const rowId = section.componentTree![0]!.id;
    expect(topBarRowIds(next)[0]).toBe(rowId);
    // An element inside the row resolves to the row.
    expect(topBarRowOf(next, section.componentTree![0]!.children[0]!.id)).toBe(rowId);
    const back = topBarToSection(next, rowId, deps())!;
    expect(back.section).toEqual(section);
    expect(back.header).toEqual(header);
    // The old id is taken on this page: a new one.
    expect(topBarToSection(next, rowId, deps([section.id]))!.section.id).not.toBe(section.id);
  });

  it("takes a template's announcement bar into a new section with no padding", () => {
    const header = classicHeader();
    const [bar] = topBarRowIds(header);
    expect(bar).toBeDefined();
    const announcement = findNode(header.componentTree!, bar!)!;
    const back = topBarToSection(header, bar!, deps())!;
    const root = back.section.componentTree![0]!;
    expect(root.type).toBe("section");
    expect(root.style).toEqual({ paddingTop: 0, paddingBottom: 0 });
    expect(root.children).toEqual([announcement]);
    expect(findNode(back.header.componentTree!, bar!)).toBeNull();
    expect(validatePageContent({ sections: [back.section] }).success).toBe(true);
    // The bar itself (the logo's row) and the rows after it never move.
    const rows = rootOf(header).children.map((c) => c.id);
    expect(topBarRowIds(header)).toEqual(rows.slice(0, rows.indexOf(bar!) + 1));
    for (const id of rows.slice(1)) expect(topBarToSection(header, id, deps())).toBeNull();
  });
});

describe("editor commands: above the header and back", () => {
  function setup() {
    const section = marquee();
    const store = createEditorStore({
      pages: [{ id: "p1", slug: "", isHome: true, name: { ar: "الرئيسية" }, seo: {}, showInNav: true, content: { sections: [section, marquee("s-other")] }, version: 1 }],
      header: classicHeader(),
      footer: null,
      designSystem: { colors: {}, typography: {}, spacing: {} },
      designVersion: 1,
      chromeVersion: 1,
      defaultLocale: "ar",
    });
    return { store, commands: createEditorCommands(store), section, page: () => store.getState().pages[0]!.content };
  }

  it("moves the section in one undo step that restores both the page and the header, and redoes it", () => {
    const { store, commands, section, page } = setup();
    const header = store.getState().header;
    store.getState().select({ target: "page", sectionId: section.id });
    expect(commands.aboveHeaderTarget()).toBe(section.id);
    expect(commands.moveSectionAboveHeader(section.id)).toBe(true);
    expect(page().sections.map((s) => s.id)).toEqual(["s-other"]);
    expect(rootOf(store.getState().header!).children[0]!.id).toBe(section.componentTree![0]!.id);
    // The moved row is selected, and both the page and the header will save.
    expect(store.getState().selection).toEqual({ target: "header", nodeId: section.componentTree![0]!.id });
    expect(store.getState().dirtyPages).toEqual({ p1: true });
    expect(store.getState().dirtyChrome).toEqual({ header: true });
    expect(store.getState().past).toHaveLength(1);
    expect(commands.toPageTarget()).toBe(section.componentTree![0]!.id);

    store.getState().undo();
    expect(page().sections.map((s) => s.id)).toEqual([section.id, "s-other"]);
    expect(store.getState().header).toBe(header);
    store.getState().redo();
    expect(page().sections.map((s) => s.id)).toEqual(["s-other"]);
    expect(rootOf(store.getState().header!).children[0]!.id).toBe(section.componentTree![0]!.id);
  });

  it("moves it back to the top of the page with Move to page, one undo step", () => {
    const { store, commands, section, page } = setup();
    commands.moveSectionAboveHeader(section.id);
    const moved = store.getState().header;
    expect(commands.moveTopBarToPage(section.componentTree![0]!.id)).toBe(true);
    expect(page().sections[0]).toEqual(section);
    expect(page().sections.map((s) => s.id)).toEqual([section.id, "s-other"]);
    expect(store.getState().header).toEqual(classicHeader());
    expect(store.getState().selection).toEqual({ target: "page", sectionId: section.id });
    store.getState().undo();
    expect(store.getState().header).toBe(moved);
    expect(page().sections.map((s) => s.id)).toEqual(["s-other"]);
  });

  it("refuses with nothing changed when the section can't go there or the page is full", () => {
    const { store, commands, section } = setup();
    store.getState().editSection({ target: "page", sectionId: section.id }, (i) => ({ ...i, style: { background: "accent" } }));
    const past = store.getState().past.length;
    expect(commands.moveSectionAboveHeader(section.id)).toBe(false);
    expect(store.getState().past).toHaveLength(past);
    const full = createEditorStore({ ...store.getState(), maxSections: 2 });
    const fullCommands = createEditorCommands(full);
    const [bar] = topBarRowIds(full.getState().header);
    expect(fullCommands.moveTopBarToPage(bar!)).toBe(false);
  });
});

describe("the storefront header with a top bar", () => {
  const ctx: RenderContext = {
    mode: "public",
    locale: "ar",
    dir: "rtl",
    store: { name: "متجر", url: "https://s.tallaby.com" },
    pages: [{ name: "الرئيسية", href: "/", isHome: true }],
    catalog: { products: {}, categories: [] },
    Link: ({ href, className, children }) => (
      <a href={href} className={className}>
        {children}
      </a>
    ),
    imageUrl: (src) => src ?? null,
    formatPrice: (value) => `${value} EGP`,
  };
  const draw = (header: SectionInstance) => drawChrome(flushHeaderOnMobile(header), "header", { translated: true, hasLogo: true, locale: "ar" })!;

  it("draws the moved row first, above the bar, untouched by the header's drawn pieces", () => {
    const header = classicHeader();
    const section = marquee();
    const rowId = section.componentTree![0]!.id;
    const next = sectionToTopBar(section, header)!;
    const drawn = draw(next);
    const plain = draw(header);
    expect(rootOf(drawn).children[0]).toEqual(rootOf(next).children[0]);
    // The rest of the header is drawn exactly as without the top bar (phone burger, bar, tools).
    expect(rootOf(drawn).children.slice(1)).toEqual(rootOf(plain).children);
    expect(mobileMenuRows(next, "ar")).toEqual(mobileMenuRows(header, "ar"));
    // Not hidden on phones (only rows after the bar are).
    expect(rootOf(drawn).children[0]!.breakpointStyles?.mobile?.hidden).toBeUndefined();

    const html = renderToStaticMarkup(<SectionRenderer instance={drawn} registry={storeSectionRegistry} ctx={ctx} />);
    const rowAt = html.indexOf(`data-node-id="${rowId}"`);
    const logo = ids(header.componentTree!).find((id) => findNode(header.componentTree!, id)!.props.role === "logo")!;
    const logoAt = html.indexOf(`data-node-id="${logo}"`);
    // Above the header's bar on desktop, and above the phone burger (drawn for phones only).
    const burgerAt = html.indexOf(`data-node-id="${header.id}-mobile-menu"`);
    expect(rowAt).toBeGreaterThan(-1);
    expect(logoAt).toBeGreaterThan(rowAt);
    expect(burgerAt).toBeGreaterThan(rowAt);
    // The marquee still loops publicly.
    expect(html).toContain("data-marquee-track");
    // Its styles are drawn with the header (desktop and phone padding of the row).
    const css = collectPageCss([drawn]);
    expect(css).toContain(`[data-node-id="${rowId}"]`);
  });

});

describe("the editor AI agent and a header holding a top bar", () => {
  it("keeps the header locked as a whole and still edits the moved row's elements", () => {
    const section = marquee();
    const header = sectionToTopBar(section, classicHeader())!;
    const text = ids(section.componentTree!).find((id) => typeof findNode(section.componentTree!, id)!.props.text === "string")!;
    const { content, applied, rejected } = applySectionOps(
      { sections: [header] },
      [
        { op: "set_text", sectionId: header.id, nodeId: text, prop: "text", ar: "عرض جديد" },
        { op: "remove_section", sectionId: header.id },
        { op: "move_section", sectionId: header.id, to: 0 },
      ],
      { target: { kind: "header", sectionId: header.id }, defaultLocale: "ar", allowCode: true },
    );
    expect(applied).toHaveLength(1);
    expect(rejected.map((r) => r.code)).toEqual(["chrome_locked", "chrome_locked"]);
    const row = rootOf(content.sections[0]!).children[0]!;
    expect(findNode([row], text)!.props.text).toBe("عرض جديد");
    // The row is still a moved section: it can go back to the page.
    expect(row.props[TOP_BAR_PROP]).toEqual({ id: section.id, source: section.source });
  });
});
