/**
 * Pieces shared by the product designs of the Claude Design premium set
 * (2026-10-27): a heading block without margins (the parent `stack` spaces
 * it with `gap`), the product photo with its sale chip and wishlist heart,
 * a bound rating line and the plain portrait product card. Every product
 * field is bound to the record the list repeats the card for.
 */
import type { StyleValues } from "../../elements/style";
import type { NodeTemplate } from "../../elements/tree";
import type { DesignText, TreeBuilder } from "../builder";
import { L, arrowLink } from "../_kit";
import { PRODUCT_NAME, SHOP_LINK, priceRow, productName } from "./_shared";

const NO_PAD: StyleValues = { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 };

type HeadOptions = {
  eyebrow?: DesignText;
  title: DesignText;
  subtitle?: DesignText;
  center?: boolean;
  /** "View all" at the end of the row (under the heading on phones). */
  link?: { href: string; text?: DesignText };
};

/** The section heading: an optional eyebrow, the `h2` and a line, with "View all" at the end. */
export function premiumHead(t: TreeBuilder, o: HeadOptions): NodeTemplate {
  const center = o.center === true;
  const copy = t.stack(
    [
      ...(o.eyebrow
        ? [t.text(o.eyebrow, { role: "eyebrow", style: { color: "muted", fontSize: "sm", fontWeight: "semibold", ...(center && { textAlign: "center" }) } })]
        : []),
      t.heading(o.title, "h2", {
        role: "title",
        style: { fontSize: "display-sm", lineHeight: "tight", ...(center && { textAlign: "center" }) },
      }),
      ...(o.subtitle
        ? [t.paragraph(o.subtitle, { role: "subtitle", style: { maxWidth: "560px", ...(center && { textAlign: "center" }) } })]
        : []),
    ],
    { label: L("العنوان", "Heading"), role: "intro", style: { gap: 8, ...(center && { alignItems: "center" }) } },
  );
  if (!o.link) return copy;
  return t.row([copy, arrowLink(t, o.link.text ?? L("عرض الكل", "View all"), o.link.href, { style: { color: "foreground" } })], {
    label: L("رأس القسم", "Section head"),
    style: { justifyContent: "between", alignItems: "end", gap: 16 },
    mobile: { direction: "column", alignItems: "start", gap: 10 },
  });
}

type PhotoOptions = {
  ratio?: StyleValues["aspectRatio"];
  radius?: number;
  /** Space between the frame and the photo (a packshot on a soft square). */
  inset?: number;
  /** Frame colour behind the photo. */
  frame?: string;
  wishlist?: boolean;
};

/** The product photo as a link, with the sale chip at the start and (optionally) the wishlist heart at the end. */
export function premiumPhoto(t: TreeBuilder, o: PhotoOptions = {}): NodeTemplate {
  const radius = o.radius ?? 16;
  const inset = o.inset ?? 0;
  return t.box(
    [
      t.link(
        SHOP_LINK,
        [
          t.image("", PRODUCT_NAME, {
            bind: "image",
            style: { aspectRatio: o.ratio ?? "portrait", objectFit: "cover", width: "100%", ...(inset > 0 && { radius: Math.max(radius - 6, 6) }) },
          }),
        ],
        {
          label: L("صورة المنتج", "Product photo"),
          bind: "href",
          style: { paddingTop: inset, paddingBottom: inset, paddingStart: inset, paddingEnd: inset, radius, overflow: "hidden", background: o.frame ?? "secondary" },
          ...(inset > 0 && { mobile: { paddingTop: 10, paddingBottom: 10, paddingStart: 10, paddingEnd: 10 } }),
        },
      ),
      t.badge(L("-٢٠٪", "-20%"), {
        bind: "discount",
        style: { position: "absolute", insetTop: "10px", insetStart: "10px", background: "primary", color: "primaryInk", fontWeight: "semibold", fontSize: "xs", radius: 999 },
      }),
      ...(o.wishlist
        ? [t.wishlistButton({ label: L("المفضلة", "Wishlist"), style: { position: "absolute", insetTop: "8px", insetEnd: "8px" } })]
        : []),
    ],
    { label: L("الصورة", "Photo"), style: { position: "relative", ...NO_PAD, background: "transparent" } },
  );
}

const N_RATING = L("٤٫٨", "4.8");

/** A star and the product's average rating (the number is left out when it has no reviews). */
export function ratingLine(t: TreeBuilder): NodeTemplate {
  return t.row(
    [
      t.icon("star", { style: { color: "accent", fontSize: "sm" } }),
      t.text(N_RATING, { bind: "rating", style: { color: "muted", fontSize: "xs", fontWeight: "medium" } }),
    ],
    { label: L("التقييم", "Rating"), style: { gap: 4, wrap: false, alignItems: "center" } },
  );
}

/** The plain portrait card: photo with chip and heart, name, price and the cart button. No border. */
export function plainCard(t: TreeBuilder, o: { ratio?: StyleValues["aspectRatio"] } = {}): NodeTemplate {
  return t.stack(
    [
      premiumPhoto(t, { ratio: o.ratio ?? "portrait", wishlist: true }),
      t.stack([productName(t, { fontWeight: "medium" }), priceRow(t)], { label: L("المعلومات", "Details"), style: { gap: 6 } }),
      t.addToCart({ label: L("أضف للسلة", "Add to cart") }),
    ],
    { label: L("بطاقة المنتج", "Product card"), style: { gap: 12 } },
  );
}
