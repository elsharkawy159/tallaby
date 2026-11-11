/**
 * Motion v1 is frozen (docs/motion-v2-plan.md, owner decision 1: running
 * stores do not change). A section tree without the v2 marker (`props.motion`
 * on its root) must render exactly the markup it rendered before motion v2,
 * and the v1 CSS must stay byte for byte the same. The snapshots below were
 * taken before any motion v2 code landed. The one allowed difference is the
 * rail marker (`data-sf-rail`), which the rail reveal fix needs on every
 * store (a card that never appears is a bug, owner-approved), so it is
 * stripped before comparing.
 */
import { createHash } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../config/schema";
import type { RenderContext } from "../core/types";
import { collectCatalogQueries, collectContentQueries } from "../core/registry";
import { DESIGNS, instantiateDesign } from "../designs";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import * as motion from "./motion";

const ctx = (over: Partial<RenderContext> = {}): RenderContext => ({
  mode: "public",
  reveal: true,
  locale: "ar",
  dir: "rtl",
  store: { name: "متجر", url: "https://x.tallaby.com" },
  pages: [{ name: "الرئيسية", href: "/", isHome: true }],
  catalog: { products: {}, categories: [] },
  Link: ({ href, className, children }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  imageUrl: (src) => (src ? `https://cdn.test/${src}` : null),
  formatPrice: (n) => `${n} EGP`,
  ...over,
});

const PRODUCT = { id: "p1", title: "سماعة لاسلكية", href: "/products/p1", image: "https://cdn.test/p1.jpg", price: 900, compareAtPrice: 1200, rating: 4.6 };
const POST = { id: "b1", title: "إزاي تختار سماعة", href: "/blog/b1", excerpt: "سطر من المقال", image: "https://cdn.test/b1.jpg", publishedAt: "2026-10-02" };

/** A design as a store saved it before motion v2: no marker on its root. */
function v1Instance(id: string) {
  const design = DESIGNS.find((d) => d.id === id)!;
  const instance = instantiateDesign(design, { id: "d1" });
  const tree = instance.componentTree!.map((root): ComponentNode => {
    const { motion: _marker, ...props } = root.props;
    return { ...root, props };
  });
  const filled = { ...instance, componentTree: tree };
  const products = Object.fromEntries(
    Object.keys(collectCatalogQueries([filled], storeSectionRegistry)).map((key) => [
      key,
      Array.from({ length: 6 }, (_, i) => ({ ...PRODUCT, id: `p${i + 1}`, compareAtPrice: i % 2 ? null : 1200 })),
    ]),
  );
  const items = Object.fromEntries(Object.keys(collectContentQueries([filled], storeSectionRegistry)).map((key) => [key, [POST, { ...POST, id: "b2" }]]));
  const data: Partial<RenderContext> = {
    catalog: {
      products,
      categories: [
        { id: "c1", key: "audio", name: "سماعات", href: "/products?category=c1", image: "https://cdn.test/c1.jpg", productCount: 12 },
        { id: "c2", key: "phones", name: "هواتف", href: "/products?category=c2", image: "https://cdn.test/c2.jpg", productCount: 4 },
      ],
    },
    content: { items },
  };
  return { instance: filled, data };
}

/**
 * The motion v2 pilot designs got new versions whose trees use the v2
 * primitives (a words heading, for example). That is a new design, not a
 * renderer change: stores keep their saved v1 copy, which still renders as
 * frozen through every other design here. So the pilots leave the sample.
 */
const V2_PILOTS = new Set(["products-grid", "testimonials-classic"]);

/** One design per library category (first in library order), plus every products design (rails, staggered grids). */
const SAMPLE = [
  ...new Set([
    ...DESIGNS.filter((d, i) => DESIGNS.findIndex((o) => o.category === d.category) === i && d.category !== "product-page").map((d) => d.id),
    ...DESIGNS.filter((d) => d.category === "products").map((d) => d.id),
  ]),
].filter((id) => !V2_PILOTS.has(id));

const stripRail = (html: string) => html.replace(/ data-sf-rail=""/g, "");

describe("motion v1 is frozen", () => {
  it("keeps the v1 CSS byte for byte", () => {
    const v1 = (motion as Record<string, unknown>).MOTION_CSS_V1 ?? motion.MOTION_CSS;
    expect(typeof v1).toBe("string");
    expect(createHash("sha256").update(v1 as string).digest("hex")).toMatchSnapshot();
    expect(motion.MOTION_CSS.startsWith(v1 as string)).toBe(true);
  });

  it.each(SAMPLE)("%s without the v2 marker renders as before (reveal on, public)", (id) => {
    const { instance, data } = v1Instance(id);
    for (const locale of ["ar", "en"] as const) {
      const html = renderToStaticMarkup(
        <SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx({ ...data, locale, dir: locale === "ar" ? "rtl" : "ltr" })} />,
      );
      expect(html).not.toContain("data-sf-mv");
      expect(stripRail(html)).toMatchSnapshot(locale);
    }
  });
});
