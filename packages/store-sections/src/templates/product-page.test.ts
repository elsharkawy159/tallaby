import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../config/schema";
import { PRODUCT_PAGE_SLUG, productPageOf } from "../config/product-page.lib";
import { validateSiteConfig } from "../config/validate";
import { getDesign, instantiateDesign, type Design } from "../designs";
import { L } from "../designs/_kit";
import { storeSectionRegistry } from "../sections";
import { fromLibrary } from "./_library";
import type { Lib } from "./_pages";
import { productPage, productSitePage } from "./_product-page";
import { CODE_TEMPLATES, LIBRARY_TEMPLATES } from "./catalog";

const walk = (nodes: readonly ComponentNode[] | undefined): ComponentNode[] => (nodes ?? []).flatMap((n) => [n, ...walk(n.children)]);
const nodesOf = (design: Design) => walk(instantiateDesign(design, { id: "s" }).componentTree);
const byLabel = (design: Design, label: string) => nodesOf(design).filter((n) => n.props.label === label);
const lib: Lib = (id, patch) => fromLibrary("tpl", getDesign(id)!, { corners: 16, ...patch });

describe("productPage", () => {
  it("default spec matches today's order", () => {
    const designs = productPage(lib);
    expect(designs.map((d) => d.id)).toEqual(["tpl-product-main", "tpl-product-content", "tpl-product-reviews", "tpl-product-related"]);
    const types = nodesOf(designs[0]!).map((n) => n.type);
    expect(types).toEqual([
      "section",
      "container",
      "textLink",
      "grid",
      "productGallery",
      "vFlex",
      "productSeller",
      "productStock",
      "heading",
      "productRating",
      "productPrice",
      "productVariants",
      "productBuyBox",
      "productDetails",
    ]);
    const [gallery] = byLabel(designs[0]!, "صور المنتج");
    expect(gallery!.props.thumbs).toBe("bottom");
    expect(gallery!.style?.order).toBeUndefined();
    // Rounded template: the buy column is a card, clamped to the template's corners.
    const [column] = byLabel(designs[0]!, "عمود الشراء");
    expect(column!.style).toMatchObject({ background: "background", borderWidth: 1, radius: 16 });
    // Reviews on a shelf band.
    expect(byLabel(designs[2]!, "التقييمات")[0]!.style?.background).toBe("secondary");
  });

  it("spec button sets the buy box variant", () => {
    const variant = (spec?: Parameters<typeof productPage>[1]) => byLabel(productPage(lib, spec)[0]!, "زر الشراء")[0]!.props.variant;
    expect(variant()).toBe("solid");
    expect(variant({ button: "outline" })).toBe("outline");
  });

  it("spec gallery end puts gallery second", () => {
    const [main] = productPage(lib, { gallery: "end", thumbs: "side" });
    const [gallery] = byLabel(main!, "صور المنتج");
    expect(gallery!.style?.order).toBe(2);
    // Below desktop the photos still come first.
    expect(gallery!.breakpointStyles?.tablet?.order).toBe(0);
    expect(gallery!.props.thumbs).toBe("side");
  });

  it("extras inserted after main", () => {
    const ids = productPage(lib, { extras: ["product-shipping", "product-perks"] }).map((d) => d.id);
    expect(ids).toEqual(["tpl-product-main", "tpl-product-shipping", "tpl-product-perks", "tpl-product-content", "tpl-product-reviews", "tpl-product-related"]);
  });

  it("maps surface, headings, band and copy to the sections", () => {
    const flat = productPage(lib, { surface: "flat" });
    expect(byLabel(flat[0]!, "عمود الشراء")[0]!.style?.background).toBeUndefined();

    const [main, , reviews, related] = productPage(lib, {
      surface: "shelf",
      headingCase: "upper",
      band: "brand",
      copy: { back: L("كل المنتجات", "All products"), reviews: L("آراءكم", "Your words"), related: L("كمان من عندنا", "More from us") },
    });
    expect(byLabel(main!, "عمود الشراء")[0]!.style).toMatchObject({ background: "secondary" });
    expect(byLabel(main!, "اسم المنتج")[0]!.style).toMatchObject({ textTransform: "uppercase" });
    expect(byLabel(reviews!, "العنوان")[0]!.style).toMatchObject({ textTransform: "uppercase" });
    expect(byLabel(reviews!, "التقييمات")[0]!.style?.background).toBe("primary");
    expect(byLabel(reviews!, "العمود")[0]!.style?.background).toBe("background");
    // The panel spans the band like the related products below, not a 960px column.
    expect(byLabel(reviews!, "الحاوية")[0]!.style?.maxWidth).toBe("100%");
    const texts = [main!, reviews!, related!].flatMap(nodesOf).map((n) => n.props.text);
    expect(texts).toEqual(expect.arrayContaining(["كل المنتجات", "آراءكم", "كمان من عندنا"]));
  });

  it("productSitePage is the hidden product page", () => {
    const page = productSitePage(productPage(lib));
    expect(page).toMatchObject({ slug: PRODUCT_PAGE_SLUG, kind: "product", isHome: false, showInNav: false, name: "صفحة المنتج", seo: {} });
    expect(page.content.sections.map((s) => s.source)).toEqual(["tpl-product-main@1", "tpl-product-content@1", "tpl-product-reviews@1", "tpl-product-related@1"]);
  });
});

describe.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("code template %s", (_key, template) => {
  it("every code template config has exactly one product page and validates", () => {
    const config = template.config();
    expect(config.pages.filter((p) => p.kind === "product")).toHaveLength(1);
    const result = validateSiteConfig(config, { allowedSections: storeSectionRegistry.allowedSections() });
    expect(result.success, JSON.stringify(result.success ? "" : result.issues)).toBe(true);
    expect(template.pageNames[PRODUCT_PAGE_SLUG]).toEqual({ ar: "صفحة المنتج", en: "Product page" });
  });
});

describe.each(LIBRARY_TEMPLATES.map((t) => [t.key, t] as const))("library template %s", (key, template) => {
  it("buy column matches the resolved surface of its product page spec", () => {
    const spec = template.productPageSpec!;
    expect(spec, "library templates keep their resolved spec").toBeDefined();
    const main = productPageOf(template.config())!.content.sections[0]!;
    const column = walk(main.componentTree).find((n) => n.props.label === "عمود الشراء")!;
    if (spec.surface === "flat") expect(column.style?.background).toBeUndefined();
    else expect(column.style?.background).toBe(spec.surface === "shelf" ? "secondary" : "background");
  });

  it("template product page design ids are <key>-product-*", () => {
    const page = productPageOf(template.config())!;
    for (const section of page.content.sections) {
      const id = section.source!.split("@")[0]!;
      expect(id).toMatch(new RegExp(`^${key}-product-`));
      expect(template.designs.some((d) => d.id === id), id).toBe(true);
    }
  });
});
