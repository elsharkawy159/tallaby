/**
 * Where every pre-App Center app URL goes now (ROADMAP.md F-93). Documentation
 * the tests check against the registry, so a renamed slug can't silently break
 * an old link. `same`: the path still exists (the slug equals the old folder).
 * `redirect`: the page sends it on (server `redirect()`).
 */
export type LegacyAppRoute = { from: string; to: string; how: "same" | "redirect" };

export const LEGACY_APP_ROUTES: readonly LegacyAppRoute[] = [
  // Their own pages before F-93: each is now the app's page, with its settings one tab away.
  { from: "/stores/[storeId]/apps/bosta", to: "/stores/[storeId]/apps/bosta", how: "same" },
  { from: "/stores/[storeId]/apps/wassalha", to: "/stores/[storeId]/apps/wassalha", how: "same" },
  { from: "/stores/[storeId]/apps/size-chart", to: "/stores/[storeId]/apps/size-chart", how: "same" },
  { from: "/stores/[storeId]/apps/ai-assistants", to: "/stores/[storeId]/apps/ai-assistants", how: "same" },
  // The Google OAuth round-trip used to land on the Apps page (apps/page.tsx redirects it).
  { from: "/stores/[storeId]/apps?google=[result]", to: "/stores/[storeId]/apps/google-sheets/settings?google=[result]", how: "redirect" },
  // The list itself keeps its URL.
  { from: "/stores/[storeId]/apps", to: "/stores/[storeId]/apps", how: "same" },
];

/** The registry slug a store-scoped App Center path names, or null for the list. */
export function slugOfAppPath(path: string): string | null {
  const match = /^\/stores\/\[storeId\]\/apps\/([a-z0-9-]+)(?:\/settings)?(?:\?.*)?$/.exec(path);
  return match?.[1] ?? null;
}
