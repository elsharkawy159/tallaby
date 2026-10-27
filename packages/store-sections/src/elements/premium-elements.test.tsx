import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import type { ProductDetail, ProductSummary, RenderContext } from "../core/types";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { countdownParts, formatCountdownUnit } from "./countdown";
import { MOTION_CSS, marqueeSeconds } from "./motion";

let n = 0;
const node = (type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = [], style?: Record<string, unknown>): ComponentNode => ({
  id: `p${++n}`,
  type: type as ComponentNode["type"],
  props,
  children,
  ...(style && { style }),
});

const ctx = (over: Partial<RenderContext> = {}): RenderContext => ({
  mode: "public",
  locale: "ar",
  dir: "rtl",
  store: { name: "S", url: "https://s.test" },
  pages: [],
  catalog: { products: {}, categories: [] },
  Link: ({ href, className, children }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  imageUrl: (src) => (src ? `https://cdn/${src}` : null),
  formatPrice: (v) => `${v}`,
  ...over,
});

const custom = (tree: ComponentNode[]): SectionInstance => ({ id: "c1", sectionId: "custom-section", version: 1, props: {}, componentTree: tree });
const render = (tree: ComponentNode[], over: Partial<RenderContext> = {}) =>
  renderToStaticMarkup(<SectionRenderer instance={custom(tree)} registry={storeSectionRegistry} ctx={ctx(over)} defaultLocale="ar" />);

describe("countdown element", () => {
  const now = Date.parse("2026-10-27T10:00:00Z");

  it("splits the time left into days, hours, minutes and seconds", () => {
    expect(countdownParts("2026-10-29T13:04:05Z", now)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5, done: false });
    expect(countdownParts("2026-10-27T09:00:00Z", now)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true });
    expect(countdownParts("", now)).toBeNull();
    expect(countdownParts("not a date", now)).toBeNull();
    expect(countdownParts(42, now)).toBeNull();
  });

  it("writes two digits, Arabic digits on Arabic pages", () => {
    expect(formatCountdownUnit(7, "en")).toBe("07");
    expect(formatCountdownUnit(7, "ar")).toBe("٠٧");
  });

  it("publicly draws nothing without a date or after it, and ticks with the date on it", () => {
    const future = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const past = new Date(Date.now() - 1000).toISOString();
    const tree = (endsAt: string) => [node("section", {}, [node("heading", { level: "h2", text: "T" }), node("countdown", { endsAt })])];
    expect(render(tree(""))).not.toContain('data-node-type="countdown"');
    expect(render(tree(past))).not.toContain('data-node-type="countdown"');
    const live = render(tree(future));
    expect(live).toContain(`data-countdown-ends="${future}"`);
    expect(live).toContain('role="timer"');
    expect(live.match(/data-countdown-unit=/g)).toHaveLength(4);
    // The editor shows zeros so the seller sees it before setting a date.
    expect(render(tree(""), { mode: "edit" })).toContain('data-node-type="countdown"');
  });

  it("keeps its caption with it, so the caption hides when the countdown does", () => {
    const tree = (endsAt: string) => [node("section", {}, [node("heading", { level: "h2", text: "T" }), node("countdown", { endsAt, caption: "Ends in" })])];
    expect(render(tree(new Date(Date.now() + 86_400_000).toISOString()))).toContain("Ends in");
    expect(render(tree(""))).not.toContain("Ends in");
  });
});

describe("marquee element", () => {
  const tree = (speed?: unknown) => [node("section", {}, [node("marquee", { speed }, [node("text", { text: "One" }), node("text", { text: "Two" })], { gap: 24 })])];

  it("clamps the loop time", () => {
    expect(marqueeSeconds(undefined)).toBe(30);
    expect(marqueeSeconds(1)).toBe(8);
    expect(marqueeSeconds(9999)).toBe(120);
    expect(marqueeSeconds("fast")).toBe(30);
  });

  it("publicly loops two copies of the row, the second hidden from assistive tech", () => {
    const html = render(tree(20));
    expect(html).toContain("--sf-marquee:20s");
    expect(html).toContain("--sf-mg:24px");
    expect(html.match(/data-marquee-row/g)).toHaveLength(2);
    expect(html).toMatch(/data-marquee-copy="true" aria-hidden="true" inert=""/);
    expect(html.match(/>One</g)).toHaveLength(2);
  });

  it("is one still row in the editor", () => {
    const html = render(tree(20), { mode: "edit" });
    expect(html).not.toContain("data-marquee-track");
    expect(html.match(/>One</g)).toHaveLength(1);
  });

  it("only moves without reduced motion and stops with Animations off", () => {
    const moving = MOTION_CSS.indexOf("[data-marquee-track]{animation:sf-marquee");
    expect(moving).toBeGreaterThan(MOTION_CSS.indexOf("@media (prefers-reduced-motion:no-preference){"));
    expect(MOTION_CSS).toContain('[data-sf-motion="off"] [data-marquee-track]{animation:none}');
    expect(MOTION_CSS).toContain("@keyframes sf-marquee-rtl");
  });
});

describe("trending / seasonal badges", () => {
  const product = (over: Partial<ProductSummary>): ProductSummary => ({ id: "x1", title: "Bag", href: "/products/bag", image: "bag.jpg", price: 100, ...over });
  const card = () => [
    node("section", {}, [
      { ...node("productList", { source: "newest", limit: 4 }, [node("linkBlock", { href: "/products", bind: "href" }, [node("image", { src: "", alt: "", bind: "image" })])]), id: "list1" },
    ]),
  ];
  const withProducts = (records: ProductSummary[]) => ({ catalog: { products: { list1: records }, categories: [] } });

  it("puts the chips on the photo of a flagged product's card only", () => {
    const html = render(card(), withProducts([product({ id: "a", trending: true, seasonal: true }), product({ id: "b" })]));
    expect(html.match(/رائج/g)).toHaveLength(1);
    expect(html.match(/موسمي/g)).toHaveLength(1);
  });

  it("speaks the page language", () => {
    const html = render(card(), { ...withProducts([product({ trending: true })]), locale: "en", dir: "ltr" });
    expect(html).toContain("Trending");
    expect(html).not.toContain("Seasonal");
  });

  it("shows on the product page above the price", () => {
    const detail = {
      ...product({ seasonal: true }),
      slug: "bag",
      description: null,
      descriptionHtml: null,
      images: [],
      variants: [],
      quantity: 3,
      reviewCount: 0,
      brand: null,
      category: null,
      bullets: [],
      seller: { name: "S" },
    } as unknown as ProductDetail;
    const html = render([node("section", {}, [node("productPrice", {})])], { product: detail });
    expect(html).toContain("موسمي");
  });
});

describe("icon buttons", () => {
  it("centres an icon that is alone in a link or box", () => {
    const html = render([
      node("section", {}, [node("linkBlock", { href: "/cart" }, [node("icon", { name: "shopping-bag" })]), node("div", {}, [node("icon", { name: "truck" })])]),
    ]);
    expect(html.match(/grid place-items-center/g)).toHaveLength(2);
  });
});
