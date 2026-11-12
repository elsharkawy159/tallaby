/**
 * The store apps catalog (ROADMAP.md F-12, F-39, F-40, F-47), now a thin
 * adapter over the App Center registry (`@workspace/apps`, F-93): the
 * manifests there are the single source of every app's metadata. This file
 * keeps the old shape so the install engine (billing/app-billing.server.ts),
 * app requests and the Shipping and Payment methods pages work unchanged.
 * Pure. Secrets and install logic stay in this package's server code.
 *
 * `provider` links an entry to its `store_integrations` row (registry.ts,
 * mirrors the DB CHECK). Entries without a provider need no row.
 */
import { APPS, APP_CATEGORIES, appPaths, type AppCategory, type AppId, type AppManifest, type AppMechanism } from "@workspace/apps";
import type { AppPricing } from "../billing/app-pricing.lib";
import { INTEGRATIONS, isIntegrationProvider, type IntegrationProvider } from "./registry";

/** Also the App Center's categories. */
export type StoreAppGroup = AppCategory;

/** How an app works, shown on its card. */
export type StoreAppKind = AppMechanism;

export type StoreApp = {
  key: AppId;
  /** The App Center URL segment. */
  slug: string;
  group: StoreAppGroup;
  kind: StoreAppKind;
  provider?: IntegrationProvider;
  /** A built app with no store_integrations row (its own page manages it): always live. */
  live?: true;
  /** What Tallaby charges for the app (F-47). Prices are US cents. */
  pricing: AppPricing;
  /** Comes with every store and needs no connecting, so it is always under Installed (F-47). */
  defaultInstalled?: true;
  /** Not open yet, but a seller can ask for it (F-62). */
  requestable?: true;
};

export type StoreAppKey = AppId;

function toStoreApp(app: AppManifest): StoreApp {
  const provider = app.internal.provider;
  if (provider !== undefined && !isIntegrationProvider(provider)) {
    throw new Error(`App "${app.id}" names an unknown integration provider "${provider}"`);
  }
  return {
    key: app.id,
    slug: app.slug,
    group: app.category,
    kind: app.mechanism,
    ...(provider ? { provider } : {}),
    ...(!provider && app.status === "live" ? { live: true as const } : {}),
    pricing: app.pricing,
    ...(app.installMode === "builtin" ? { defaultInstalled: true as const } : {}),
    ...(app.installMode === "request" ? { requestable: true as const } : {}),
  };
}

/** In the order sellers are most likely to need them, per group. */
export const STORE_APPS: readonly StoreApp[] = APPS.map(toStoreApp);

export const STORE_APP_GROUPS: StoreAppGroup[] = [...APP_CATEGORIES];

/** Live when it has a provider whose registry entry is available, or is a built page-only app; everything else is "soon". */
export function isStoreAppLive(app: StoreApp): boolean {
  if (app.live) return true;
  return app.provider !== undefined && INTEGRATIONS[app.provider].availability === "available";
}

export function storeAppProvider(app: StoreApp): IntegrationProvider | null {
  return app.provider ?? null;
}

/** Widened, so callers handle every model before a paid app ships. */
export function storeAppPricing(app: StoreApp): AppPricing {
  return app.pricing;
}

export function isStoreAppRequestable(app: StoreApp): boolean {
  return app.requestable === true;
}

export function isStoreAppDefaultInstalled(app: StoreApp): boolean {
  return app.defaultInstalled === true;
}

export function storeAppsInGroup(group: StoreAppGroup): StoreApp[] {
  return STORE_APPS.filter((app) => app.group === group);
}

export function getStoreApp(key: string): StoreApp | null {
  return STORE_APPS.find((app) => app.key === key) ?? null;
}

/** The app's page in the App Center (`/stores/:storeId/apps/:slug`). */
export function storeAppHref(storeId: string, app: StoreApp): string {
  return appPaths.detail(storeId, app);
}

/** Where the app's settings render, or null when it has none (not built yet, or install-only). */
export function storeAppSettingsHref(storeId: string, app: StoreApp): string | null {
  const manifest = APPS.find((item) => item.id === app.key);
  return manifest?.settingsRoute ? appPaths.settings(storeId, app) : null;
}
