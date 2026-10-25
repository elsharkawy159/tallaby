/**
 * docs/template-rules.md §7: the automated checks for every template that
 * follows the template rules. Tallaby Classic is the first; add a template
 * to RULED once it is brought up to the rules. Bottom navigation (§4.2, gap
 * G1) and brands (§2, gap G3) are not built yet, so they are not checked.
 */
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance, SiteConfig } from "../config/schema";
import { footerCreditsTallaby } from "../config/header";
import { normalizeSectionStyle } from "../elements/style";
import { CLASSIC } from "./classic";
import type { TemplateDefinition } from "./types";

const RULED: readonly TemplateDefinition[] = [CLASSIC];

const walk = (nodes: readonly ComponentNode[] | undefined): ComponentNode[] => (nodes ?? []).flatMap((n) => [n, ...walk(n.children)]);
const nodesOf = (section: SectionInstance | null | undefined) => walk(section?.componentTree);
const listSource = (section: SectionInstance) => nodesOf(section).find((n) => n.type === "productList")?.props.source;
const animation = (section: SectionInstance | null | undefined) => (section ? normalizeSectionStyle(section.style).shell?.animation : undefined);

/** §5: the only link targets a template may use (phone and e-mail links are filled from the store's contact data). */
const ALLOWED_HREF =
  /^(\/|\/products(\?(category=[\w-]+|search=[^&]+|sort=(newest|popularity|rating|price-low|price-high)))?|\/(cart|profile|profile\/wishlist|profile\/orders)|\/(about|contact|faq|privacy|terms|shipping|returns|blog)|https:\/\/(www\.facebook\.com|www\.instagram\.com|wa\.me)\/\d*|https:\/\/tallaby\.com|tel:\+\d+|mailto:[^\s]+)$/;

describe.each(RULED.map((template) => [template.key, template] as const))("template rules: %s", (_key, template) => {
  const config: SiteConfig = template.config();
  const home = config.pages.find((p) => p.isHome)!.content.sections;

  it("§2: home has at most 8 sections and opens with a hero carousel", () => {
    expect(home.length).toBeLessThanOrEqual(8);
    expect(nodesOf(home[0]).some((n) => n.type === "carousel")).toBe(true);
    const slides = nodesOf(home[0]).filter((n) => n.type === "slide");
    expect(slides.length).toBeGreaterThanOrEqual(2);
    expect(slides.length).toBeLessThanOrEqual(3);
    // One button per slide.
    for (const slide of slides) expect(walk(slide.children).filter((n) => n.props.role === "cta")).toHaveLength(1);
  });

  it("§2: categories, best sellers, offers and new arrivals come in the standard order", () => {
    const at = (test: (s: SectionInstance) => boolean) => home.findIndex(test);
    const categories = at((s) => nodesOf(s).some((n) => n.type === "categoryList"));
    const bestSellers = at((s) => listSource(s) === "best-sellers");
    const offers = at((s) => listSource(s) === "discounted");
    const newest = at((s) => listSource(s) === "newest");
    expect([categories, bestSellers, offers, newest].every((i) => i > 0)).toBe(true);
    expect(categories).toBeLessThan(bestSellers);
    expect(bestSellers).toBeLessThan(offers);
    expect(offers).toBeLessThan(newest);
    // Product rails: 4 on desktop, 2 on phones, never more than 8.
    for (const list of home.flatMap(nodesOf).filter((n) => n.type === "productList")) {
      expect(Number(list.props.limit)).toBeLessThanOrEqual(8);
      expect(list.style?.columns).toBe(4);
      expect(list.breakpointStyles?.mobile?.columns).toBe(2);
    }
  });

  it("§4.1 and §4.3: the header has cart, search and account; the footer has the Powered by link", () => {
    const header = nodesOf(config.header);
    expect(header.some((n) => n.props.href === "/cart")).toBe(true);
    expect(header.some((n) => n.props.href === "/profile")).toBe(true);
    expect(header.some((n) => n.props.href === "/products" && walk(n.children).some((c) => c.type === "icon" && c.props.name === "search"))).toBe(true);
    expect(nodesOf(config.footer).some((n) => n.props.href === "https://tallaby.com")).toBe(true);
    // So the storefront skips its floating badge; a header (no credit) would keep it.
    expect(footerCreditsTallaby(config.footer)).toBe(true);
    expect(footerCreditsTallaby(config.header)).toBe(false);
  });

  it("§5: every link is an allowed target", () => {
    const sections = [config.header!, config.footer!, ...config.pages.flatMap((p) => p.content.sections)];
    for (const node of sections.flatMap(nodesOf)) {
      const href = node.props.href;
      if (typeof href === "string") expect(href, node.id).toMatch(ALLOWED_HREF);
      expect(href, node.id).not.toBe("#");
    }
  });

  it("§3: the product page has the buy box with Buy now", () => {
    const product = config.pages.find((p) => p.kind === "product");
    const buyBox = product?.content.sections.flatMap(nodesOf).find((n) => n.type === "productBuyBox");
    expect(buyBox).toBeDefined();
    expect(buyBox!.props.buyNow).not.toBe(false);
  });

  it("§6a: every home section but the hero rises in; the hero, header and footer do not animate", () => {
    expect(animation(home[0])).toBeUndefined();
    for (const section of home.slice(1)) expect(animation(section), section.id).toBe("rise");
    expect(animation(config.header)).toBeUndefined();
    expect(animation(config.footer)).toBeUndefined();
  });
});
