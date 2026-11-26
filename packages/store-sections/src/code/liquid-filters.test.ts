import { describe, expect, it } from "vitest";
import { CODE_FILTER_NAMES, formatMoney, handleize, placeholderSvgTag } from "./liquid-filters";
import { LIQUID_API_VERSION, toLiquidProduct, type LiquidScope } from "./liquid-objects";
import { liquidEngine, renderLiquid } from "./liquid.server";

const scope = {
  section: { id: "s", settings: {}, blocks: [] },
} as unknown as LiquidScope;

function out(source: string, extra: Record<string, unknown> = {}, ctx: { locale: "ar" | "en"; currency: string; currencyLabel?: string } = { locale: "en", currency: "EGP" }) {
  const r = renderLiquid(source, { ...scope, ...extra } as LiquidScope, ctx);
  expect(r.error).toBeUndefined();
  return r.html;
}

describe("registration", () => {
  it("adds every code filter and keeps default and escape", () => {
    for (const name of [...CODE_FILTER_NAMES, "default", "escape"]) expect(liquidEngine.filters[name], name).toBeDefined();
  });
});

describe("money", () => {
  it("formats minor units in en and ar for EGP and USD, like the storefront", () => {
    expect(out("{{ 125050 | money }}")).toBe("1,250.5 EGP");
    expect(out("{{ 125000 | money }}", {}, { locale: "ar", currency: "EGP" })).toBe("1,250 EGP");
    expect(out("{{ 1999 | money }}", {}, { locale: "en", currency: "USD" })).toBe("19.99 USD");
    expect(out("{{ 1999 | money }}", {}, { locale: "ar", currency: "USD" })).toBe("19.99 USD");
    expect(out("{{ 123456789 | money }}", {}, { locale: "ar", currency: "EGP" })).toBe("1,234,567.89 EGP");
  });

  it("uses the store's label, and the ISO code for money_with_currency", () => {
    const ar = { locale: "ar" as const, currency: "EGP", currencyLabel: "جنيه" };
    expect(out("{{ 30000 | money }}", {}, ar)).toBe("300 جنيه");
    expect(out("{{ 30000 | money_with_currency }}", {}, ar)).toBe("300 EGP");
    expect(out("{{ 30000 | money_without_trailing_zeros }}", {}, ar)).toBe("300 جنيه");
    expect(out("{{ 30050 | money_without_trailing_zeros }}")).toBe("300.5 EGP");
    expect(out("{{ 5000 | money }}", {}, { locale: "ar", currency: "SAR" })).toBe("50 ر.س");
    expect(out("{{ 5000 | money }}", {}, { locale: "en", currency: "SAR" })).toBe("50 SAR");
  });

  it("formats product prices and renders nothing for non-numbers", () => {
    const product = toLiquidProduct({ id: "p", title: "Mug", slug: "mug", url: "/products/mug", price: 249.5, available: true });
    expect(out("{{ product.price | money }}", { product })).toBe("249.5 EGP");
    expect(out("[{{ nothing | money }}][{{ 'abc' | money }}]")).toBe("[][]");
    expect(formatMoney("1000", { locale: "en", currency: "egp" })).toBe("10 EGP");
  });

  it("escapes a label it is given", () => {
    expect(out("{{ 100 | money }}", {}, { locale: "en", currency: "EGP", currencyLabel: "<b>" })).toBe("1 &lt;b&gt;");
  });
});

describe("t", () => {
  it("translates the built-in strings and renders unknown keys as the key", () => {
    expect(out("{{ 'add_to_cart' | t }}|{{ 'sold_out' | t }}")).toBe("Add to cart|Sold out");
    expect(out("{{ 'add_to_cart' | t }}|{{ 'view_all' | t }}", {}, { locale: "ar", currency: "EGP" })).toBe("أضف إلى السلة|عرض الكل");
    for (const key of ["sale", "price", "from", "quantity", "search"]) expect(out(`{{ '${key}' | t }}`)).not.toBe(key);
    expect(out("{{ 'products.unknown' | t }}")).toBe("products.unknown");
    expect(out("{{ 'constructor' | t }}{{ '__proto__' | t }}")).toBe("constructor__proto__");
    expect(out("{{ '<x>' | t }}")).toBe("&lt;x&gt;");
  });
});

describe("images", () => {
  it("returns a safe image URL, unchanged for now", () => {
    expect(out("{{ 'https://cdn.example.com/a.jpg' | image_url: width: 400 }}")).toBe("https://cdn.example.com/a.jpg");
    expect(out("{{ img | image_url: width: 400 }}", { img: { src: "/media/a.webp", alt: "A" } })).toBe("/media/a.webp");
    expect(out("[{{ 'javascript:alert(1)' | image_url }}][{{ 'data:image/png;base64,AA' | image_url }}][{{ nothing | image_url }}]")).toBe("[][][]");
  });

  it("builds an escaped lazy img tag", () => {
    expect(out("{{ 'https://cdn.example.com/a.jpg' | image_url: width: 300 | image_tag: alt: 'A mug', width: 300 }}")).toBe(
      '<img src="https://cdn.example.com/a.jpg" alt="A mug" width="300" loading="lazy">',
    );
    expect(out("{{ img | image_tag }}", { img: { src: "/a.jpg", alt: '"><script>alert(1)</script>', width: 10, height: 20 } })).toBe(
      '<img src="/a.jpg" alt="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;" width="10" height="20" loading="lazy">',
    );
    expect(out(`{{ '/a.jpg?x="onerror=alert(1)' | image_tag: class: 'x" onload="y', loading: 'eager', height: 'abc' }}`)).toBe(
      '<img src="/a.jpg?x=&quot;onerror=alert(1)" alt="" class="x&quot; onload=&quot;y" loading="eager">',
    );
    expect(out("[{{ 'javascript:alert(1)' | image_tag }}]")).toBe("[]");
  });

  it("gives a fixed placeholder svg", () => {
    const svg = out("{{ 'product-1' | placeholder_svg_tag: 'ph' }}");
    expect(svg).toBe(placeholderSvgTag("anything", "ph"));
    expect(svg.startsWith("<svg ")).toBe(true);
    expect(svg).toContain('class="ph"');
    expect(svg).not.toMatch(/<script|on\w+=|href/i);
    expect(out(`{{ 'x' | placeholder_svg_tag: '"><b>' }}`)).toContain('class="&quot;&gt;&lt;b&gt;"');
  });
});

describe("link_to", () => {
  it("builds an escaped link and drops unsafe hrefs", () => {
    expect(out("{{ 'Shop <now>' | link_to: '/collections', 'All' }}")).toBe('<a href="/collections" title="All">Shop &lt;now&gt;</a>');
    expect(out("{{ 'Mail' | link_to: 'mailto:a@b.co' }}")).toBe('<a href="mailto:a@b.co">Mail</a>');
    expect(out("{{ 'Top' | link_to: '#top' }}")).toBe('<a href="#top">Top</a>');
    expect(out("{{ 'x' | link_to: 'javascript:alert(1)' }}")).toBe("x");
    expect(out("{{ 'x' | link_to: '//evil.com' }}")).toBe("x");
    expect(out(`{{ 'x' | link_to: '/a" onclick="b' }}`)).toBe("x");
  });
});

describe("handleize", () => {
  it("makes a handle and keeps Arabic letters", () => {
    expect(out("{{ 'Summer Sale 2026!' | handleize }}")).toBe("summer-sale-2026");
    expect(handleize("  فساتين صيفية  ")).toBe("فساتين-صيفية");
    expect(handleize("<script>")).toBe("script");
  });
});

describe("product DTO", () => {
  it("maps a catalog row to version 1 in minor units", () => {
    expect(LIQUID_API_VERSION).toBe(1);
    const p = toLiquidProduct({
      id: "p1",
      title: "Mug",
      slug: "mug",
      url: "/products/mug",
      price: 100,
      compareAtPrice: 150,
      available: true,
      images: [{ url: "https://cdn.example.com/a.jpg", alt: null }],
      brandName: "Clay",
      categoryName: "Kitchen",
      rating: 4.5,
      reviewCount: 3,
      variants: [
        { id: "v1", title: "Small", price: 90.25, available: true },
        { id: "v2", title: "Large", price: 120, available: false },
      ],
    });
    expect(p).toEqual({
      id: "p1",
      title: "Mug",
      handle: "mug",
      url: "/products/mug",
      price: 9025,
      compare_at_price: 15000,
      price_min: 9025,
      price_max: 12000,
      available: true,
      featured_image: { src: "https://cdn.example.com/a.jpg", alt: "Mug", width: null, height: null },
      images: [{ src: "https://cdn.example.com/a.jpg", alt: "Mug", width: null, height: null }],
      variants: [
        { id: "v1", title: "Small", price: 9025, available: true },
        { id: "v2", title: "Large", price: 12000, available: false },
      ],
      vendor: "Clay",
      type: "Kitchen",
      on_sale: true,
      rating: 4.5,
      review_count: 3,
    });
  });

  it("fills safe defaults", () => {
    const p = toLiquidProduct({ id: "p", title: "T", slug: "t", url: "/t", price: 10, compareAtPrice: 5, available: false });
    expect(p).toMatchObject({ price: 1000, compare_at_price: 500, on_sale: false, featured_image: null, images: [], variants: [], vendor: "", type: "", rating: null, review_count: 0 });
  });
});
