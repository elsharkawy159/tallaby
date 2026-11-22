/** How the seller adds a product. File is its own page (/products/add/from-file), so it isn't a view here. */
export type AddView = "choose" | "ai" | "url" | "manual";

/**
 * Which view `?method=` asks for. The param only picks a view: "ai" without AI
 * falls back to the choice, and no param or an unknown one is the choice. A
 * stored draft never opens the form by itself (owner, 2026-11-22): the choice
 * shows it with Continue and Delete.
 */
export function resolveAddView(param: string | null, aiEnabled: boolean): AddView {
  if (param === "manual") return "manual";
  if (param === "url") return "url";
  if (param === "ai") return aiEnabled ? "ai" : "choose";
  return "choose";
}

/**
 * Where a published new product goes instead of the products list: only the
 * welcome page (`?from=welcome`, docs/plans/seller-welcome.md), back to its
 * first-product step. Any other value is ignored (no open redirect: the path
 * is built here, never taken from the URL).
 */
export function addProductReturnHref(from: string | null, storeId: string): string | null {
  if (from !== "welcome" || !storeId) return null;
  return `/stores/${encodeURIComponent(storeId)}/welcome#product`;
}
