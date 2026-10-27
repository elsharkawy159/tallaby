import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import type { RenderContext } from "../core/types";
import { instantiateDesign } from "../designs/builder";
import { HEADER_DESIGNS } from "../designs/headers";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";

let n = 0;
const node = (type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = []): ComponentNode => ({
  id: `h${++n}`,
  type: type as ComponentNode["type"],
  props,
  children,
});

const tools: Partial<RenderContext> = {
  renderCartBadge: () => <i data-test="badge" />,
  renderSearch: ({ placeholder, icon, iconFirst }) => (
    <i data-test="search" data-placeholder={placeholder ?? ""} data-icon-first={String(iconFirst)}>
      {icon}
    </i>
  ),
};

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
const render = (instance: SectionInstance, over: Partial<RenderContext> = {}) =>
  renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx(over)} defaultLocale="ar" />);

describe("header cart and search", () => {
  const bar = node("linkBlock", { href: "/products" }, [node("hFlex", {}, [node("text", { text: "ابحث عن منتج" }), node("icon", { name: "search" })])]);
  const iconButton = node("linkBlock", { href: "/products" }, [node("icon", { name: "search" })]);
  const cart = node("linkBlock", { href: "/cart" }, [node("icon", { name: "shopping-bag" })]);
  const footerCart = node("linkBlock", { href: "/cart" }, [node("text", { text: "السلة" })]);
  const shopLink = node("linkBlock", { href: "/products" }, [node("text", { text: "المتجر" })]);
  const section = custom([node("section", {}, [bar, iconButton, cart, footerCart, shopLink])]);

  it("hands search links and cart icons to the host", () => {
    const html = render(section, tools);
    expect(html).toContain('data-test="search" data-placeholder="ابحث عن منتج" data-icon-first="false"');
    expect(html).toContain('data-test="search" data-placeholder="" data-icon-first="true"');
    // The link's box keeps its node id, so its authored style still applies.
    expect(html).toContain(`data-node-id="${bar.id}"`);
    expect(html.match(/data-test="badge"/g)).toHaveLength(1);
    // A plain shop link and a text-only cart link stay links.
    expect(html).toContain(">المتجر<");
    expect(html.match(/href="\/products"/g)).toHaveLength(1);
  });

  it("keeps plain links in the editor", () => {
    const html = render(section, { mode: "edit" });
    expect(html).not.toContain("data-test");
    expect(html.match(/href="\/products"/g)).toHaveLength(3);
  });

  it("draws a plain search form in a preview with no host search", () => {
    const html = render(section);
    expect(html).not.toContain("data-test");
    // The search bar opens the shop page's results; the icon button and the shop link stay links.
    expect(html).toMatch(/<form role="search"[^>]*action="\/products" method="get">/);
    expect(html).toContain('name="search"');
    expect(html).toContain('placeholder="ابحث عن منتج"');
    expect(html).toContain(`data-node-id="${bar.id}"`);
    expect(html.match(/href="\/products"/g)).toHaveLength(2);
  });

  // Category lists need a category, else their header is hidden publicly.
  const catalog = {
    products: {},
    categories: [{ id: "c1", key: "audio", name: "سماعات", href: "/products?category=c1", image: "https://cdn.test/c1.jpg", productCount: 12 }],
  } as unknown as RenderContext["catalog"];

  it.each(HEADER_DESIGNS.map((design) => [design.id, design] as const))("%s gets a live cart count, and a live search where it has one", (id, design) => {
    const html = render(instantiateDesign(design, { id: "d1" }), { ...tools, catalog });
    expect(html).toContain('data-test="badge"');
    // The pill header has no search to make live.
    if (id !== "header-pill") expect(html).toContain('data-test="search"');
  });

  it("uses the placeholder of the page language", () => {
    const search = HEADER_DESIGNS.find((design) => design.id === "header-search")!;
    const html = render(instantiateDesign(search, { id: "d1" }), { ...tools, catalog, locale: "en", dir: "ltr" });
    expect(html).toContain('data-placeholder="Search products…"');
  });
});
