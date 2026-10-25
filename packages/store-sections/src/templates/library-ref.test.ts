import { describe, expect, it } from "vitest";
import { sanitizeSiteConfig } from "../config/sanitize";
import type { SectionInstance, SiteConfig } from "../config/schema";
import { validateSiteConfig } from "../config/validate";
import type { NodeTemplate } from "../elements/tree";
import { CODE_TEMPLATES, getCodeTemplate, templateConfigJson } from "./catalog";
import { applyLibraryPatch, compactTemplateConfig, hasLibraryRefs, resolveTemplateRefs, sameJson, stripLibraryRefs, templateRefKeys, type LibraryTreeRow } from "./library-ref";
import { codeLibraryTree, storedTemplateRefConfig } from "./ref-config";

const sections = (config: SiteConfig): SectionInstance[] =>
  [config.header, config.footer, ...config.pages.flatMap((page) => page.content.sections)].filter((s): s is SectionInstance => s !== null);

const zaki = getCodeTemplate("zaki")!;
const stored = (): SiteConfig => JSON.parse(templateConfigJson(zaki)) as SiteConfig;
const full = (): SiteConfig => {
  const result = validateSiteConfig(zaki.config());
  if (!result.success) throw new Error("zaki is invalid");
  return result.data;
};

function texts(node: { props: Record<string, unknown>; children?: readonly unknown[] }): string[] {
  const own = typeof node.props.text === "string" ? [node.props.text] : [];
  return [...own, ...((node.children ?? []) as (typeof node)[]).flatMap(texts)];
}

describe("templates store library sections as refs", () => {
  it("every code template's stored form builds back exactly into its validated config", () => {
    for (const template of CODE_TEMPLATES) {
      const expected = validateSiteConfig(template.config());
      expect(expected.success, template.key).toBe(true);
      const refs = JSON.parse(templateConfigJson(template)) as SiteConfig;
      const built = validateSiteConfig(resolveTemplateRefs(refs, new Map(), { fallback: codeLibraryTree, industry: template.category }).config);
      expect(built.success && JSON.stringify(built.data) === JSON.stringify(expected.success && expected.data), template.key).toBe(true);
    }
  }, 120_000);

  it("a library-built template is stored as refs with no trees, a fraction of the size", () => {
    const config = stored();
    const refs = sections(config).filter((s) => s.libraryRef);
    expect(refs.length).toBeGreaterThan(10);
    for (const section of refs) expect(section.componentTree).toBeUndefined();
    expect(templateRefKeys(config)).toContain("header-line");
    expect(JSON.stringify(config).length * 4).toBeLessThan(JSON.stringify(full()).length);
  });

  it("an edit of a library section reaches the template, with the template's copy still swapped in", () => {
    const config = stored();
    const header = config.header!;
    const base = codeLibraryTree("header-line")!;
    const edited: NodeTemplate = { ...base.tree, style: { ...base.tree.style, paddingTop: 77 } };
    const built = resolveTemplateRefs(config, new Map([["header-line", { ...base, tree: edited }]]), { industry: zaki.category }).config.header!;
    expect(built.libraryRef).toBeUndefined();
    expect(built.componentTree![0]!.style).toMatchObject({ paddingTop: 77 });
    expect(texts(built.componentTree![0]!)).toContain("بيت زكي");
    expect(header.id).toBe(built.id);
  });

  it("is lenient with a library tree that lost what the patch names: reported, never thrown", () => {
    const base = codeLibraryTree("header-line")!;
    const { tree, missing } = applyLibraryPatch(base.tree, { text: { "no such copy": "x" }, photo: [] }, { category: base.category });
    expect(tree.type).toBe("section");
    expect(missing).toEqual(['text "no such copy"']);
    expect(() => applyLibraryPatch(base.tree, { text: { "no such copy": "x" } }, { category: base.category, strict: true })).toThrow(/no text "no such copy"/);
  });

  it("drops a ref whose key has no row and no fallback", () => {
    const config = stored();
    const result = resolveTemplateRefs(config, new Map());
    expect(result.config.header).toBeNull();
    expect(result.unknownKeys).toContain("header-line");
    expect(hasLibraryRefs(result.config)).toBe(false);
  });

  it("keeps refs for the Template Studio and stores unchanged sections as refs again, edited ones as trees", () => {
    const trees = new Map<string, LibraryTreeRow>();
    const opened = sanitizeSiteConfig(resolveTemplateRefs(stored(), trees, { fallback: codeLibraryTree, keepRefs: true, industry: zaki.category }).config);
    expect(opened.header!.libraryRef).toBeDefined();
    expect(opened.header!.componentTree).toBeDefined();

    const home = opened.pages[0]!.content.sections;
    const editedFirst = { ...home[0]!, componentTree: [{ ...home[0]!.componentTree![0]!, style: { paddingTop: 5 } }] };
    const saved = compactTemplateConfig(
      { ...opened, pages: [{ ...opened.pages[0]!, content: { ...opened.pages[0]!.content, sections: [editedFirst, ...home.slice(1)] } }, ...opened.pages.slice(1)] },
      trees,
      { fallback: codeLibraryTree, normalize: sanitizeSiteConfig, industry: zaki.category },
    );
    expect(saved.header!.componentTree).toBeUndefined();
    expect(saved.header!.libraryRef).toBeDefined();
    const [first, second] = saved.pages[0]!.content.sections;
    expect(first!.libraryRef).toBeUndefined();
    expect(first!.componentTree![0]!.style).toMatchObject({ paddingTop: 5 });
    expect(second!.libraryRef).toBeDefined();
    expect(second!.componentTree).toBeUndefined();
  });

  it("strips refs (store drafts never hold one)", () => {
    const opened = resolveTemplateRefs(stored(), new Map(), { fallback: codeLibraryTree, keepRefs: true }).config;
    expect(hasLibraryRefs(stripLibraryRefs(opened))).toBe(false);
    expect(stripLibraryRefs(stored()).header).toBeNull();
  });

  it("converts a stored (sanitized, inline) seed: only exact seed copies become refs", () => {
    const seed = full();
    const touched = { ...seed, footer: { ...seed.footer!, componentTree: [{ ...seed.footer!.componentTree![0]!, style: { paddingTop: 3 } }] } };
    const converted = storedTemplateRefConfig(touched, { industry: zaki.category, normalize: sanitizeSiteConfig });
    expect(converted.header!.libraryRef?.key).toBe("header-line");
    expect(converted.header!.componentTree).toBeUndefined();
    expect(converted.footer!.libraryRef).toBeUndefined();
    expect(converted.footer!.componentTree).toBeDefined();
    const rebuilt = sanitizeSiteConfig(resolveTemplateRefs(converted, new Map(), { fallback: codeLibraryTree, industry: zaki.category }).config);
    expect(sameJson(rebuilt, sanitizeSiteConfig(touched))).toBe(true);
    expect(sameJson(rebuilt, sanitizeSiteConfig(seed))).toBe(false);
  });
});
