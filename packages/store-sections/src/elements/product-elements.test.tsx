import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../config/schema";
import { DEMO_PRODUCT } from "../core/demo-product";
import type { ProductDetail, RenderContext } from "../core/types";
import { treeBuilder } from "../designs/builder";
import { PALETTE_TYPES, getElementDefinition } from "./registry";
import { renderElementTree } from "./render";
import { canContain } from "./tree";
import { ProductCardView } from "../sections/_primitives";

const node = (type: string, props: Record<string, unknown> = {}): ComponentNode => ({ id: `n-${type}`, type, props, children: [] }) as ComponentNode;

const ctx = (over: Partial<RenderContext> = {}): RenderContext => ({
  mode: "edit",
  locale: "en",
  dir: "ltr",
  store: { name: "Store", url: "https://x.tallaby.com" },
  pages: [],
  catalog: { products: {}, categories: [] },
  Link: ({ href, children }) => <a href={href}>{children}</a>,
  imageUrl: (src) => src || null,
  formatPrice: (n) => `EGP ${n}`,
  ...over,
});

const product: ProductDetail = {
  ...DEMO_PRODUCT,
  title: "Earbuds",
  image: "https://cdn.test/a.jpg",
  images: ["https://cdn.test/a.jpg", "https://cdn.test/b.jpg"],
  price: 900,
  compareAtPrice: 1200,
  discountPercent: 25,
};

/** Draws one node the way a product page does: inside the product's scope. */
const draw = (n: ComponentNode, p: ProductDetail | null = product, over: Partial<RenderContext> = {}) =>
  renderToStaticMarkup(<>{renderElementTree([n], ctx({ ...over, ...(p && { product: p }) }), 1, p ? { kind: "product", record: p } : undefined)}</>);

const PRODUCT_TYPES = [
  "productBreadcrumbs",
  "productGallery",
  "productPrice",
  "productStock",
  "productStockBadge",
  "productRating",
  "productVariants",
  "productBuyBox",
  "productDetails",
  "productContent",
  "productSeller",
  "productReviews",
];

describe("product elements", () => {
  it("are registered in the product group, in the palette, with bilingual fields", () => {
    for (const type of PRODUCT_TYPES) {
      const definition = getElementDefinition(type);
      expect(definition?.group, type).toBe("product");
      expect(PALETTE_TYPES).toContain(type);
      for (const field of definition!.fields) expect(field.label.ar && field.label.en, `${type}.${field.key}`).toBeTruthy();
      expect(draw(node(type, definition!.defaultProps)), type).toContain(`data-node-type="${type}"`);
    }
  });

  it("interactive product parts never go inside a link", () => {
    const link = { ...node("linkBlock", { href: "/" }), id: "link" };
    const tree = [{ ...node("section"), id: "root", children: [link] }];
    for (const type of ["productBreadcrumbs", "productGallery", "productRating", "productVariants", "productBuyBox", "productDetails", "productContent", "productReviews"]) {
      expect(canContain(tree, "link", node(type)), type).toBe(false);
      expect(canContain(tree, "root", node(type)), type).toBe(true);
    }
    // Plain text parts may sit in a link card.
    for (const type of ["productPrice", "productStock", "productStockBadge", "productSeller"]) expect(canContain(tree, "link", node(type)), type).toBe(true);
  });

  it("productStockBadge shows the seller's alert only when it applies (F-34d)", () => {
    const alert = { show: true, threshold: 3 };
    const pub = { mode: "public" as const };
    const html = draw(node("productStockBadge"), { ...product, quantity: 2, lowStockAlert: alert }, pub);
    expect(html).toContain('data-node-type="productStockBadge"');
    expect(html).toContain("Only 2 left, order before it");
    // Above the threshold, sold out, or alert off: nothing on the storefront.
    expect(draw(node("productStockBadge"), { ...product, quantity: 4, lowStockAlert: alert }, pub)).toBe("");
    const soldOut = { ...product, quantity: 0, variants: product.variants.map((v) => ({ ...v, quantity: 0 })), lowStockAlert: alert };
    expect(draw(node("productStockBadge"), soldOut, pub)).toBe("");
    expect(draw(node("productStockBadge"), { ...product, quantity: 2, lowStockAlert: null }, pub)).toBe("");
    // The editor draws a sample so the seller can select and style it.
    const sample = draw(node("productStockBadge"), { ...product, quantity: 24, lowStockAlert: null });
    expect(sample).toContain("data-sample");
    expect(sample).toContain("Only 2 left");
  });

  it("productStockBadge uses the storefront hook, and the stock line steps aside while the page has one", () => {
    const alert = { show: true, threshold: 3 };
    const low = { ...product, quantity: 2, lowStockAlert: alert };
    const seen: Record<string, unknown>[] = [];
    const hooks = {
      mode: "public" as const,
      renderProductStockBadge: () => <i>badge-hook</i>,
      renderProductStock: (_p: ProductDetail, props: Record<string, unknown>) => {
        seen.push(props);
        return <i>stock-hook</i>;
      },
    };
    expect(draw(node("productStockBadge"), low, hooks)).toContain("badge-hook");
    draw(node("productStock"), low, hooks);
    draw(node("productStock"), low, { ...hooks, stockBadgeOnPage: true });
    expect(seen[0]?.lowStockAlertElsewhere).toBeUndefined();
    expect(seen[1]?.lowStockAlertElsewhere).toBe(true);
    // The still stock line: no alert (and no "Only 2 left" pill) when the badge carries it; the pill otherwise.
    expect(draw(node("productStock"), low, { mode: "public", stockBadgeOnPage: true })).toBe("");
    expect(draw(node("productStock"), { ...low, quantity: 24 }, { mode: "public", stockBadgeOnPage: true })).toContain("In stock");
    expect(draw(node("productStock"), low, { mode: "public" })).toContain("order before it");
  });

  it("productStockBadge in a product list card shows the card's N left", () => {
    const card = (stockLeft: number | null, mode: "edit" | "public" = "public") =>
      renderToStaticMarkup(
        <>
          {renderElementTree([node("productStockBadge")], ctx({ mode }), 1, {
            kind: "productList",
            record: { id: "p", title: "Mug", href: "/products/mug", image: null, price: 100, inStock: true, stockLeft },
          })}
        </>,
      );
    expect(card(3)).toContain("3 left");
    expect(card(null)).toBe("");
    expect(card(null, "edit")).toContain("data-sample");
  });

  it("productGallery without images draws placeholder", () => {
    const html = draw(node("productGallery", { thumbs: "side" }), { ...product, image: null, images: [] });
    expect(html).toContain('data-part="gallery-placeholder"');
    expect(html).not.toContain("<img");
  });

  it("productGallery one image has no thumbs strip", () => {
    const one = draw(node("productGallery", { thumbs: "bottom" }), { ...product, images: ["https://cdn.test/a.jpg"] });
    expect(one).toContain('src="https://cdn.test/a.jpg"');
    expect(one).not.toContain('data-part="thumbs"');
    expect(draw(node("productGallery", { thumbs: "bottom" }))).toContain('data-part="thumbs"');
    expect(draw(node("productGallery", { thumbs: "none" }))).not.toContain('data-part="thumbs"');
  });

  it("productPrice shows final and struck list price", () => {
    const html = draw(node("productPrice", { showDiscount: true }));
    expect(html).toContain("EGP 900");
    expect(html).toMatch(/<s[^>]*>EGP 1200<\/s>/);
    expect(html).toContain("Save EGP 300");
    expect(draw(node("productPrice", { showDiscount: false }))).not.toContain("Save EGP");
    // The percentage sits on the gallery's photo.
    expect(draw(node("productGallery"))).toContain("-25%");
  });

  it("productStock all variants out of stock says out of stock", () => {
    const soldOut = { ...product, quantity: 0, variants: product.variants.map((v) => ({ ...v, quantity: 0 })) };
    expect(draw(node("productStock"), soldOut)).toContain("Out of stock");
    expect(draw(node("productStock"), { ...product, quantity: 3 })).toContain("Only 3 left");
    expect(draw(node("productStock"), { ...product, quantity: 24 })).toContain("In stock");
  });

  it("productStock shows the seller low-stock alert instead of the pill (F-34)", () => {
    const alert = { show: true, threshold: 3 };
    const html = draw(node("productStock"), { ...product, quantity: 2, lowStockAlert: alert });
    expect(html).toContain("Only 2 left, order before it");
    expect(html).not.toContain("Only 2 left<");
    expect(html).toContain(`data-stock="alert"`);
    // Above the threshold, sold out, or off: the usual pill.
    expect(draw(node("productStock"), { ...product, quantity: 4, lowStockAlert: alert })).toContain("Only 4 left");
    const soldOut = { ...product, quantity: 0, variants: product.variants.map((v) => ({ ...v, quantity: 0 })), lowStockAlert: alert };
    expect(draw(node("productStock"), soldOut)).toContain("Out of stock");
    expect(draw(node("productStock"), { ...product, quantity: 2, lowStockAlert: { show: false, threshold: 3 } })).not.toContain("alert");
  });

  it("productCard shows the card tag only when the host set stockLeft", () => {
    const card = (stockLeft: number | null) =>
      renderToStaticMarkup(<ProductCardView product={{ id: "p", title: "Mug", href: "/products/mug", image: null, price: 100, inStock: true, stockLeft }} ctx={ctx()} />);
    expect(card(2)).toContain("2 left");
    expect(card(null)).not.toContain("left");
  });

  it("productBuyBox edit mode buttons are inert (no href, disabled)", () => {
    const html = draw(node("productBuyBox", { buyNow: true }));
    expect(html).not.toContain("href=");
    expect(html).toContain("Add to cart");
    expect(html).toContain("Buy now");
    expect(html.match(/<button[^>]*disabled/g)?.length).toBeGreaterThanOrEqual(2);
    expect(draw(node("productBuyBox", { buyNow: false }))).not.toContain("Buy now");
    // The seller's own label, and a sold-out product reads as such.
    const soldOut = { ...product, quantity: 0, variants: product.variants.map((v) => ({ ...v, quantity: 0 })) };
    expect(draw(node("productBuyBox", { addLabel: "Grab it" }))).toContain("Grab it");
    expect(draw(node("productBuyBox", {}), soldOut)).toContain("Out of stock");
  });

  it("productBuyBox outline variant draws the cart button in brand lines and fills buy now", () => {
    const buttons = (html: string) => html.match(/<button[^>]*data-part="(?:add-to-cart|buy-now)"[^>]*>/g) ?? [];
    const [solidCart, solidBuy] = buttons(draw(node("productBuyBox", { buyNow: true })));
    expect(solidCart).toContain("bg-(--sf-brand)");
    expect(solidBuy).toContain("bg-(--sf-ink)");
    const [cart, buy] = buttons(draw(node("productBuyBox", { buyNow: true, variant: "outline" })));
    expect(cart).toContain("border-(--sf-brand)");
    expect(cart).toContain("bg-transparent");
    expect(cart).toContain("text-(--sf-brand)");
    expect(cart).not.toContain("bg-(--sf-brand)");
    expect(buy).toContain("bg-(--sf-brand)");
  });

  it("public mode uses host hook when given", () => {
    const html = draw(node("productBuyBox", { buyNow: true }), product, {
      mode: "public",
      renderProductBuyBox: (p, props) => <i>hook {p.title} {String(props.buyNow)}</i>,
    });
    expect(html).toContain("<i>hook Earbuds true</i>");
    expect(html).toContain('data-node-type="productBuyBox"');
    expect(html).not.toContain("Add to cart");
    // Without a hook, the still rendering is the storefront fallback.
    expect(draw(node("productPrice"), product, { mode: "public" })).toContain("EGP 900");
  });

  it("a plain addToCart on the product page never adds a variant product without a variant", () => {
    const hook = { renderAddToCart: (p: { title: string }) => <b>add {p.title}</b> };
    expect(product.variants.length).toBeGreaterThan(0);
    expect(draw(node("addToCart"), product, { mode: "public", ...hook })).toBe("");
    const edit = draw(node("addToCart"), product, hook);
    expect(edit).not.toContain("<b>");
    expect(edit).toContain("Add to cart");
    const simple = { ...product, variants: [] };
    expect(draw(node("addToCart"), simple, { mode: "public", ...hook })).toContain("<b>add Earbuds</b>");
  });

  it("no ctx.product in public renders null", () => {
    for (const type of PRODUCT_TYPES) expect(draw(node(type), null, { mode: "public" }), type).toBe("");
    // The editor still draws a sample product.
    expect(draw(node("productPrice"), null)).toContain('data-node-type="productPrice"');
  });

  it("productContent prints the host-sanitised html verbatim inside its box", () => {
    const contentHtml = '<h2>Specs</h2><p>Hi <a href="https://x.test">there</a></p>';
    const html = draw(node("productContent"), { ...product, contentHtml });
    expect(html).toMatch(new RegExp(`^<div data-node-id="n-productContent" data-node-type="productContent" data-sf-product-page="" class="[^"]*">${contentHtml.replace(/[.?]/g, "\\$&")}</div>$`));
    expect(draw(node("productContent"), { ...product, contentHtml: null }, { mode: "public" })).toBe("");
  });

  it("tree builder makes product nodes with their default props", () => {
    expect(treeBuilder.productGallery()).toMatchObject({ type: "productGallery", props: { thumbs: "side", zoom: true } });
    expect(treeBuilder.productGallery({ thumbs: "bottom", style: { gap: 8 } })).toMatchObject({ props: { thumbs: "bottom" }, style: { gap: 8 } });
    expect(treeBuilder.productBuyBox({ buyNow: false, addLabel: { ar: "اطلب", en: "Order" } }).props).toEqual({
      buyNow: false,
      stickyMobile: true,
      variant: "solid",
      addLabel: "اطلب",
      translations: { en: { addLabel: "Order" } },
    });
    expect(treeBuilder.productReviews().props).toEqual({});
  });

  it("productVariants strikes sold-out chips and productDetails lists bullets", () => {
    const variants = draw(node("productVariants"), { ...product, variants: [product.variants[0]!, { ...product.variants[1]!, quantity: 0 }] });
    // Colour options are round swatches (struck when sold out); the others are pill chips.
    expect(variants).toContain('role="img"');
    expect(variants).toContain("data-sold-out");
    const chips = draw(node("productVariants"), { ...product, variants: product.variants.map((v, i) => ({ ...v, color: null, quantity: i === 1 ? 0 : v.quantity })) });
    expect(chips).toContain("line-through");
    expect(chips).not.toContain('role="img"');
    const withBullets = { ...product, bulletPoints: ["Fast charging"] };
    const details = draw(node("productDetails", { showDescription: true, showBullets: true }), withBullets);
    expect(details).toContain('data-part="highlights"');
    expect(details).toContain("Fast charging");
    // Features open by default whenever there are any, under an open description too (owner, 2026-10-30).
    const rows = details.match(/<details[^>]*>[\s\S]*?<\/details>/g) ?? [];
    const features = rows.find((r) => r.includes('data-part="highlights"')) ?? "";
    expect(rows.length).toBeGreaterThan(1);
    expect(features).toMatch(/^<details[^>]*\sopen=""/);
    expect(draw(node("productDetails", { showDescription: true, showBullets: false }), withBullets)).not.toContain("Fast charging");
  });
});

describe("product page upgrade (breadcrumbs, meta row, perks, delivery)", () => {
  const withCategory: ProductDetail = { ...product, category: { id: "c 1", name: "Audio" } };

  it("productBreadcrumbs is a nav list: home, the linked category, the current product", () => {
    const html = draw(node("productBreadcrumbs"), withCategory, { mode: "public" });
    expect(html).toMatch(/^<nav [^>]*aria-label="Breadcrumb"/);
    expect(html).toContain("<ol");
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/products?category=c%201"');
    expect(html).toMatch(/<li aria-current="page"[^>]*>Earbuds<\/li>/);
    expect(html).toContain("rtl:rotate-180");
    // The host's category link wins; no category, no middle step.
    expect(draw(node("productBreadcrumbs"), { ...product, category: { id: "c", name: "Audio", href: "/c/audio" } }, { mode: "public" })).toContain('href="/c/audio"');
    expect(draw(node("productBreadcrumbs"), { ...product, category: null }, { mode: "public" })).not.toContain("category");
    expect(draw(node("productBreadcrumbs", { showCategory: false }), withCategory, { mode: "public" })).not.toContain("Audio");
    // The editor draws the trail as plain text.
    expect(draw(node("productBreadcrumbs"), withCategory)).not.toContain("href=");
  });

  it("productRating shows the category badge, also before any review", () => {
    const reviewed = draw(node("productRating"), { ...withCategory, reviewCount: 12, rating: 4.8 }, { mode: "public" });
    expect(reviewed).toContain('href="/products?category=c%201"');
    expect(reviewed).toContain("4.8");
    expect(reviewed).toContain('href="#reviews"');
    const unreviewed = draw(node("productRating"), { ...withCategory, reviewCount: 0 }, { mode: "public" });
    expect(unreviewed).toContain("Audio");
    expect(unreviewed).not.toContain("#reviews");
    expect(draw(node("productRating", { showCategory: false }), { ...withCategory, reviewCount: 0 }, { mode: "public" })).toBe("");
  });

  it("productBuyBox draws the perks box after the buy box, also beside the host's buy box", () => {
    const still = draw(node("productBuyBox"));
    expect(still).toContain('data-part="perks"');
    expect(still.indexOf('data-part="perks"')).toBeGreaterThan(still.indexOf('data-part="add-to-cart"'));
    expect(draw(node("productBuyBox", { perks: false }))).not.toContain('data-part="perks"');
    const hooked = draw(node("productBuyBox"), product, { mode: "public", renderProductBuyBox: () => <i>live</i> });
    expect(hooked).toMatch(/<i>live<\/i><div[^>]*><ul data-part="perks"/);
    expect(hooked).toContain("Pay on delivery");
    // A store without cash on delivery gets the secure payment perk instead.
    const noCod = draw(node("productBuyBox"), product, { store: { name: "S", url: "/", paymentMethods: [{ key: "card" }] } });
    expect(noCod).not.toContain("Pay on delivery");
    expect(noCod).toContain("Secure payment");
  });

  it("productDetails has a delivery & returns row with the seller's text or the general note", () => {
    expect(draw(node("productDetails"))).toContain("Delivery &amp; returns");
    expect(draw(node("productDetails"))).toContain("The exact delivery fee shows at checkout");
    expect(draw(node("productDetails", { deliveryText: "Ships in 2 days." }))).toContain("Ships in 2 days.");
    expect(draw(node("productDetails", { showDelivery: false }))).not.toContain("Delivery &amp; returns");
    const policy = draw(node("productDetails"), product, { mode: "public", store: { name: "S", url: "/", policies: [{ key: "return", href: "/policies/return" }] } });
    expect(policy).toContain('href="/policies/return"');
  });
});

describe("product sections with nothing to show", () => {
  const section = (children: ComponentNode[]): ComponentNode => ({ id: "s-1", type: "section", props: {}, children }) as ComponentNode;
  const heading = { id: "h-1", type: "heading", props: { text: "About this product", level: "h2" }, children: [] } as unknown as ComponentNode;
  const empty: ProductDetail = { ...product, contentHtml: null, reviewCount: 0, variants: [], description: null, bulletPoints: [], category: null };
  const publicDraw = (n: ComponentNode, p: ProductDetail | null) => draw(n, p, { mode: "public" });

  it("draw no band publicly when every product part in them is empty for this product", () => {
    expect(publicDraw(section([heading, node("productContent")]), empty)).toBe("");
    expect(publicDraw(section([node("productRating"), node("productVariants"), node("productDetails", { showDelivery: false })]), empty)).toBe("");
    // Details with only the description switched off, no bullets and no delivery row: nothing either.
    expect(publicDraw(section([node("productDetails", { showDescription: false, showDelivery: false })]), { ...empty, description: "Soft." })).toBe("");
  });

  it("keep the band when one product part draws something", () => {
    // The delivery & returns row is on by default, so details always draw something.
    expect(publicDraw(section([node("productDetails")]), empty)).toContain("<section");
    const withContent = { ...empty, contentHtml: "<p>Hi</p>" };
    expect(publicDraw(section([heading, node("productContent")]), withContent)).toContain("<section");
    expect(publicDraw(section([node("productContent"), node("productReviews")]), empty)).toContain("<section");
  });

  it("keep the band when it holds the seller's own content beside an empty product part", () => {
    const paragraph = { id: "p-1", type: "paragraph", props: { text: "Free returns for 14 days." }, children: [] } as unknown as ComponentNode;
    const photo = { id: "i-1", type: "image", props: { src: "https://cdn.test/x.jpg", alt: "" }, children: [] } as unknown as ComponentNode;
    expect(publicDraw(section([heading, paragraph, node("productContent")]), empty)).toContain("Free returns for 14 days.");
    expect(publicDraw(section([photo, node("productRating")]), empty)).toContain("<section");
    // Layout around the heading and the part is still only a frame.
    const box = { id: "b-1", type: "vFlex", props: {}, children: [heading, node("productContent")] } as unknown as ComponentNode;
    expect(publicDraw(section([box]), empty)).toBe("");
  });

  it("count a product part hidden on every device as empty", () => {
    const hidden = {
      ...node("productReviews"),
      style: { hidden: true },
      breakpointStyles: { tablet: { hidden: true }, mobile: { hidden: true } },
    } as ComponentNode;
    expect(publicDraw(section([heading, hidden]), empty)).toBe("");
    const desktopOnly = { ...hidden, breakpointStyles: { tablet: { hidden: true } } } as ComponentNode;
    expect(publicDraw(section([heading, desktopOnly]), empty)).toContain("<section");
  });

  it("leave sections without product parts and the editor alone", () => {
    expect(publicDraw(section([heading]), empty)).toContain("<section");
    expect(publicDraw(section([heading]), null)).toContain("<section");
    expect(draw(section([heading, node("productContent")]), empty)).toContain("<section");
    expect(draw(section([heading, node("productPrice")]), null)).toContain("<section");
  });

  it("draw no band publicly for a product section on a page without a product", () => {
    expect(publicDraw(section([heading, node("productContent")]), null)).toBe("");
    expect(publicDraw(section([node("productGallery"), node("productPrice"), node("productBuyBox")]), null)).toBe("");
    // The seller's own content beside the parts keeps the band.
    const paragraph = { id: "p-1", type: "paragraph", props: { text: "Free returns." }, children: [] } as unknown as ComponentNode;
    expect(publicDraw(section([paragraph, node("productPrice")]), null)).toContain("Free returns.");
  });
});
