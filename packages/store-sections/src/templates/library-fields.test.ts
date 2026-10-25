import { describe, expect, it } from "vitest";
import { libraryRefSchema, type SectionInstance, type SiteConfig } from "../config/schema";
import { DESIGNS } from "../designs";
import type { NodeTemplate } from "../elements/tree";
import { CODE_TEMPLATES, TEMPLATE_OWN_DESIGNS, templateConfigJson } from "./catalog";
import { alignFieldNames, assignFieldNames, libraryFieldsOf, stripFieldNames } from "./library-fields";
import { applyLibraryProps, applyLibraryRef, libraryValuesFromTree, sameJson } from "./library-ref";
import { codeLibraryTree } from "./ref-config";

const node = (type: string, props: Record<string, unknown> = {}, children?: NodeTemplate[]): NodeTemplate =>
  ({ type, props, ...(children && { children }) }) as NodeTemplate;

const names = (tree: NodeTemplate): string[] => [String((tree.props as { field?: unknown }).field), ...(tree.children ?? []).flatMap(names)];

const sample = () =>
  node("section", {}, [
    node("heading", { text: "عنوان", role: "title" }),
    node("paragraph", { text: "سطر" }),
    node("paragraph", { text: "سطر تاني" }),
    node("button", { label: "تسوق", href: "/products" }),
    node("image", { src: "stock:photo:0", alt: "صورة" }),
  ]);

describe("library field names", () => {
  it("names every node in tree order from its role or type", () => {
    expect(names(assignFieldNames(sample()))).toEqual(["section", "title", "text", "text-2", "cta", "image"]);
  });

  it("is idempotent and keeps names when nodes move or are added", () => {
    const named = assignFieldNames(sample());
    expect(assignFieldNames(named)).toEqual(named);
    const [heading, first, second, button, image] = named.children!;
    const edited = { ...named, children: [node("paragraph", { text: "جديد" }), second!, heading!, first!, button!, image!] };
    expect(names(assignFieldNames(edited))).toEqual(["section", "text-3", "text-2", "title", "text", "cta", "image"]);
  });

  it("renames the later copy of a duplicated node", () => {
    const named = assignFieldNames(sample());
    const copy = named.children![3]!;
    const duplicated = { ...named, children: [...named.children!, copy] };
    expect(names(assignFieldNames(duplicated)).slice(-2)).toEqual(["image", "cta-2"]);
  });

  it("aligns a database tree with its code design where they still match", () => {
    const code = sample();
    const db = { ...code, children: [node("badge", { text: "جديد" }), ...code.children!.slice(1)] };
    expect(names(alignFieldNames(db, code))).toEqual(["section", "badge", "text", "text-2", "cta", "image"]);
    const named = alignFieldNames(db, code);
    expect(alignFieldNames(named, code)).toEqual(named);
  });

  it("every code library tree names each node once", () => {
    for (const design of [...DESIGNS, ...TEMPLATE_OWN_DESIGNS]) {
      const all = names(codeLibraryTree(design.id)!.tree);
      expect(new Set(all).size, design.id).toBe(all.length);
    }
  });

  // Templates store values by these names: a design edit that renames a field
  // drops that value in every template using it. Update only on purpose.
  it("code design field names are stable", () => {
    const all = Object.fromEntries([...DESIGNS, ...TEMPLATE_OWN_DESIGNS].map((design) => [design.id, names(codeLibraryTree(design.id)!.tree).join(" ")]));
    expect(all).toMatchSnapshot();
  });

  it("strips names", () => {
    expect(JSON.stringify(stripFieldNames(assignFieldNames(sample())))).not.toContain("field");
  });

  it("lists the form fields: copy, photos, links", () => {
    const fields = libraryFieldsOf(assignFieldNames(sample()));
    expect(fields.map((f) => [f.field, f.kind, f.prop])).toEqual([
      ["title", "text", "text"],
      ["text", "text", "text"],
      ["text-2", "text", "text"],
      ["cta", "text", "label"],
      ["image", "image", "src"],
    ]);
    expect(fields[3]!.extras).toEqual(["href"]);
    expect(fields[0]!.original).toEqual({ ar: "عنوان", en: "عنوان" });
  });
});

describe("library values (libraryRef.props)", () => {
  const tree = assignFieldNames(sample());

  it("sets copy in both languages, other props, styles, and reports unknown fields", () => {
    const { tree: built, missing } = applyLibraryProps(
      tree,
      { props: { title: { ar: "أهلاً", en: "Hello" }, "cta.href": "/contact", image: "https://cdn.test/a.jpg", "text-2": null, nope: "x" }, styles: { title: { style: { color: "accent" } } } },
      { category: "hero" },
    );
    const [heading, , second, button, image] = built.children!;
    expect(heading!.props).toMatchObject({ text: "أهلاً", translations: { en: { text: "Hello" } } });
    expect(heading!.style).toEqual({ color: "accent" });
    expect(second!.props).not.toHaveProperty("text");
    expect(button!.props).toMatchObject({ label: "تسوق", href: "/contact" });
    expect(image!.props).toMatchObject({ src: "https://cdn.test/a.jpg" });
    expect(missing).toEqual(['field "nope"']);
    expect(JSON.stringify(built)).not.toContain('"field"');
  });

  it("finds the values of a template's tree and rebuilds it exactly", () => {
    const target = applyLibraryProps(tree, { props: { title: { ar: "أهلاً", en: "Hello" }, "cta.href": "/contact" }, corners: 12 }, { category: "hero" }).tree;
    const values = libraryValuesFromTree(tree, target, { category: "hero", corners: 12 });
    expect(values).toEqual({ props: { title: { ar: "أهلاً", en: "Hello" }, "cta.href": "/contact" }, corners: 12 });
  });

  it("gives null when the structure differs", () => {
    const target = { ...stripFieldNames(tree), children: tree.children!.slice(1).map(stripFieldNames) };
    expect(libraryValuesFromTree(tree, target, { category: "hero" })).toBeNull();
  });

  it("does not store a photo that is only the slot's stock photo", () => {
    const values = libraryValuesFromTree(tree, applyLibraryProps(tree, {}, { category: "hero" }).tree, { category: "hero" });
    expect(values).toEqual({});
  });

  it("still builds the earlier patch form", () => {
    const built = applyLibraryRef(tree, { key: "x", patch: { text: { عنوان: "أهلاً" } } }, { category: "hero" }).tree;
    expect(built.children![0]!.props).toMatchObject({ text: "أهلاً" });
    expect(JSON.stringify(built)).not.toContain('"field"');
  });

  it("rejects a ref with both a patch and props, and locked props", () => {
    expect(libraryRefSchema.safeParse({ key: "x", patch: {}, props: { title: "a" } }).success).toBe(false);
    expect(libraryRefSchema.safeParse({ key: "x", props: { "title.role": "storeName" } }).success).toBe(false);
    expect(libraryRefSchema.safeParse({ key: "x", props: { title: "a", "cta.href": "/x" } }).success).toBe(true);
  });

  it("every code template stores props refs only; plain refs only for Classic and Atelier designs", () => {
    const own = new Set(TEMPLATE_OWN_DESIGNS.map((design) => design.id));
    for (const template of CODE_TEMPLATES) {
      const config = JSON.parse(templateConfigJson(template)) as SiteConfig;
      const sections = [config.header, config.footer, ...config.pages.flatMap((page) => page.content.sections)].filter((s): s is SectionInstance => s !== null);
      for (const section of sections) {
        expect(section.libraryRef, `${template.key}: ${section.id}`).toBeDefined();
        expect(section.componentTree, `${template.key}: ${section.id}`).toBeUndefined();
        expect(section.libraryRef!.patch, `${template.key}: ${section.id}`).toBeUndefined();
        expect(section.libraryRef!.plain === true, `${template.key}: ${section.id}`).toBe(own.has(section.libraryRef!.key));
      }
    }
  }, 120_000);

  it("a Classic section is its own library section, unchanged", () => {
    const row = codeLibraryTree("tallaby-hero")!;
    const built = applyLibraryRef(row.tree, { key: "tallaby-hero", plain: true }, { category: row.category }).tree;
    expect(sameJson(built, stripFieldNames(row.tree))).toBe(true);
  });
});
