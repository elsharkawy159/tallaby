import { describe, expect, it } from "vitest";
import { getDesign, instantiateDesign } from "../designs";
import type { ComponentNode } from "../config/schema";
import { L } from "../designs/_kit";
import { fromLibrary } from "./_library";

const walk = (nodes: readonly ComponentNode[] | undefined): ComponentNode[] => (nodes ?? []).flatMap((n) => [n, ...walk(n.children)]);
const build = (design: ReturnType<typeof fromLibrary>) => walk(instantiateDesign(design, { id: "s" }).componentTree);
const photos = ["https://images.pexels.com/photos/1/a.jpeg", "https://images.pexels.com/photos/2/b.jpeg", "https://images.pexels.com/photos/3/c.jpeg"];

describe("fromLibrary", () => {
  const ticket = getDesign("hero-ticket")!;

  it("swaps copy in both languages, photos by slot and links by occurrence", () => {
    const design = fromLibrary("tpl", ticket, {
      photo: photos,
      text: { "ألوان هادئة لأيام أطول": L("عنوان جديد", "New title") },
      links: { "/products": ["/products?sort=newest", undefined, "/about"] },
    });
    expect(design.id).toBe("tpl-hero-ticket");
    const nodes = build(design);
    const title = nodes.find((n) => n.type === "heading")!;
    expect(title.props.text).toBe("عنوان جديد");
    expect((title.props.translations as { en: { text: string } }).en.text).toBe("New title");
    expect(nodes.filter((n) => n.type === "image").map((n) => n.props.src)).toEqual(photos);
    const hrefs = nodes.map((n) => n.props.href).filter(Boolean);
    expect(hrefs).toEqual(["/products?sort=newest", "/products", "/about"]);
  });

  it("throws when copy, a link or a photo slot is missing", () => {
    expect(() => build(fromLibrary("tpl", ticket, { photo: photos, text: { "غير موجود": "x" } }))).toThrow(/text "غير موجود"/);
    expect(() => build(fromLibrary("tpl", ticket, { photo: photos, links: { "/nowhere": "/" } }))).toThrow(/link "\/nowhere"/);
    expect(() => build(fromLibrary("tpl", ticket, { photo: photos, links: { "/products": ["/"] } }))).toThrow(/1 swaps for 3/);
    expect(() => build(fromLibrary("tpl", ticket, { photo: photos.slice(0, 1) }))).toThrow(/photo\(1\)/);
    expect(() => build(fromLibrary("tpl", ticket))).toThrow(/photo\(0\)/);
  });

  it("marks the store name, initial and copyright, and asks for the newsletter form", () => {
    const nodes = build(fromLibrary("tpl", getDesign("footer-signup")!, { text: { "اسم متجرك": L("سايرة", "Sayra") } }));
    expect(nodes.find((n) => n.props.role === "storeName")?.props.text).toBe("سايرة");
    expect(nodes.some((n) => n.props.role === "storeInitial")).toBe(true);
    expect(nodes.some((n) => n.props.role === "copyright")).toBe(true);
    expect(nodes.find((n) => n.type === "storeForm")?.props.formTemplate).toBe("newsletter");
  });

  it("caps corner radii at the template's, keeping full circles", () => {
    const radii = (corners?: number) =>
      build(fromLibrary("tpl", getDesign("testimonials-wall")!, { corners }))
        .flatMap((n) => [n.style?.radius, ...Object.values(n.breakpointStyles ?? {}).map((s) => s?.radius)])
        .filter((r): r is number => typeof r === "number");
    expect(radii().some((r) => r > 0 && r < 999)).toBe(true);
    expect(radii(0).every((r) => r === 0 || r === 999)).toBe(true);
    expect(radii(0)).toContain(999);
  });

  it("patches data lists in order and takes an id suffix", () => {
    const design = fromLibrary("tpl", getDesign("products-rail")!, { as: "picks", lists: [{ source: "newest", limit: 4 }] });
    expect(design.id).toBe("tpl-picks");
    const list = build(design).find((n) => n.type === "productList")!;
    expect([list.props.source, list.props.limit]).toEqual(["newest", 4]);
    expect(() => build(fromLibrary("tpl", getDesign("products-rail")!, { lists: [{}, {}] }))).toThrow(/2 list patches for 1 lists/);
  });

  it("merges node patches by layer label, before the corner cap", () => {
    const main = getDesign("product-main")!;
    const nodes = build(
      fromLibrary("tpl", main, {
        corners: 8,
        nodes: {
          "صور المنتج": { props: { thumbs: "none" }, style: { order: 2 }, tablet: { order: 0 } },
          "عمود الشراء": { style: { radius: 24, background: "secondary" }, mobile: { gap: 8 } },
        },
      }),
    );
    const gallery = nodes.find((n) => n.props.label === "صور المنتج")!;
    expect(gallery.props.thumbs).toBe("none");
    // Merged into the design's own styles.
    expect(gallery.style).toMatchObject({ order: 2, colSpan: 7, position: "sticky" });
    expect(gallery.breakpointStyles?.tablet).toMatchObject({ order: 0, colSpan: 1 });
    const column = nodes.find((n) => n.props.label === "عمود الشراء")!;
    expect(column.style).toMatchObject({ radius: 8, background: "secondary", gap: 20 });
    expect(column.breakpointStyles?.mobile).toMatchObject({ gap: 8 });
    expect(() => build(fromLibrary("tpl", main, { nodes: { "غير موجود": { style: { order: 1 } } } }))).toThrow(/node "غير موجود"/);
  });
});
