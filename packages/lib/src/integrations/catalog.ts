/**
 * The store apps catalog (ROADMAP.md F-12, F-39, F-40): one list of every
 * app, shipping company and payment gateway a store can use, with where it
 * is managed. The Apps page, Shipping › Shipping companies and Payment
 * methods › Online card payments all read this list, so a new carrier or
 * gateway is added once. Pure.
 *
 * `provider` links an entry to its `store_integrations` row (registry.ts,
 * mirrors the DB CHECK). Entries without a provider are "coming soon" cards:
 * they need no row and no migration until they are built.
 */
import { INTEGRATIONS, type IntegrationProvider } from "./registry";

export type StoreAppGroup = "tracking" | "shipping" | "payments" | "data";

/** How an app works, shown on its card before it is connected. */
export type StoreAppKind = "script" | "server" | "import" | "account" | "carrier" | "sheet" | "gateway";

/** Dashboard page (under /stores/:storeId/) that manages the app; none → the Apps page side sheet. */
export type StoreAppPage = "apps/bosta" | "apps/wassalha" | "settings/payments";

type StoreAppDefinition = {
  key: string;
  group: StoreAppGroup;
  kind: StoreAppKind;
  provider?: IntegrationProvider;
  page?: StoreAppPage;
};

/** In the order sellers are most likely to need them, per group. */
export const STORE_APPS = [
  { key: "meta_pixel", group: "tracking", kind: "script", provider: "meta_pixel" },
  { key: "google_analytics", group: "tracking", kind: "script", provider: "google_analytics" },
  { key: "google_tag_manager", group: "tracking", kind: "script", provider: "google_tag_manager" },
  { key: "meta_capi", group: "tracking", kind: "server", provider: "meta_capi" },
  { key: "tiktok_pixel", group: "tracking", kind: "script", provider: "tiktok_pixel" },
  { key: "snapchat_pixel", group: "tracking", kind: "script", provider: "snapchat_pixel" },

  { key: "bosta", group: "shipping", kind: "carrier", provider: "bosta", page: "apps/bosta" },
  { key: "wassalha", group: "shipping", kind: "sheet", provider: "wassalha", page: "apps/wassalha" },
  { key: "mylerz", group: "shipping", kind: "carrier" },
  { key: "jt_express", group: "shipping", kind: "carrier" },
  { key: "aramex", group: "shipping", kind: "carrier" },

  { key: "paymob", group: "payments", kind: "gateway", provider: "paymob", page: "settings/payments" },
  { key: "kashier", group: "payments", kind: "gateway", provider: "kashier", page: "settings/payments" },
  { key: "paypal", group: "payments", kind: "gateway" },
  { key: "tallaby_pay", group: "payments", kind: "gateway" },

  { key: "google_sheets", group: "data", kind: "account", provider: "google_sheets" },
  { key: "shopify_import", group: "data", kind: "import", provider: "shopify_import" },
] as const satisfies readonly StoreAppDefinition[];

export type StoreApp = (typeof STORE_APPS)[number];
export type StoreAppKey = StoreApp["key"];

export const STORE_APP_GROUPS: StoreAppGroup[] = ["tracking", "shipping", "payments", "data"];

/** Live when it has a provider whose registry entry is available; everything else is "soon". */
export function isStoreAppLive(app: StoreApp): boolean {
  return "provider" in app && INTEGRATIONS[app.provider].availability === "available";
}

export function storeAppProvider(app: StoreApp): IntegrationProvider | null {
  return "provider" in app ? app.provider : null;
}

export function storeAppsInGroup(group: StoreAppGroup): StoreApp[] {
  return STORE_APPS.filter((app) => app.group === group);
}

export function getStoreApp(key: string): StoreApp | null {
  return STORE_APPS.find((app) => app.key === key) ?? null;
}

/** The page that manages the app, or null when the Apps page sheet does. */
export function storeAppHref(storeId: string, app: StoreApp): string | null {
  return "page" in app ? `/stores/${storeId}/${app.page}` : null;
}
