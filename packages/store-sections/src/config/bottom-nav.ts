/**
 * The phone bottom navigation's items (owner, F-74): the seller reorders the
 * bar, adds store pages and fixed places (shop, search, cart, account,
 * orders, wishlist, blog) and removes items, from the builder's phone
 * preview. Stored on the header instance (`props.bottomNavItems`), so it is a
 * draft until Publish like every other header option, and needs no
 * migration. A header without the prop, or with nothing usable in it, draws
 * today's bar (Home, Shop, Cart, Profile) exactly.
 *
 * Read with `bottomNavItems` (never trusts the stored value: unknown types,
 * unsafe slugs and icons outside the list are dropped, duplicates removed,
 * at most `BOTTOM_NAV_MAX_ITEMS`). Pure data: the icons are drawn by
 * `render/bottom-nav.tsx`.
 */
import type { SectionInstance } from "./schema";

export const BOTTOM_NAV_ITEMS_PROP = "bottomNavItems";
export const BOTTOM_NAV_MAX_ITEMS = 5;

/** Places every store has, with their storefront paths. */
export const BOTTOM_NAV_FIXED = {
  home: "/",
  shop: "/products",
  search: "/search",
  cart: "/cart",
  account: "/profile",
  orders: "/profile/orders",
  wishlist: "/profile/wishlist",
  blog: "/blog",
} as const;
export type BottomNavFixedType = keyof typeof BOTTOM_NAV_FIXED;
export const BOTTOM_NAV_FIXED_TYPES = Object.keys(BOTTOM_NAV_FIXED) as BottomNavFixedType[];

/** The short list of icons a seller can pick from (lucide icons, drawn by the renderer). */
export const BOTTOM_NAV_ICONS = [
  "house",
  "store",
  "layoutGrid",
  "search",
  "shoppingBag",
  "shoppingCart",
  "userRound",
  "package",
  "heart",
  "newspaper",
  "fileText",
  "info",
  "phone",
  "mail",
  "helpCircle",
  "tag",
  "gift",
  "sparkles",
] as const;
export type BottomNavIcon = (typeof BOTTOM_NAV_ICONS)[number];

export type BottomNavLabel = { ar?: string; en?: string };
export type BottomNavItem =
  | { type: BottomNavFixedType; icon?: BottomNavIcon }
  | {
      type: "page";
      /** The builder page's id; its current slug wins when the host knows the pages. */
      pageId?: string;
      slug: string;
      /** The page's name when it was added, in both languages. */
      label: BottomNavLabel;
      icon?: BottomNavIcon;
    };

/** Today's bar: Home, Shop, Cart, Profile. */
export const DEFAULT_BOTTOM_NAV: readonly BottomNavItem[] = [{ type: "home" }, { type: "shop" }, { type: "cart" }, { type: "account" }];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PAGE_ID = /^[\w-]{1,80}$/;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isIcon = (value: unknown): value is BottomNavIcon => typeof value === "string" && (BOTTOM_NAV_ICONS as readonly string[]).includes(value);
const cleanText = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 40) : "");

function parseItem(value: unknown): BottomNavItem | null {
  if (!isRecord(value)) return null;
  const icon = isIcon(value.icon) ? { icon: value.icon } : {};
  if (typeof value.type === "string" && value.type in BOTTOM_NAV_FIXED) return { type: value.type as BottomNavFixedType, ...icon };
  if (value.type !== "page" || typeof value.slug !== "string" || !SLUG.test(value.slug) || value.slug.length > 80) return null;
  const raw = isRecord(value.label) ? value.label : {};
  const label: BottomNavLabel = {};
  for (const locale of ["ar", "en"] as const) {
    const text = cleanText(raw[locale]);
    if (text) label[locale] = text;
  }
  const pageId = typeof value.pageId === "string" && PAGE_ID.test(value.pageId) ? { pageId: value.pageId } : {};
  return { type: "page", ...pageId, slug: value.slug, label, ...icon };
}

/** A stable identity per item (one of each place, one per page). */
export function bottomNavKey(item: BottomNavItem): string {
  return item.type === "page" ? `page:${item.pageId ?? item.slug}` : item.type;
}

/** The seller's saved items, or null when the header has none usable (today's bar is drawn then). */
export function readBottomNavItems(header: SectionInstance | null | undefined): BottomNavItem[] | null {
  const raw = header?.props[BOTTOM_NAV_ITEMS_PROP];
  if (!Array.isArray(raw)) return null;
  const seen = new Set<string>();
  const items: BottomNavItem[] = [];
  for (const value of raw.slice(0, 20)) {
    const item = parseItem(value);
    if (!item || seen.has(bottomNavKey(item))) continue;
    seen.add(bottomNavKey(item));
    items.push(item);
    if (items.length === BOTTOM_NAV_MAX_ITEMS) break;
  }
  return items.length ? items : null;
}

/** The items the bar draws: the seller's, else the default four. */
export function bottomNavItems(header: SectionInstance | null | undefined): readonly BottomNavItem[] {
  return readBottomNavItems(header) ?? DEFAULT_BOTTOM_NAV;
}

const sameItems = (a: readonly BottomNavItem[], b: readonly BottomNavItem[]) => JSON.stringify(a) === JSON.stringify(b);

/** The header with these items; the prop is dropped when they are the default bar (stores without a config keep today's bar). */
export function setBottomNavItems(header: SectionInstance, items: readonly BottomNavItem[]): SectionInstance {
  const { [BOTTOM_NAV_ITEMS_PROP]: _, ...props } = header.props;
  const clean = readBottomNavItems({ ...header, props: { [BOTTOM_NAV_ITEMS_PROP]: items } }) ?? [];
  if (!clean.length || sameItems(clean, DEFAULT_BOTTOM_NAV)) return { ...header, props };
  return { ...header, props: { ...props, [BOTTOM_NAV_ITEMS_PROP]: clean } };
}

/** The storefront path an item links to (a page: `/<slug>`). */
export function bottomNavHref(item: BottomNavItem): string {
  return item.type === "page" ? `/${item.slug}` : BOTTOM_NAV_FIXED[item.type];
}

const FIXED_ICONS: Record<BottomNavFixedType, BottomNavIcon> = {
  home: "house",
  shop: "store",
  search: "search",
  cart: "shoppingBag",
  account: "userRound",
  orders: "package",
  wishlist: "heart",
  blog: "newspaper",
};

/** Words in a page's slug or name that pick its icon (first match wins). */
const PAGE_ICON_HINTS: readonly [RegExp, BottomNavIcon][] = [
  [/contact|call|whatsapp|اتصل|تواصل/i, "phone"],
  [/about|story|من-نحن|من نحن|قصتنا/i, "info"],
  [/faq|help|support|question|اسئلة|أسئلة|مساعدة/i, "helpCircle"],
  [/offer|sale|deal|discount|coupon|عروض|خصم|تخفيض/i, "tag"],
  [/gift|هدية|هدايا/i, "gift"],
  [/new|arrival|جديد/i, "sparkles"],
  [/categor|collection|اقسام|أقسام|تصنيف/i, "layoutGrid"],
  [/blog|news|article|مدونة|مقالات/i, "newspaper"],
  [/newsletter|mail|subscribe|اشترك/i, "mail"],
  [/shop|store|product|منتجات|متجر/i, "store"],
];

/** The icon an item shows: the seller's pick, else one chosen from its type (a page: from its slug and name). */
export function bottomNavIcon(item: BottomNavItem): BottomNavIcon {
  if (item.icon) return item.icon;
  if (item.type !== "page") return FIXED_ICONS[item.type];
  const words = `${item.slug} ${item.label.en ?? ""} ${item.label.ar ?? ""}`;
  return PAGE_ICON_HINTS.find(([pattern]) => pattern.test(words))?.[1] ?? "fileText";
}
