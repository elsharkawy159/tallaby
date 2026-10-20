/**
 * Atelier pieces (luxury editorial, Claude Design "Storefront Templates" 01):
 * serif display type, small tracked labels, square corners, hairlines and no
 * shadows. Every helper returns ordinary element nodes with Layers labels, so
 * the seller can select, restyle and move each part.
 */
import type { StyleValues } from "../../elements/style";
import type { NodeTemplate } from "../../elements/tree";
import type { DesignText, NodeOptions, TreeBuilder } from "../../designs/builder";
import { L } from "../../designs/_kit";

/** No padding (link blocks carry 12px by default). */
export const FLUSH: StyleValues = { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 };

/** Serif display heading. */
export const DISPLAY: StyleValues = { fontFamily: "heading", fontWeight: "medium", lineHeight: "tight", letterSpacing: "normal" };

/** Section rhythm: generous on desktop, tighter on phones. */
export const SECTION: { style: StyleValues; mobile: StyleValues } = {
  style: { paddingTop: 96, paddingBottom: 96 },
  mobile: { paddingTop: 56, paddingBottom: 56 },
};

/** Store links every Atelier section uses. */
export const LINKS = {
  shop: "/products",
  newIn: "/products?sort=newest",
  about: "/about",
  contact: "/contact",
  faq: "/faq",
  journal: "/blog",
  cart: "/cart",
  account: "/profile",
  wishlist: "/profile/wishlist",
  orders: "/profile/orders",
  shipping: "/shipping",
  returns: "/returns",
  privacy: "/privacy",
  terms: "/terms",
} as const;

/** A small tracked label with a short gold rule before it. */
export function eyebrow(t: TreeBuilder, text: DesignText, opts: NodeOptions = {}): NodeTemplate {
  return t.row(
    [
      t.box([], { label: L("خط", "Rule"), style: { background: "accent", width: "28px", minHeight: 1 } }),
      t.text(text, {
        role: "eyebrow",
        style: { fontSize: "xs", fontWeight: "medium", letterSpacing: "wider", textTransform: "uppercase", color: "muted" },
      }),
    ],
    { label: L("العنوان الصغير", "Eyebrow"), ...opts, style: { gap: 12, alignItems: "center", wrap: false, ...opts.style } },
  );
}

/** A tracked text link with an arrow (no padding). */
export function textArrow(t: TreeBuilder, text: DesignText, href: string, opts: NodeOptions = {}): NodeTemplate {
  return t.link(
    href,
    [
      t.row(
        [
          t.text(text, { style: { fontSize: "xs", fontWeight: "medium", letterSpacing: "wider", textTransform: "uppercase" } }),
          t.icon("arrow", { style: { fontSize: "sm" } }),
        ],
        { label: L("نص الرابط", "Link text"), style: { gap: 8, wrap: false, alignItems: "center" } },
      ),
    ],
    {
      label: L("رابط", "Link"),
      role: "link",
      ...opts,
      style: { ...FLUSH, paddingBottom: 4, color: "foreground", borderColor: "foreground", hover: { opacity: 70 }, ...opts.style },
    },
  );
}

/** The section heading: eyebrow, serif title and a line, with an optional link at the end. */
export function head(
  t: TreeBuilder,
  o: { eyebrow?: DesignText; title: DesignText; text?: DesignText; link?: { text: DesignText; href: string }; center?: boolean },
): NodeTemplate {
  const copy = t.stack(
    [
      ...(o.eyebrow ? [eyebrow(t, o.eyebrow, o.center ? { style: { justifyContent: "center" } } : {})] : []),
      t.heading(o.title, "h2", { role: "title", style: { ...DISPLAY, fontSize: "display-md", ...(o.center && { textAlign: "center" }) } }),
      ...(o.text
        ? [t.paragraph(o.text, { role: "subtitle", style: { maxWidth: "560px", color: "muted", ...(o.center && { textAlign: "center" }) } })]
        : []),
    ],
    { label: L("العنوان", "Heading"), role: "intro", style: { gap: 14, ...(o.center && { alignItems: "center" }) } },
  );
  if (!o.link) return o.center ? t.box([copy], { label: L("رأس القسم", "Section head"), style: { marginBottom: 48 }, mobile: { marginBottom: 28 } }) : copy;
  return t.row([copy, textArrow(t, o.link.text, o.link.href)], {
    label: L("رأس القسم", "Section head"),
    style: { justifyContent: "between", alignItems: "end", gap: 24, marginBottom: 48 },
    mobile: { marginBottom: 28, gap: 16 },
  });
}

/** A square-cornered photo. */
export function photo(t: TreeBuilder, src: string, alt: DesignText, ratio: StyleValues["aspectRatio"], opts: NodeOptions = {}): NodeTemplate {
  return t.image(src, alt, { role: "image", ...opts, style: { aspectRatio: ratio, objectFit: "cover", radius: 0, width: "100%", ...opts.style } });
}

/** A solid or outlined square button with tracked capitals. */
export function button(t: TreeBuilder, label: DesignText, href: string, variant: "solid" | "outline" = "solid", opts: NodeOptions = {}): NodeTemplate {
  return t.button(label, href, variant, { role: "cta", ...opts, style: { letterSpacing: "wide", textTransform: "uppercase", ...opts.style } });
}

const PRODUCT = L("اسم القطعة", "Piece name");
const PRICE = L("٣٬٤٥٠ ج.م", "EGP 3,450");
const WAS = L("٤٬٢٠٠ ج.م", "EGP 4,200");

/** Price and, when the product has one, its list price. */
export function priceLine(t: TreeBuilder, style: StyleValues = {}): NodeTemplate {
  return t.row(
    [
      t.text(PRICE, { bind: "price", style: { fontWeight: "medium", ...style } }),
      t.text(WAS, { bind: "compareAtPrice", style: { color: "muted", fontSize: "sm", italic: true } }),
    ],
    { label: L("السعر", "Price"), style: { gap: 10, alignItems: "center" } },
  );
}

/**
 * The Atelier product card: a portrait photo with the wishlist heart and the
 * sale chip on its corners, a serif name, the price and the cart button.
 * Every visible field is bound to the product the list repeats it for.
 */
export function productCard(t: TreeBuilder, o: { ratio?: StyleValues["aspectRatio"]; nameSize?: StyleValues["fontSize"] } = {}): NodeTemplate {
  return t.stack(
    [
      t.box(
        [
          t.link(LINKS.shop, [t.image("", PRODUCT, { bind: "image", style: { aspectRatio: o.ratio ?? "portrait", objectFit: "cover", radius: 0, width: "100%" } })], {
            label: L("صورة القطعة", "Piece photo"),
            bind: "href",
            style: { ...FLUSH, overflow: "hidden", background: "secondary", hover: { opacity: 92 } },
          }),
          t.badge(L("-٢٠٪", "-20%"), {
            bind: "discount",
            style: {
              position: "absolute",
              insetTop: "12px",
              insetStart: "12px",
              radius: 0,
              background: "background",
              color: "foreground",
              borderWidth: 1,
              borderColor: "foreground",
              fontWeight: "medium",
            },
          }),
          t.wishlistButton({
            label: L("المفضلة", "Wishlist"),
            style: { position: "absolute", insetTop: "8px", insetEnd: "8px" },
          }),
        ],
        { label: L("الصورة", "Photo"), style: { ...FLUSH, position: "relative", background: "transparent" } },
      ),
      t.stack(
        [
          t.link(LINKS.shop, [t.text(PRODUCT, { bind: "title", style: { ...DISPLAY, fontSize: o.nameSize ?? "xl", lineHeight: "snug" } })], {
            label: L("اسم القطعة", "Piece name"),
            bind: "href",
            style: { ...FLUSH, color: "foreground" },
          }),
          priceLine(t),
        ],
        { label: L("المعلومات", "Details"), style: { gap: 6 } },
      ),
      t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
    ],
    { label: L("بطاقة القطعة", "Product card"), style: { gap: 14 } },
  );
}
