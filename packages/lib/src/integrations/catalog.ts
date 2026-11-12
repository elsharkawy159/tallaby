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
import type { AppPricing } from "../billing/app-pricing.lib";
import { INTEGRATIONS, type IntegrationProvider } from "./registry";

/** Also the Apps page's Explore categories (F-47). */
export type StoreAppGroup = "ai" | "tracking" | "shipping" | "payments" | "data" | "messaging" | "storefront";

/** How an app works, shown on its card before it is connected. */
export type StoreAppKind = "script" | "server" | "import" | "account" | "carrier" | "sheet" | "gateway" | "agent" | "notifications" | "widget";

/** Dashboard page (under /stores/:storeId/) that manages the app; none → the Apps page side sheet. */
export type StoreAppPage = "apps/bosta" | "apps/wassalha" | "apps/ai-assistants" | "apps/size-chart" | "settings/payments";

type StoreAppDefinition = {
  key: string;
  group: StoreAppGroup;
  kind: StoreAppKind;
  provider?: IntegrationProvider;
  page?: StoreAppPage;
  /** A built app with no store_integrations row (its own page manages it): always live. */
  live?: true;
  /** What Tallaby charges for the app (F-47). Prices are US cents. */
  pricing: AppPricing;
  /** Comes with every store and needs no connecting, so it is always under Installed (F-47). */
  defaultInstalled?: true;
  /** Not open yet, but a seller can ask for it from its card (F-62). */
  requestable?: true;
};

const FREE = { model: "free" } as const;

/** In the order sellers are most likely to need them, per group. */
export const STORE_APPS = [
  // F-29: Claude, ChatGPT, Cursor … manage the store over MCP. Connections live in agent_grants (0133), not store_integrations.
  { key: "ai_assistants", group: "ai", kind: "agent", page: "apps/ai-assistants", live: true, pricing: FREE, defaultInstalled: true },

  // F-92: "Find my size" on product pages. Installed from its own page (store_app_installs); charts live in store_size_charts (0169).
  { key: "size_chart", group: "storefront", kind: "widget", page: "apps/size-chart", live: true, pricing: FREE },

  { key: "meta_pixel", group: "tracking", kind: "script", provider: "meta_pixel", pricing: FREE },
  { key: "google_analytics", group: "tracking", kind: "script", provider: "google_analytics", pricing: FREE },
  { key: "google_tag_manager", group: "tracking", kind: "script", provider: "google_tag_manager", pricing: FREE },
  { key: "meta_capi", group: "tracking", kind: "server", provider: "meta_capi", pricing: FREE },
  { key: "tiktok_pixel", group: "tracking", kind: "script", provider: "tiktok_pixel", pricing: FREE },
  { key: "snapchat_pixel", group: "tracking", kind: "script", provider: "snapchat_pixel", pricing: FREE },

  { key: "bosta", group: "shipping", kind: "carrier", provider: "bosta", page: "apps/bosta", pricing: FREE },
  { key: "wassalha", group: "shipping", kind: "sheet", provider: "wassalha", page: "apps/wassalha", pricing: FREE },
  { key: "mylerz", group: "shipping", kind: "carrier", pricing: FREE },
  { key: "jt_express", group: "shipping", kind: "carrier", pricing: FREE },
  { key: "aramex", group: "shipping", kind: "carrier", pricing: FREE },

  { key: "paymob", group: "payments", kind: "gateway", provider: "paymob", page: "settings/payments", pricing: FREE },
  { key: "kashier", group: "payments", kind: "gateway", provider: "kashier", page: "settings/payments", pricing: FREE },
  { key: "paytabs", group: "payments", kind: "gateway", pricing: FREE },
  { key: "moyasar", group: "payments", kind: "gateway", pricing: FREE },
  { key: "paylink", group: "payments", kind: "gateway", pricing: FREE },
  { key: "tabby", group: "payments", kind: "gateway", pricing: FREE },
  { key: "paypal", group: "payments", kind: "gateway", pricing: FREE },
  { key: "tallaby_pay", group: "payments", kind: "gateway", pricing: FREE },

  { key: "google_sheets", group: "data", kind: "account", provider: "google_sheets", pricing: FREE },
  { key: "shopify_import", group: "data", kind: "import", provider: "shopify_import", pricing: FREE },
  // Order notifications. Off by default: after the USD switch, customer order emails need it (F-63).
  { key: "customer_notifications", group: "messaging", kind: "notifications", live: true, pricing: { model: "per_order", usdCents: 1 } },
  // No SMS price exists yet: it's set with F-38 (F-62c, F-63c).
  { key: "sms", group: "messaging", kind: "notifications", requestable: true, pricing: FREE },
] as const satisfies readonly StoreAppDefinition[];

export type StoreApp = (typeof STORE_APPS)[number];
export type StoreAppKey = StoreApp["key"];

export const STORE_APP_GROUPS: StoreAppGroup[] = ["ai", "storefront", "tracking", "shipping", "payments", "data", "messaging"];

/** Live when it has a provider whose registry entry is available, or is a built page-only app; everything else is "soon". */
export function isStoreAppLive(app: StoreApp): boolean {
  if ("live" in app && app.live) return true;
  return "provider" in app && INTEGRATIONS[app.provider].availability === "available";
}

export function storeAppProvider(app: StoreApp): IntegrationProvider | null {
  return "provider" in app ? app.provider : null;
}

/** Widened from the literal in the list, so callers handle every model before a paid app ships. */
export function storeAppPricing(app: StoreApp): AppPricing {
  return app.pricing;
}

export function isStoreAppRequestable(app: StoreApp): boolean {
  return "requestable" in app && app.requestable === true;
}

export function isStoreAppDefaultInstalled(app: StoreApp): boolean {
  return "defaultInstalled" in app && app.defaultInstalled === true;
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
