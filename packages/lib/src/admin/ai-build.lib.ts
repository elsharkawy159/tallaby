/**
 * "Created with AI" facts for the admin store lists: the latest AI Store
 * Builder build (store_builds, 0141 + 0157) that built a store. Pure, so the
 * stores directory and the sellers table share one parser and one label.
 */

export type AiStoreBuildSource = "hero" | "dashboard";

export interface AiStoreBuild {
  /** hero = tallaby.com homepage, dashboard = the seller dashboard. */
  source: AiStoreBuildSource;
  /** When the build published the site; null = not published by the build. */
  publishedAt: string | null;
  /** When the build started. */
  createdAt: string;
}

function isoOrNull(value: unknown): string | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Reads the `json_build_object` the list queries select; anything else is null. */
export function parseAiStoreBuild(raw: unknown): AiStoreBuild | null {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const createdAt = isoOrNull(row.createdAt);
  if (!createdAt) return null;
  return {
    source: row.source === "hero" ? "hero" : "dashboard",
    publishedAt: isoOrNull(row.publishedAt),
    createdAt,
  };
}

/** "12 Nov 2026", Cairo day. */
function formatBuildDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Cairo",
  });
}

/**
 * Tooltip and aria-label of the AI icon, e.g.
 * "Created with AI · from tallaby.com homepage · 12 Nov 2026".
 * The date is the build's publish date, else its start date.
 */
export function aiStoreBuildLabel(build: AiStoreBuild): string {
  const from = build.source === "hero" ? "from tallaby.com homepage" : "from the dashboard";
  const date = build.publishedAt
    ? `published ${formatBuildDate(build.publishedAt)}`
    : `started ${formatBuildDate(build.createdAt)}`;
  return `Created with AI · ${from} · ${date}`;
}
