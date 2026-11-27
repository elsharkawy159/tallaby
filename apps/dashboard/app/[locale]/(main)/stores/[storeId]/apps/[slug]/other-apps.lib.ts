/** How many apps the "Other apps" carousel shows under an app page. */
export const OTHER_APPS_LIMIT = 8;

/**
 * A random handful of the given apps (owner, 2026-11-27: "random apps that
 * not installed"). Fisher–Yates on a copy, so the input is never changed;
 * `random` is injectable for tests. The caller filters out installed apps
 * and the current one.
 */
export function pickOtherApps<T>(apps: readonly T[], limit = OTHER_APPS_LIMIT, random: () => number = Math.random): T[] {
  const copy = [...apps];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, Math.max(0, limit));
}
