import { TALLABY_SERVICES_ENABLED } from "@workspace/lib/fulfillment";

/**
 * Help page content as data: FAQ topics (text lives in messages `help.faqs`)
 * and shortcuts into real dashboard pages. Labels for links reuse `nav.*`.
 * `[storeId]` in an href is filled with the selected store by help.data.tsx.
 */

export type HelpLink = {
  /** A key in the `nav` messages namespace. */
  nav: string;
  href: string;
  /** Only shown when the store builder is enabled for this seller. */
  builder?: boolean;
};

export type HelpFaq = { key: string; link?: HelpLink };
export type HelpTopic = { key: string; faqs: HelpFaq[] };

const L = {
  stores: { nav: "myStores", href: "/stores" },
  plan: { nav: "planUsage", href: "/settings/plan" },
  addProduct: { nav: "addProducts", href: "/products/add" },
  categories: { nav: "sellerCategories", href: "/products/categories" },
  orders: { nav: "orders", href: "/orders" },
  delivery: { nav: "deliveryTracking", href: "/orders/delivery" },
  shipping: { nav: "shippingSettings", href: "/stores/[storeId]/shipping" },
  fulfillment: { nav: "fulfillment", href: "/settings/fulfillment" },
  wallet: { nav: "walletBalance", href: "/wallet" },
  payments: { nav: "paymentMethods", href: "/stores/[storeId]/settings/payments" },
  builder: { nav: "websiteBuilder", href: "/stores/[storeId]/editor", builder: true },
  domain: { nav: "domainSeo", href: "/stores/[storeId]/website/domain", builder: true },
  coupons: { nav: "coupons", href: "/coupons" },
} satisfies Record<string, HelpLink>;

export const HELP_TOPICS: HelpTopic[] = [
  {
    key: "start",
    faqs: [
      { key: "createStore", link: L.stores },
      { key: "fees", link: L.wallet },
      { key: "plan", link: L.plan },
    ],
  },
  {
    key: "products",
    faqs: [
      { key: "addProduct", link: L.addProduct },
      { key: "categories", link: L.categories },
    ],
  },
  {
    key: "orders",
    faqs: [
      { key: "manageOrders", link: L.orders },
      { key: "delivery", link: L.shipping },
      // Hidden while Tallaby offers no fulfillment services (owner, 2026-10-31).
      ...(TALLABY_SERVICES_ENABLED ? [{ key: "fulfillment", link: L.fulfillment }] : []),
    ],
  },
  {
    key: "money",
    faqs: [
      { key: "wallet", link: L.wallet },
      { key: "topUp", link: L.wallet },
      { key: "paymentMethods", link: L.payments },
    ],
  },
  {
    key: "website",
    faqs: [
      { key: "builder", link: L.builder },
      { key: "domain", link: L.domain },
    ],
  },
];

export const HELP_SHORTCUTS: HelpLink[] = [
  L.addProduct,
  L.orders,
  L.delivery,
  L.shipping,
  L.wallet,
  L.payments,
  L.builder,
  L.coupons,
  L.stores,
];

export const HELP_VIDEOS = ["firstStore", "firstProduct", "orders", "builder", "topUp"] as const;

/** Fills `[storeId]`; store-scoped links fall back to the stores list when there is no store. */
export function resolveHelpHref(href: string, storeId: string | null): string {
  if (!href.includes("[storeId]")) return href;
  return storeId ? href.replace("[storeId]", encodeURIComponent(storeId)) : "/stores";
}

/** Drops builder links when the builder is off, and resolves every href. */
export function resolveHelpLink(
  link: HelpLink | undefined,
  { storeId, builder }: { storeId: string | null; builder: boolean }
): HelpLink | undefined {
  if (!link || (link.builder && !builder)) return undefined;
  return { nav: link.nav, href: resolveHelpHref(link.href, storeId) };
}
