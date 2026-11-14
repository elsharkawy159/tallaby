/** How the seller adds a product. File is its own page (/products/add/from-file), so it isn't a view here. */
export type AddView = "pending" | "choose" | "ai" | "url" | "manual";

/** What the page found when it opened: "pending" until the browser can read the stored draft. */
export type AddEntry = "pending" | "draft" | "fresh";

/**
 * Which view `?method=` and the stored draft ask for. The param only picks a view:
 * "ai" without AI falls back to the choice, and anything unknown counts as no param.
 * No param with a draft opens the form with it, so this step never hides a seller's work.
 */
export function resolveAddView(param: string | null, entry: AddEntry, aiEnabled: boolean): AddView {
  if (param === "manual") return "manual";
  if (param === "url") return "url";
  if (param === "ai") return aiEnabled ? "ai" : "choose";
  if (param === "choose") return "choose";
  if (entry === "pending") return "pending";
  return entry === "draft" ? "manual" : "choose";
}
