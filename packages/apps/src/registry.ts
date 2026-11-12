import {
  APP_CATEGORIES,
  APP_IDS,
  appManifestSchema,
  type AppCategory,
  type AppId,
  type AppManifest,
  type LocalizedText,
} from "./manifest";
import { MANIFESTS } from "./manifests";

/**
 * The App Center registry (ROADMAP.md F-93). Every manifest is parsed once at
 * import, so a bad one fails the build and the tests, never a request.
 */

function parseAll(): readonly AppManifest[] {
  const parsed = MANIFESTS.map((manifest) => {
    const result = appManifestSchema.safeParse(manifest);
    if (!result.success) throw new Error(`Invalid app manifest "${manifest.id}": ${result.error.message}`);
    return result.data as AppManifest;
  });
  const ids = new Set<string>();
  for (const app of parsed) {
    if (ids.has(app.id)) throw new Error(`Duplicate app id "${app.id}"`);
    ids.add(app.id);
  }
  return Object.freeze(parsed);
}

export const APPS: readonly AppManifest[] = parseAll();

const BY_ID = new Map<string, AppManifest>(APPS.map((app) => [app.id, app]));
const BY_SLUG = new Map<string, AppManifest>(APPS.map((app) => [app.slug, app]));

export function isAppId(value: unknown): value is AppId {
  return typeof value === "string" && (APP_IDS as readonly string[]).includes(value);
}

export function getApp(id: string): AppManifest | null {
  return BY_ID.get(id) ?? null;
}

/** The app a `/apps/:slug` URL names. */
export function getAppBySlug(slug: string): AppManifest | null {
  return BY_SLUG.get(slug) ?? null;
}

export function appsInCategory(category: AppCategory): AppManifest[] {
  return APPS.filter((app) => app.category === category);
}

/** Categories that have at least one app, in display order. */
export function usedCategories(): AppCategory[] {
  return APP_CATEGORIES.filter((category) => APPS.some((app) => app.category === category));
}

export type AppLocale = "ar" | "en";

export function localize(text: LocalizedText, locale: string): string {
  return locale.startsWith("ar") ? text.ar : text.en;
}

/** Lower-cased text a search box matches against: both languages plus the Latin keywords. */
export function appSearchText(app: AppManifest): string {
  return [app.name.ar, app.name.en, app.vendor.ar, app.vendor.en, app.summary.ar, app.summary.en, ...app.keywords]
    .join(" ")
    .toLowerCase();
}

export function matchesAppQuery(app: AppManifest, query: string): boolean {
  const q = query.trim().toLowerCase();
  return !q || appSearchText(app).includes(q);
}

/** Dashboard paths (store-scoped, rule 5). Internal: the public API never returns them. */
export const appPaths = {
  center: (storeId: string) => `/stores/${storeId}/apps`,
  detail: (storeId: string, app: Pick<AppManifest, "slug">) => `/stores/${storeId}/apps/${app.slug}`,
  settings: (storeId: string, app: Pick<AppManifest, "slug">) => `/stores/${storeId}/apps/${app.slug}/settings`,
};
