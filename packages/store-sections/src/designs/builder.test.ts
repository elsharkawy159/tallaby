import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../config/schema";
import { defineDesign, instantiateDesign, type Design } from "./builder";

const L = (ar: string, en: string) => ({ ar, en });

const sample: Design = defineDesign({
  id: "sample",
  version: 2,
  category: "statistics",
  subcategory: "counters",
  name: L("عينة", "Sample"),
  description: L("وصف", "Description"),
  keywords: ["sample"],
  tree: (t) =>
    t.section({ label: L("القسم", "Section"), style: { background: "secondary" } }, [
      t.grid([t.card([t.heading(L("مرحبا", "Hello"), "h2", { role: "title" }), t.button(L("تسوّق", "Shop"), "/#products")])], {
        label: L("الشبكة", "Grid"),
        columns: { desktop: 4, tablet: 2, mobile: 1 },
        style: { gap: 16 },
      }),
    ]),
});

const walk = (nodes: ComponentNode[]): ComponentNode[] => nodes.flatMap((n) => [n, ...walk(n.children)]);
const byType = (nodes: ComponentNode[], type: string) => walk(nodes).find((n) => n.type === type)!;

describe("defineDesign builder", () => {
  it("stores Arabic in props and English as a translation", () => {
    const tree = instantiateDesign(sample, { id: "s1" }).componentTree!;
    const heading = byType(tree, "heading");
    expect(heading.props.text).toBe("مرحبا");
    expect(heading.props.translations).toEqual({ en: { text: "Hello" } });
    const button = byType(tree, "button");
    expect(button.props).toMatchObject({ label: "تسوّق", href: "/#products", translations: { en: { label: "Shop" } } });
  });

  it("swaps locales for an English-default store", () => {
    const tree = instantiateDesign(sample, { id: "s1", defaultLocale: "en" }).componentTree!;
    const heading = byType(tree, "heading");
    expect(heading.props.text).toBe("Hello");
    expect(heading.props.translations).toEqual({ ar: { text: "مرحبا" } });
    expect(byType(tree, "section").props).toMatchObject({ label: "Section", translations: { ar: { label: "القسم" } } });
  });

  it("gives fresh, deterministic ids and records the source", () => {
    const a = instantiateDesign(sample, { id: "s1" });
    const again = instantiateDesign(sample, { id: "s1" });
    const b = instantiateDesign(sample, { id: "s2" });
    expect(a).toMatchObject({ id: "s1", sectionId: "custom-section", version: 1, props: {}, source: "sample@2" });
    expect(walk(a.componentTree!).map((n) => n.id)).toEqual(walk(again.componentTree!).map((n) => n.id));
    const idsA = new Set(walk(a.componentTree!).map((n) => n.id));
    expect(walk(b.componentTree!).some((n) => idsA.has(n.id))).toBe(false);
    expect(new Set(walk(a.componentTree!).map((n) => n.id)).size).toBe(walk(a.componentTree!).length);
  });

  it("turns grid columns into a style and per-device overrides", () => {
    const grid = byType(instantiateDesign(sample, { id: "s1" }).componentTree!, "grid");
    expect(grid.style).toEqual({ columns: 4, gap: 16 });
    expect(grid.breakpointStyles).toEqual({ tablet: { columns: 2 }, mobile: { columns: 1 } });
  });

  it("puts label and role in props, and a section root first", () => {
    const tree = instantiateDesign(sample, { id: "s1" }).componentTree!;
    expect(tree).toHaveLength(1);
    expect(tree[0]!.type).toBe("section");
    expect(tree[0]!.style).toMatchObject({ background: "secondary", paddingTop: 64 });
    expect(byType(tree, "heading").props.role).toBe("title");
    expect(byType(tree, "grid").props.label).toBe("الشبكة");
  });

  it("refuses a malformed design id", () => {
    expect(() => defineDesign({ ...sample, id: "Bad Id" })).toThrow();
  });
});
