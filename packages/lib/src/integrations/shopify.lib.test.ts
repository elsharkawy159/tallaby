import { describe, expect, it, vi } from "vitest";
import {
  categoryForType,
  fetchShopifyImage,
  htmlToSummary,
  isAllowedShopifyImageUrl,
  mapShopifyPrice,
  mapShopifyProduct,
  normalizeShopDomain,
  shopifyGraphql,
  toPiastres,
  validateShopifyConnectInput,
  type ShopifyProductNode,
} from "./shopify.lib";

const TOKEN = `shpat_${"a1".repeat(16)}`;
const sanitizeHtml = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, "");

function node(overrides: Partial<ShopifyProductNode> = {}): ShopifyProductNode {
  return {
    id: "gid://shopify/Product/101",
    legacyResourceId: "101",
    title: "Linen Shirt",
    handle: "linen-shirt",
    descriptionHtml: "<p>Soft <b>linen</b></p><script>alert(1)</script>",
    productType: "Shirts",
    media: { nodes: [{ image: { url: "https://cdn.shopify.com/s/files/1/a.jpg" } }, { image: { url: "https://evil.example/b.jpg" } }, {}] },
    variants: {
      pageInfo: { hasNextPage: false },
      nodes: [
        {
          title: "S / Blue",
          sku: "LS-S-B",
          price: "199.00",
          compareAtPrice: "250.00",
          inventoryQuantity: 4,
          selectedOptions: [
            { name: "Size", value: "S" },
            { name: "Color", value: "Blue" },
          ],
          media: { nodes: [{ image: { url: "https://cdn.shopify.com/s/files/1/v.jpg" } }] },
        },
        {
          title: "M / Blue",
          sku: null,
          price: "199.00",
          compareAtPrice: null,
          inventoryQuantity: -2,
          selectedOptions: [
            { name: "Size", value: "M" },
            { name: "Color", value: "Blue" },
          ],
        },
      ],
    },
    ...overrides,
  };
}

describe("shop domain and token validation", () => {
  it("normalises pasted shop addresses", () => {
    expect(normalizeShopDomain("My-Shop")).toBe("my-shop.myshopify.com");
    expect(normalizeShopDomain("https://my-shop.myshopify.com/admin/products")).toBe("my-shop.myshopify.com");
    expect(normalizeShopDomain(" my-shop.myshopify.com ")).toBe("my-shop.myshopify.com");
  });

  it("rejects anything that is not a myshopify.com shop", () => {
    for (const bad of ["shop.example.com", "my_shop.myshopify.com", "a.b.myshopify.com", "myshopify.com.evil.io", "", "http://169.254.169.254"]) {
      expect(normalizeShopDomain(bad)).toBeNull();
    }
  });

  it("validates the connect input strictly", () => {
    expect(validateShopifyConnectInput({ shopDomain: "my-shop", accessToken: ` ${TOKEN} ` })).toEqual({
      success: true,
      data: { shopDomain: "my-shop.myshopify.com", accessToken: TOKEN },
    });
    expect(validateShopifyConnectInput({ shopDomain: "my-shop", accessToken: "nope" })).toEqual({ success: false, error: "invalid_token" });
    expect(validateShopifyConnectInput({ shopDomain: "x.com", accessToken: TOKEN })).toEqual({ success: false, error: "invalid_shop_domain" });
    expect(validateShopifyConnectInput({ shopDomain: "my-shop", accessToken: TOKEN, extra: 1 })).toEqual({
      success: false,
      error: "invalid_shop_domain",
    });
  });
});

describe("image hosts", () => {
  it("allows only https cdn.shopify.com", () => {
    expect(isAllowedShopifyImageUrl("https://cdn.shopify.com/s/files/1/a.jpg?v=1")).toBe(true);
    expect(isAllowedShopifyImageUrl("http://cdn.shopify.com/a.jpg")).toBe(false);
    expect(isAllowedShopifyImageUrl("https://cdn.shopify.com.evil.io/a.jpg")).toBe(false);
    expect(isAllowedShopifyImageUrl("https://user@cdn.shopify.com/a.jpg")).toBe(false);
    expect(isAllowedShopifyImageUrl("https://cdn.shopify.com:8443/a.jpg")).toBe(false);
  });

  it("downloads only allowed types and sizes, with no redirects", async () => {
    const ok = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/png" } }));
    const result = await fetchShopifyImage("https://cdn.shopify.com/a.png", { fetchImpl: ok as unknown as typeof fetch });
    expect(result).toMatchObject({ ok: true, ext: "png", contentType: "image/png" });
    const [url, init] = ok.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("width=1600");
    expect(init.redirect).toBe("error");

    const svg = vi.fn(async () => new Response("<svg/>", { headers: { "content-type": "image/svg+xml" } }));
    expect(await fetchShopifyImage("https://cdn.shopify.com/a.svg", { fetchImpl: svg as unknown as typeof fetch })).toEqual({
      ok: false,
      reason: "unsupported_type",
    });
    const big = vi.fn(async () => new Response(new Uint8Array(10), { headers: { "content-type": "image/jpeg" } }));
    expect(await fetchShopifyImage("https://cdn.shopify.com/a.jpg", { fetchImpl: big as unknown as typeof fetch, maxBytes: 5 })).toEqual({
      ok: false,
      reason: "too_large",
    });
    const never = vi.fn();
    expect(await fetchShopifyImage("https://evil.example/a.jpg", { fetchImpl: never as unknown as typeof fetch })).toEqual({
      ok: false,
      reason: "host_not_allowed",
    });
    expect(never).not.toHaveBeenCalled();
  });
});

describe("price mapping", () => {
  it("parses decimals into piastres", () => {
    expect(toPiastres("199.5")).toBe(19950);
    expect(toPiastres("12")).toBe(1200);
    expect(toPiastres("-1")).toBeNull();
    expect(toPiastres("1e5")).toBeNull();
  });

  it("uses compare-at as the list price and keeps prices as they are", () => {
    expect(mapShopifyPrice("199.00", "250.00")).toEqual({
      base: 250,
      list: 250,
      final: 199,
      discountType: "amount",
      discountValue: 51,
      discountEndsAt: null,
    });
    expect(mapShopifyPrice("99.99", null)).toMatchObject({ list: 99.99, final: 99.99, discountType: null, discountValue: null });
    expect(mapShopifyPrice("199.99", "250.00")).toMatchObject({ final: 199.99, discountValue: 50.01 });
    expect(mapShopifyPrice("100", "90")).toMatchObject({ list: 100, final: 100, discountType: null });
  });
});

describe("mapShopifyProduct", () => {
  it("maps a product with options to a draft with variants", () => {
    const mapped = mapShopifyProduct(node(), { categoryId: "cat-1", sanitizeHtml });
    expect(mapped).toMatchObject({
      shopifyId: "101",
      sku: "shopify-101",
      title: "Linen Shirt",
      slugBase: "linen-shirt",
      categoryId: "cat-1",
      description: "Soft linen",
      quantity: 4,
      imageUrls: ["https://cdn.shopify.com/s/files/1/a.jpg"],
      warnings: [],
    });
    expect(mapped.content).not.toContain("<script");
    expect(mapped.variants).toEqual([
      expect.objectContaining({ sku: "LS-S-B", option1: "S", option2: "Blue", stock: 4, isDefault: true, imageUrl: "https://cdn.shopify.com/s/files/1/v.jpg" }),
      expect.objectContaining({ sku: "shopify-101-2", option1: "M", stock: 0, isDefault: false, position: 2 }),
    ]);
    expect(mapped.price.final).toBe(199);
  });

  it("drops the single Default Title variant", () => {
    const mapped = mapShopifyProduct(
      node({
        variants: {
          nodes: [
            {
              title: "Default Title",
              sku: "X",
              price: "0.00",
              compareAtPrice: null,
              inventoryQuantity: 7,
              selectedOptions: [{ name: "Title", value: "Default Title" }],
            },
          ],
        },
      }),
      { categoryId: "cat-1", sanitizeHtml },
    );
    expect(mapped.variants).toEqual([]);
    expect(mapped.quantity).toBe(7);
    expect(mapped.warnings).toContain("zero_price");
  });

  it("flags truncated variants and falls back to the sku for an empty handle", () => {
    const mapped = mapShopifyProduct(node({ handle: "", variants: { ...node().variants, pageInfo: { hasNextPage: true } } }), {
      categoryId: "c",
      sanitizeHtml,
    });
    expect(mapped.warnings).toContain("variants_truncated");
    expect(mapped.slugBase).toBe("shopify-101");
  });

  it("maps product types to categories with a default", () => {
    expect(categoryForType(" Shirts ", { Shirts: "cat-shirts" }, "cat-default")).toBe("cat-shirts");
    expect(categoryForType(null, { Shirts: "cat-shirts" }, "cat-default")).toBe("cat-default");
    expect(htmlToSummary("<p>a&amp;b</p>")).toBe("a&b");
  });
});

describe("shopifyGraphql", () => {
  const creds = { shopDomain: "my-shop.myshopify.com", accessToken: TOKEN };

  it("sends the token as a header to the shop's admin endpoint", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ data: { shop: { name: "S" } } })));
    expect(await shopifyGraphql(creds, "{ shop { name } }", {}, { fetchImpl: fetchImpl as unknown as typeof fetch })).toEqual({
      ok: true,
      data: { shop: { name: "S" } },
    });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://my-shop.myshopify.com/admin/api/2026-04/graphql.json");
    expect(url).not.toContain(TOKEN);
    expect((init.headers as Record<string, string>)["X-Shopify-Access-Token"]).toBe(TOKEN);
  });

  it("maps auth, scope, throttling and network errors", async () => {
    const respond = (body: unknown, status = 200) =>
      vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
    expect(await shopifyGraphql(creds, "q", {}, { fetchImpl: respond({}, 401) })).toEqual({ ok: false, error: "auth" });
    expect(await shopifyGraphql(creds, "q", {}, { fetchImpl: respond({ errors: [{ extensions: { code: "ACCESS_DENIED" } }] }) })).toEqual({
      ok: false,
      error: "scope",
    });
    expect(await shopifyGraphql(creds, "q", {}, { fetchImpl: respond({ errors: [{ extensions: { code: "THROTTLED" } }] }) })).toEqual({
      ok: false,
      error: "throttled",
    });
    const down = vi.fn(async () => {
      throw new Error("ENOTFOUND");
    }) as unknown as typeof fetch;
    expect(await shopifyGraphql(creds, "q", {}, { fetchImpl: down })).toEqual({ ok: false, error: "unreachable" });
    expect(await shopifyGraphql({ ...creds, shopDomain: "evil.com" }, "q", {}, { fetchImpl: down })).toEqual({ ok: false, error: "auth" });
  });
});
