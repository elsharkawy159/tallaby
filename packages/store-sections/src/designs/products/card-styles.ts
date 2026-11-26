/**
 * Product card styles (owner, 2026-11-26: "product cards on templates are
 * duplicated"). Almost every product section draws the same card, so a
 * template picks one of these styles and `applyCardStyle` restyles the card
 * of every product list in a section tree: with or without the cart button,
 * a round cart icon, an outline button, a paper card and so on.
 *
 * It only changes props and styles of nodes that are already there. It never
 * adds, removes, reorders or retypes a node and never touches `label`,
 * `bind` or `field`, so a template section stays a library section with
 * values (`templates/library-ref.ts` turns it into a ref, and the field
 * names snapshot is untouched). It also only adds or replaces style keys,
 * never drops one, because a ref's style patch can only merge.
 *
 * Parts are found by type and binding, never by layer label: the card is the
 * direct child of a `productList`; the photo is the `image` bound to
 * `image` (its frame is the link around it); the name is the node bound to
 * `title`, the price the one bound to `price` (its row is their parent), the
 * cart button the `addToCart` node.
 *
 * Fallbacks: a card whose photo sits beside its text (a row or a grid card,
 * as in lists and campaign rows) is never centred and never gets an absolute
 * icon; its cart icon stays in the flow where the design put it. The same
 * for a cart button that is not a direct child of the card (inside a price
 * row or a button row). `compact` puts its icon over the photo's top end
 * corner, except when the card has a wishlist heart there: then it sits at
 * the card's bottom end like `icon`.
 *
 * RTL-safe (start/end only, no letter-spacing or uppercase), hover only
 * through the designs' own `hover` keys (none added). Pure, no React.
 */
import type { StyleValues } from "../../elements/style";
import type { NodeTemplate } from "../../elements/tree";

export const CARD_STYLE_IDS = ["classic", "quiet", "icon", "outline", "framed", "editorial", "compact"] as const;
export type CardStyleId = (typeof CARD_STYLE_IDS)[number];

/** One line per style, for the editor and the docs. */
export const CARD_STYLE_NOTES: Record<CardStyleId, string> = {
  classic: "The library card as it is: photo, name, price and the solid cart button.",
  quiet: "No cart button; name and price centred, the name a little larger, more air: boutiques.",
  icon: "A round cart icon at the card's bottom end, beside the price: everyday shops.",
  outline: "A full-width outline cart button under a semibold name.",
  framed: "A paper card (hairline border, small padding) with a full-width solid button: marketplaces.",
  editorial: "No cart button; the name in the heading font, a larger price, a hairline round the photo: fashion.",
  compact: "Tight spacing, a small name, the price in the brand colour and a cart icon over the photo: electronics, grocery.",
};

export type CardStyleOptions = {
  /** The template's corner cap (`libraryRef.patch.corners`): a radius the style sets never exceeds it. */
  corners?: number;
};

type Patch = { style?: StyleValues; tablet?: StyleValues; mobile?: StyleValues; props?: Record<string, string> };
type Entry = { node: NodeTemplate; path: string; parent?: Entry };

const bindOf = (node: NodeTemplate): unknown => (node.props as { bind?: unknown } | undefined)?.bind;
const HIDDEN: Patch = { style: { hidden: true }, tablet: { hidden: true }, mobile: { hidden: true } };
const ICON_GAP = { desktop: 48, mobile: 44 } as const;

/** The parts of one card, found by type and binding. */
function partsOf(card: NodeTemplate) {
  const entries: Entry[] = [];
  const collect = (node: NodeTemplate, path: string, parent?: Entry) => {
    const entry: Entry = { node, path, parent };
    entries.push(entry);
    node.children?.forEach((child, i) => collect(child, `${path}/${i}`, entry));
  };
  collect(card, "");
  const root = entries[0]!;
  const find = (test: (n: NodeTemplate) => boolean) => entries.find((e) => test(e.node));
  const image = find((n) => n.type === "image" && bindOf(n) === "image");
  const title = find((n) => bindOf(n) === "title");
  const price = find((n) => bindOf(n) === "price");
  const was = find((n) => bindOf(n) === "compareAtPrice");
  const cart = find((n) => n.type === "addToCart");
  const wish = find((n) => n.type === "wishlistButton");
  const frame = image?.parent && image.parent !== root && image.parent.node.type === "linkBlock" ? image.parent : undefined;
  const titleLink = title?.parent && title.parent !== root && title.parent.node.type === "linkBlock" ? title.parent : undefined;
  const priceRow = price?.parent && price.parent !== root && price.parent.node.type === "hFlex" ? price.parent : undefined;
  const ancestors = (e?: Entry): Entry[] => (e?.parent ? [e.parent, ...ancestors(e.parent)] : []);
  // The text block: the nearest common ancestor of the name and the price, when it is not the card itself.
  const titleUp = new Set(ancestors(title));
  const common = ancestors(price).find((e) => titleUp.has(e));
  const details = common && common !== root && common.node.type === "vFlex" ? common : undefined;
  // A card is vertical when nothing between its photo and its root lays out in a row.
  const rowish = (n: NodeTemplate) =>
    n.type === "hFlex" || n.type === "grid" || (n.style as StyleValues | undefined)?.direction === "row" ||
    Object.values((n.breakpointStyles ?? {}) as Record<string, StyleValues>).some((s) => s?.direction === "row");
  const vertical = root.node.type === "vFlex" && !!image && !ancestors(image).some((e) => rowish(e.node));
  return { root, image, frame, title, titleLink, price, was, priceRow, details, cart, wish, vertical };
}

function merge(into: Patch, add: Patch): Patch {
  const out: Patch = { ...into };
  for (const key of ["style", "tablet", "mobile", "props"] as const) {
    if (add[key]) out[key] = { ...(into[key] as object), ...(add[key] as object) } as never;
  }
  return out;
}

function patched(node: NodeTemplate, patch: Patch | undefined): NodeTemplate {
  if (!patch) return node;
  const breakpoints = { ...(node.breakpointStyles as Record<string, StyleValues> | undefined) };
  for (const bp of ["tablet", "mobile"] as const) if (patch[bp] && Object.keys(patch[bp]).length) breakpoints[bp] = { ...breakpoints[bp], ...patch[bp] };
  return {
    ...node,
    ...(patch.props && { props: { ...node.props, ...patch.props } as NodeTemplate["props"] }),
    ...(patch.style && Object.keys(patch.style).length > 0 && { style: { ...(node.style as StyleValues | undefined), ...patch.style } as NodeTemplate["style"] }),
    ...(Object.keys(breakpoints).length && { breakpointStyles: breakpoints as NodeTemplate["breakpointStyles"] }),
  };
}

function rebuild(node: NodeTemplate, path: string, patches: ReadonlyMap<string, Patch>): NodeTemplate {
  const next = patched(node, patches.get(path));
  return node.children ? { ...next, children: node.children.map((child, i) => rebuild(child, `${path}/${i}`, patches)) } : next;
}

const px = (value: unknown, extra = 0) => `${(typeof value === "number" ? value : 0) + extra}px`;

/** Text sizes a style may set over: a card text up to `md` (a feature card's large name or price keeps its size). */
const SMALL_SIZES = new Set<unknown>([undefined, "xs", "sm", "md"]);
/** Card backgrounds a paper card may replace (a brand or accent tile keeps its colour). */
const PLAIN_BACKGROUNDS = new Set<unknown>([undefined, "transparent", "background", "surface", "secondary"]);

/** One card with a style's patches. */
function styleCard(card: NodeTemplate, id: CardStyleId, o: CardStyleOptions): NodeTemplate {
  const p = partsOf(card);
  const patches = new Map<string, Patch>();
  const add = (entry: Entry | undefined, patch: Patch) => {
    if (entry) patches.set(entry.path, merge(patches.get(entry.path) ?? {}, patch));
  };
  const radius = (value: number) => Math.min(value, o.corners ?? value);
  const rootStyle = (p.root.node.style ?? {}) as StyleValues;
  const rootMobile = ((p.root.node.breakpointStyles as Record<string, StyleValues> | undefined)?.mobile ?? {}) as StyleValues;
  const cartIsDirect = p.cart?.parent === p.root;
  /** The cart button can take the card's full width (it is not beside a price or other buttons). */
  const cartAlone = cartIsDirect || p.cart?.parent?.node.children?.length === 1;
  /** A text patch that only sets sizes over small card text (see SMALL_SIZES). */
  const text = (entry: Entry | undefined, style: StyleValues, mobile?: StyleValues) => {
    if (!entry) return;
    const small = SMALL_SIZES.has((entry.node.style as StyleValues | undefined)?.fontSize);
    const { fontSize, ...rest } = style;
    add(entry, { style: small && fontSize ? { ...rest, fontSize } : rest, ...(small && mobile && { mobile }) });
  };
  /** The cart button hidden; its own row too when the button is all it holds. */
  const hideCart = () => {
    add(p.cart, HIDDEN);
    const parent = p.cart?.parent;
    if (parent && parent !== p.root && parent.node.children?.length === 1) add(parent, HIDDEN);
  };
  /** Room at the end of the text so it never runs under an icon at the card's end. */
  const clearEnd = () => {
    if (p.details) add(p.details, { style: { paddingEnd: ICON_GAP.desktop }, mobile: { paddingEnd: ICON_GAP.mobile } });
    else for (const e of [p.titleLink, p.priceRow]) add(e, { style: { paddingEnd: ICON_GAP.desktop }, mobile: { paddingEnd: ICON_GAP.mobile } });
  };
  /** The cart as a round icon at the card's bottom end (in the flow when the card can't hold it there). */
  const iconAtBottomEnd = () => {
    add(p.cart, { props: { look: "icon" } });
    if (!p.vertical || !cartIsDirect) return;
    add(p.root, { style: { position: "relative" } });
    add(p.cart, {
      style: { position: "absolute", insetBottom: px(rootStyle.paddingBottom), insetEnd: px(rootStyle.paddingEnd) },
      ...((rootMobile.paddingBottom !== undefined || rootMobile.paddingEnd !== undefined) && {
        mobile: { insetBottom: px(rootMobile.paddingBottom ?? rootStyle.paddingBottom), insetEnd: px(rootMobile.paddingEnd ?? rootStyle.paddingEnd) },
      }),
    });
    clearEnd();
  };

  switch (id) {
    case "classic":
      return card;
    case "quiet":
      hideCart();
      add(p.root, { style: { gap: 18 }, mobile: { gap: 12 } });
      add(p.details, { style: { gap: 6 } });
      text(p.title, { fontSize: "md", fontWeight: "normal" }, { fontSize: "sm" });
      if (p.vertical) {
        add(p.title, { style: { textAlign: "center" } });
        add(p.priceRow, { style: { justifyContent: "center" } });
      }
      break;
    case "icon":
      add(p.title, { style: { fontWeight: "medium" } });
      iconAtBottomEnd();
      break;
    case "outline":
      add(p.root, { style: { gap: 12 }, mobile: { gap: 10 } });
      add(p.title, { style: { fontWeight: "semibold" } });
      add(p.cart, { props: { look: "outline" }, ...(cartAlone && { style: { width: "100%" } }) });
      break;
    case "framed": {
      // A card that is already a tile (its own padding or colour) keeps them and only gets the hairline.
      const padded = [rootStyle.paddingTop, rootStyle.paddingBottom, rootStyle.paddingStart, rootStyle.paddingEnd].some((v) => typeof v === "number" && v > 0);
      add(p.root, {
        style: {
          ...(PLAIN_BACKGROUNDS.has(rootStyle.background) && { background: "surface" }),
          borderWidth: 1,
          borderColor: "border",
          radius: radius(16),
          ...(!padded && { paddingTop: 10, paddingBottom: 14, paddingStart: 10, paddingEnd: 10 }),
          gap: 12,
        },
        mobile: { ...(!padded && { paddingTop: 8, paddingBottom: 10, paddingStart: 8, paddingEnd: 8 }), gap: 10 },
      });
      add(p.frame, { style: { radius: radius(10) } });
      add(p.title, { style: { fontWeight: "medium" } });
      add(p.price, { style: { fontWeight: "bold" } });
      if (cartAlone) add(p.cart, { style: { width: "100%" } });
      break;
    }
    case "editorial":
      hideCart();
      add(p.root, { style: { gap: 16 }, mobile: { gap: 12 } });
      add(p.details, { style: { gap: 6 } });
      add(p.frame, { style: { borderWidth: 1, borderColor: "border" } });
      text(p.title, { fontFamily: "heading", fontSize: "md", fontWeight: "normal" }, { fontSize: "sm" });
      text(p.price, { fontSize: "md", fontWeight: "medium", color: "foreground" }, { fontSize: "sm" });
      text(p.was, { fontSize: "sm" }, { fontSize: "xs" });
      break;
    case "compact":
      add(p.root, { style: { gap: 8 }, mobile: { gap: 6 } });
      add(p.details, { style: { gap: 2 } });
      text(p.title, { fontSize: "sm" }, { fontSize: "xs" });
      text(p.price, { color: "primary", fontWeight: "bold", fontSize: "md" }, { fontSize: "sm" });
      if (p.vertical && cartIsDirect && !p.wish) {
        add(p.root, { style: { position: "relative" } });
        add(p.cart, {
          props: { look: "icon" },
          style: { position: "absolute", insetTop: px(rootStyle.paddingTop, 8), insetEnd: px(rootStyle.paddingEnd, 8), zIndex: 2 },
        });
      } else iconAtBottomEnd();
      break;
  }
  return rebuild(card, "", patches);
}

/**
 * The tree with the card of every product list in `id`'s style. `classic`
 * returns the tree itself. Only a list's direct child (the card) and its
 * descendants change, and only in props and styles.
 */
export function applyCardStyle(tree: NodeTemplate, id: CardStyleId, o: CardStyleOptions = {}): NodeTemplate {
  if (id === "classic") return tree;
  const visit = (node: NodeTemplate): NodeTemplate => {
    if (node.type === "productList") return { ...node, children: node.children?.map((card) => styleCard(card, id, o)) };
    return node.children ? { ...node, children: node.children.map(visit) } : node;
  };
  return visit(tree);
}

/** Whether a tree holds a product list (the only trees a card style changes). */
export function hasProductList(tree: NodeTemplate): boolean {
  return tree.type === "productList" || (tree.children ?? []).some(hasProductList);
}
