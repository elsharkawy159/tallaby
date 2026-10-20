/**
 * Upgrades stored site configs to the current schema version. The editor runs
 * this on load (the upgraded draft is saved on the next autosave) and publish
 * runs it before validating (PLAN.md §12 step 2). Old revisions are never
 * rewritten in the database.
 *
 * To add version N+1: bump SITE_CONFIG_VERSION in schema.ts, add MIGRATIONS[N],
 * and add a fixture test for the old shape.
 */
import { SITE_CONFIG_VERSION } from "./schema";

export const CURRENT_SITE_CONFIG_VERSION = SITE_CONFIG_VERSION;

type RawConfig = Record<string, unknown>;

export type MigrateResult =
  | { ok: true; fromVersion: number; migrated: boolean; config: unknown }
  | { ok: false; error: "invalid_config" | "unsupported_version"; fromVersion?: number };

const isRecord = (value: unknown): value is RawConfig =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * v0 → v1. Version 0 is anything saved without `schemaVersion`: either a bare
 * reference `PageContent` (`{ sections, elementStyles?, … }`) or a `{ pages }`
 * list without the site wrapper.
 */
function v0ToV1(config: RawConfig): RawConfig {
  const { sections, elementStyles, elementAttributes, injectedChildren, pages, ...rest } = config;

  let nextPages: unknown[];
  if (Array.isArray(pages)) {
    const hasHome = pages.some((p) => isRecord(p) && p.isHome === true);
    nextPages = pages.map((p, index) =>
      isRecord(p) ? { ...p, isHome: hasHome ? p.isHome === true : index === 0 } : p,
    );
  } else {
    nextPages = [
      {
        slug: "home",
        isHome: true,
        name: "الرئيسية",
        content: {
          sections: Array.isArray(sections) ? sections : [],
          ...(elementStyles !== undefined && { elementStyles }),
          ...(elementAttributes !== undefined && { elementAttributes }),
          ...(injectedChildren !== undefined && { injectedChildren }),
        },
      },
    ];
  }

  return { ...rest, schemaVersion: 1, pages: nextPages };
}

const MIGRATIONS: Record<number, (config: RawConfig) => RawConfig> = {
  0: v0ToV1,
};

export function migrateSiteConfig(raw: unknown): MigrateResult {
  if (!isRecord(raw)) return { ok: false, error: "invalid_config" };

  const declared = raw.schemaVersion;
  const fromVersion = declared === undefined ? 0 : declared;
  if (typeof fromVersion !== "number" || !Number.isInteger(fromVersion) || fromVersion < 0) {
    return { ok: false, error: "invalid_config" };
  }
  if (fromVersion > CURRENT_SITE_CONFIG_VERSION) {
    return { ok: false, error: "unsupported_version", fromVersion };
  }
  if (fromVersion === CURRENT_SITE_CONFIG_VERSION) {
    return { ok: true, fromVersion, migrated: false, config: raw };
  }

  let config = structuredClone(raw);
  for (let version = fromVersion; version < CURRENT_SITE_CONFIG_VERSION; version++) {
    const step = MIGRATIONS[version];
    if (!step) return { ok: false, error: "unsupported_version", fromVersion };
    config = step(config);
  }
  return { ok: true, fromVersion, migrated: true, config };
}
