/** A store counts as just created for this long after its first publish. */
export const RECENT_WINDOW_MS = 60 * 60 * 1000;
/** After this long the line shows nothing at all. */
export const LATEST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** How many just-created stores the line can rotate through. */
export const RECENT_STORES_LIMIT = 5;

export type RecentStore = { name: string; publishedAt: string | null };
export type DatedStore = { name: string; publishedAtMs: number };

export type StoreLine =
  | { kind: "recent"; stores: DatedStore[] }
  | { kind: "latest"; store: DatedStore }
  | { kind: "none" };

export type StoreAge = { unit: "now" } | { unit: "minutes" | "hours" | "days"; count: number };

/**
 * What the home page's live line says at `now`. Both limits are inclusive: exactly
 * 60 minutes is still recent, and exactly 7 days is still shown. A store with no
 * name, or a time that is missing, unreadable or in the future, is ignored, and
 * nothing here ever stands in for a missing store.
 */
export function selectStoreLine(stores: readonly RecentStore[], now: number): StoreLine {
  const dated = stores
    .map((store) => ({ name: store.name.trim(), publishedAtMs: store.publishedAt ? Date.parse(store.publishedAt) : Number.NaN }))
    .filter((store) => store.name && store.publishedAtMs <= now && now - store.publishedAtMs <= LATEST_WINDOW_MS)
    .sort((a, b) => b.publishedAtMs - a.publishedAtMs);

  const recent = dated.filter((store) => now - store.publishedAtMs <= RECENT_WINDOW_MS);
  if (recent.length > 0) return { kind: "recent", stores: recent.slice(0, RECENT_STORES_LIMIT) };
  const latest = dated[0];
  return latest ? { kind: "latest", store: latest } : { kind: "none" };
}

/** The age to print, in whole units rounded down, so a store never reads newer than it is by more than its unit. */
export function storeAge(publishedAtMs: number, now: number): StoreAge {
  const minutes = Math.floor((now - publishedAtMs) / 60_000);
  if (minutes < 1) return { unit: "now" };
  if (minutes < 60) return { unit: "minutes", count: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { unit: "hours", count: hours };
  return { unit: "days", count: Math.floor(hours / 24) };
}
