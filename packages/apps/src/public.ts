import { APP_DEVELOPERS, type AppManifest } from "./manifest";
import { APPS, getApp, localize, type AppLocale } from "./registry";

/**
 * The public, read-only catalog (ROADMAP.md F-93, docs/apps-platform.md):
 * what `GET /api/apps/catalog` returns for tallaby.com and the future
 * apps.tallaby.com. An allow-list: only the fields below leave the server.
 * No store data, no install state, no `internal`, no dashboard routes.
 */

export const PUBLIC_CATALOG_VERSION = 1 as const;

export type PublicApp = {
  id: string;
  slug: string;
  kind: AppManifest["kind"];
  category: AppManifest["category"];
  name: string;
  vendor: string;
  summary: string;
  description: string;
  highlights: string[];
  icon: { background: string; foreground: string; imageUrl: string | null };
  screenshots: { url: string; alt: string }[];
  pricing: AppManifest["pricing"];
  providerFees: boolean;
  plans: AppManifest["plans"];
  developer: { id: string; name: string; url: string };
  status: AppManifest["status"];
  installMode: AppManifest["installMode"];
  surfaces: AppManifest["surfaces"];
  requires: string[];
  docsUrl: string | null;
};

export type PublicCatalog = { version: typeof PUBLIC_CATALOG_VERSION; locale: AppLocale; apps: PublicApp[] };

export function parsePublicLocale(value: string | null | undefined): AppLocale {
  return value === "en" ? "en" : "ar";
}

/** `assetOrigin` is where the manifest's `/app-logos/…` paths are served (the dashboard). */
export function toPublicApp(app: AppManifest, locale: AppLocale, assetOrigin: string): PublicApp {
  const asset = (path: string) => `${assetOrigin.replace(/\/$/, "")}${path}`;
  const developer = APP_DEVELOPERS[app.developer];
  return {
    id: app.id,
    slug: app.slug,
    kind: app.kind,
    category: app.category,
    name: localize(app.name, locale),
    vendor: localize(app.vendor, locale),
    summary: localize(app.summary, locale),
    description: localize(app.description, locale),
    highlights: app.highlights.map((line) => localize(line, locale)),
    icon: { background: app.icon.background, foreground: app.icon.foreground, imageUrl: app.icon.image ? asset(app.icon.image) : null },
    screenshots: app.screenshots.map((shot) => ({ url: asset(shot.src), alt: localize(shot.alt, locale) })),
    pricing: app.pricing,
    providerFees: app.providerFees,
    plans: app.plans,
    developer: { id: app.developer, name: localize(developer.name, locale), url: developer.url },
    status: app.status,
    installMode: app.installMode,
    surfaces: app.surfaces,
    requires: [...app.requires],
    docsUrl: app.docsUrl ?? null,
  };
}

export function publicCatalog(locale: AppLocale, assetOrigin: string): PublicCatalog {
  return { version: PUBLIC_CATALOG_VERSION, locale, apps: APPS.map((app) => toPublicApp(app, locale, assetOrigin)) };
}

/** One app by id or slug, or null. */
export function publicCatalogApp(idOrSlug: string, locale: AppLocale, assetOrigin: string): { version: typeof PUBLIC_CATALOG_VERSION; locale: AppLocale; app: PublicApp } | null {
  const app = getApp(idOrSlug) ?? APPS.find((item) => item.slug === idOrSlug) ?? null;
  return app ? { version: PUBLIC_CATALOG_VERSION, locale, app: toPublicApp(app, locale, assetOrigin) } : null;
}
