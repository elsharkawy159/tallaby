import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../config/schema";
import { DEMO_PRODUCT } from "../core/demo-product";
import { priceNode, type RenderContext } from "../core/types";
import { renderElementTree } from "./render";

const ctx = (over: Partial<RenderContext> = {}): RenderContext => ({
  mode: "public",
  locale: "en",
  dir: "ltr",
  store: { name: "Store", url: "https://x.tallaby.com" },
  pages: [],
  catalog: {
    products: { productList: [{ id: "p1", title: "Earbuds", href: "/products/p1", image: null, price: 900 }] },
    categories: [],
  },
  Link: ({ href, children }) => <a href={href}>{children}</a>,
  imageUrl: (src) => src || null,
  formatPrice: (n) => `${n} SAR`,
  ...over,
});

const node = (type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = [], id = type): ComponentNode =>
  ({ id, type, props, children }) as ComponentNode;

const list = () => [node("productList", {}, [node("text", { bind: "price", text: "demo" })])];

describe("a price drawn by the host (the Saudi Riyal symbol)", () => {
  it("falls back to the host's text when the host draws no markup", () => {
    expect(priceNode(ctx(), 900)).toBe("900 SAR");
    expect(renderToStaticMarkup(<>{renderElementTree(list(), ctx(), 0)}</>)).toContain("900 SAR");
  });

  it("draws the host's markup in a node bound to the price", () => {
    const html = renderToStaticMarkup(
      <>{renderElementTree(list(), ctx({ renderPrice: (n) => <b data-price>{n}</b> }), 0)}</>,
    );
    expect(html).toContain("<b data-price=\"true\">900</b>");
    expect(html).not.toContain("900 SAR");
  });

  it("draws it on the product page's price, struck price and saving", () => {
    const product = { ...DEMO_PRODUCT, price: 900, compareAtPrice: 1200, discountPercent: 25 };
    const draw = (over: Partial<RenderContext>) =>
      renderToStaticMarkup(<>{renderElementTree([node("productPrice", { showCountdown: false })], ctx({ ...over, product }), 1, { kind: "product", record: product })}</>);
    const html = draw({ renderPrice: (n) => <b>{n}</b> });
    expect(html).toContain("<b>900</b>");
    expect(html).toContain("<b>1200</b>");
    expect(html).toContain("Save <b>300</b>");
    expect(html).not.toContain("SAR");
    expect(draw({})).toContain("Save 300 SAR");
  });
});
