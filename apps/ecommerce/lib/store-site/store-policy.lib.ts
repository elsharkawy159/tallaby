/**
 * What a store host shows for a page the seller hasn't built (ROADMAP.md F-46).
 * Template footers link to these slugs, and customers must stay on the store:
 * a policy or contact page shows the store's own details, and a page with
 * nothing to fall back on goes to the store's home.
 */

export type StorePolicyKind = "returns" | "shipping" | "contact";

const POLICY_SLUGS: Readonly<Record<string, StorePolicyKind>> = {
  returns: "returns",
  shipping: "shipping",
  contact: "contact",
};
const HOME_SLUGS = new Set(["about", "faq"]);

export type StorePageFallback = { policy: StorePolicyKind } | "home" | null;

export function storePageFallback(slug: string): StorePageFallback {
  const policy = Object.hasOwn(POLICY_SLUGS, slug) ? POLICY_SLUGS[slug] : undefined;
  if (policy) return { policy };
  return HOME_SLUGS.has(slug) ? "home" : null;
}

/** The seller's saved text for this page; contact has none, and blank counts as none. */
export function policyTextFor(
  kind: StorePolicyKind,
  policies: { returnPolicy: string | null; shippingPolicy: string | null } | null | undefined,
): string | null {
  const text = kind === "returns" ? policies?.returnPolicy : kind === "shipping" ? policies?.shippingPolicy : null;
  return text?.trim() || null;
}
