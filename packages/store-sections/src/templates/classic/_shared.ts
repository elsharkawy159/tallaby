/**
 * Tallaby Classic pieces (Claude Design "Tallaby Classic Template"): a deep
 * teal brand with an amber accent, warm off-white paper, rounded cards and
 * pill buttons. Colours are design-system tokens (primary, accent,
 * secondary…), so a seller's own design system restyles the whole template.
 * Every helper returns ordinary element nodes with Layers labels.
 */
import type { StyleValues } from "../../elements/style";
import type { NodeTemplate } from "../../elements/tree";
import type { DesignText, NodeOptions, TreeBuilder } from "../../designs/builder";
import { L } from "../../designs/_kit";

/** No padding (link blocks carry 12px by default). */
export const FLUSH: StyleValues = { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 };

/** Section rhythm (docs/template-rules.md §6): 64px on desktop, 40px on phones, the same gap above every section. */
export const SECTION: { style: StyleValues; mobile: StyleValues } = {
  style: { paddingTop: 64, paddingBottom: 0 },
  mobile: { paddingTop: 40, paddingBottom: 0 },
};

/** The design's sale red (not a design-system colour). */
export const SALE = "#c63b3b";

/** Store links the Classic sections use (system pages and the template's own pages). */
export const LINKS = {
  home: "/",
  shop: "/products",
  newest: "/products?sort=newest",
  bestSellers: "/products?sort=popularity",
  blog: "/blog",
  about: "/about",
  contact: "/contact",
  faq: "/faq",
  privacy: "/privacy",
  terms: "/terms",
  shipping: "/shipping",
  returns: "/returns",
  cart: "/cart",
  account: "/profile",
  wishlist: "/profile/wishlist",
  orders: "/profile/orders",
} as const;

/** A small amber dot and a short label in the brand colour. */
export function eyebrow(t: TreeBuilder, text: DesignText, opts: NodeOptions = {}): NodeTemplate {
  return t.row(
    [
      t.box([], { label: L("نقطة", "Dot"), style: { background: "accent", width: "8px", minHeight: 8, radius: 999 } }),
      t.text(text, {
        role: "eyebrow",
        style: { fontSize: "sm", fontWeight: "semibold", color: "primary" },
      }),
    ],
    { label: L("العنوان الصغير", "Eyebrow"), ...opts, style: { gap: 8, alignItems: "center", wrap: false, ...opts.style } },
  );
}

/** "View all" with an arrow, as one link. */
export function moreLink(t: TreeBuilder, text: DesignText, href: string): NodeTemplate {
  return t.link(
    href,
    [
      t.row([t.text(text, { style: { fontWeight: "bold", fontSize: "sm" } }), t.icon("arrow", { style: { fontSize: "md" } })], {
        label: L("نص الرابط", "Link text"),
        style: { gap: 6, wrap: false, alignItems: "center" },
      }),
    ],
    { label: L("رابط", "Link"), role: "link", style: { ...FLUSH, color: "primary", hover: { opacity: 75 } } },
  );
}

/** The section heading: an optional eyebrow and a bold title, with an optional link at the end. */
export function sectionHead(t: TreeBuilder, o: { eyebrow?: DesignText; title: DesignText; link?: { text: DesignText; href: string } }): NodeTemplate {
  const copy = t.stack(
    [
      ...(o.eyebrow ? [eyebrow(t, o.eyebrow)] : []),
      t.heading(o.title, "h2", { role: "title", style: { fontSize: "display-sm", fontWeight: "extrabold", lineHeight: "tight" } }),
    ],
    { label: L("العنوان", "Heading"), role: "intro", style: { gap: 6 } },
  );
  return t.row([copy, ...(o.link ? [moreLink(t, o.link.text, o.link.href)] : [])], {
    label: L("رأس القسم", "Section head"),
    style: { justifyContent: "between", alignItems: "end", gap: 16, marginBottom: 24 },
  });
}

/** A pill button: amber (`accent`), brand (`solid`) or white with a border (`outline`). */
export function pill(t: TreeBuilder, label: DesignText, href: string, variant: "accent" | "solid" | "outline" = "solid", opts: NodeOptions = {}): NodeTemplate {
  const look: StyleValues =
    variant === "accent"
      ? { background: "accent", color: "foreground", borderColor: "accent", hover: { opacity: 90 } }
      : variant === "outline"
        ? { background: "background", color: "foreground", borderWidth: 1, borderColor: "border", hover: { background: "secondary" } }
        : {};
  return t.button(label, href, variant === "outline" ? "outline" : "solid", {
    role: "cta",
    ...opts,
    style: { radius: 999, fontWeight: "bold", paddingStart: 24, paddingEnd: 24, ...look, ...opts.style },
  });
}

/** A rounded white card with a hairline border (white on the warm page colour, as in the design). */
export const CARD: StyleValues = { background: "white", borderWidth: 1, borderColor: "border", radius: 16 };

const PRODUCT = L("اسم المنتج", "Product name");
const PRICE = L("١٬٧٣٠ ج.م", "EGP 1,730");
const WAS = L("٢٬١٠٠ ج.م", "EGP 2,100");

/**
 * The Classic product card: the photo on a soft tile with the sale badge and
 * wishlist heart on its corners, the name, the price and the cart button.
 * Every visible field is bound to the product the list repeats it for.
 */
export function productCard(t: TreeBuilder): NodeTemplate {
  return t.stack(
    [
      t.box(
        [
          t.link(LINKS.shop, [t.image("", PRODUCT, { bind: "image", style: { aspectRatio: "square", objectFit: "cover", width: "100%", radius: 11 } })], {
            label: L("صورة المنتج", "Product photo"),
            bind: "href",
            style: { ...FLUSH, background: "secondary", radius: 11, overflow: "hidden", hover: { opacity: 92 } },
          }),
          t.badge(L("-١٨٪", "-18%"), {
            bind: "discount",
            style: { position: "absolute", insetTop: "8px", insetStart: "8px", background: SALE, color: "white", radius: 999, fontWeight: "bold" },
          }),
          t.wishlistButton({
            label: L("المفضلة", "Wishlist"),
            style: { position: "absolute", insetTop: "6px", insetEnd: "6px" },
          }),
        ],
        { label: L("الصورة", "Photo"), style: { position: "relative", paddingTop: 6, paddingBottom: 0, paddingStart: 6, paddingEnd: 6 } },
      ),
      t.stack(
        [
          t.link(LINKS.shop, [t.text(PRODUCT, { bind: "title", style: { fontWeight: "semibold", lineHeight: "snug" } })], {
            label: L("اسم المنتج", "Product name"),
            bind: "href",
            style: { ...FLUSH, color: "foreground", hover: { color: "primary" } },
          }),
          t.row(
            [
              t.text(PRICE, { bind: "price", style: { fontWeight: "extrabold", fontSize: "lg" } }),
              t.text(WAS, { bind: "compareAtPrice", style: { color: "muted", fontSize: "xs" } }),
            ],
            { label: L("السعر", "Price"), style: { gap: 8, alignItems: "center" } },
          ),
          t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
        ],
        { label: L("المعلومات", "Details"), style: { gap: 6, paddingTop: 8, paddingBottom: 14, paddingStart: 14, paddingEnd: 14 } },
      ),
    ],
    { label: L("بطاقة المنتج", "Product card"), style: { ...CARD, overflow: "hidden", gap: 0, hover: { shadow: "md" } } },
  );
}

/** The products grid every Classic product section uses. */
export function productGrid(t: TreeBuilder, o: { source: "all" | "newest" | "featured" | "discounted" | "best-sellers"; limit: number; sort?: "rating" | "newest" }): NodeTemplate {
  return t.productList([productCard(t)], {
    label: L("المنتجات", "Products"),
    role: "items",
    source: o.source,
    ...(o.sort && { sort: o.sort }),
    limit: o.limit,
    columns: { desktop: 4, tablet: 3, mobile: 2 },
    style: { gap: 20 },
    mobile: { gap: 12 },
  });
}
