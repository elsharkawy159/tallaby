/**
 * "Is this store set up?" — the dashboard home's setup steps (ROADMAP.md F-86).
 * Six steps in this order (owner, 2026-11-27): products and categories, theme,
 * store identity, domain (optional), SEO (optional), wallet. Only the required
 * ones (product, theme, identity, wallet) count toward "set up"; the optional
 * ones never block anything. Shipping and payments are no longer steps, and
 * publishing hasn't been one since 2026-11-07. The dashboard home
 * (`setup-checklist.lib.ts`) and the setup reminder emails (F-94) both decide
 * with these predicates; the flags come from `storeSetupFlagColumns`
 * (store-setup.server.ts). Pure.
 */

export type StoreSetupFlags = {
  /** A template install not undone, or the site was ever published. */
  template: boolean;
  /** A logo, or the design system saved after the latest template install. */
  brand: boolean;
  /** An active product in the store. */
  product: boolean;
  /** `site_status = 'published'`. Not a step. */
  publish: boolean;
  /** Shipping settings saved, or a delivery zone. Not a home step (the store welcome page and the prompts read it). */
  shipping: boolean;
  /** The store exists: checkout offers cash on delivery by default, so payments need no save (owner, 2026-11-17). Not a step. */
  payments: boolean;
  /** An active custom domain of the store (`seller_custom_domains.status = 'active'`). */
  domain: boolean;
  /** The store saved its own SEO title or description on Website › SEO. */
  seo: boolean;
  /** The seller has a paid top-up (account level; same rule as `hasTopUp` in billing/order-lock.server.ts). */
  wallet: boolean;
};

export type StoreSetupStepKey = "product" | "theme" | "identity" | "domain" | "seo" | "wallet";

/** The steps in the order the home shows them. */
export const STORE_SETUP_STEP_KEYS: readonly StoreSetupStepKey[] = ["product", "theme", "identity", "domain", "seo", "wallet"];

export type StoreSetupOptionalStepKey = "domain" | "seo";
export type StoreSetupRequiredStepKey = Exclude<StoreSetupStepKey, StoreSetupOptionalStepKey>;

/** Steps shown with an "optional" label: they never count toward "set up" and never block anything. */
export const STORE_SETUP_OPTIONAL_STEPS: ReadonlySet<StoreSetupStepKey> = new Set<StoreSetupOptionalStepKey>(["domain", "seo"]);

/** The steps that decide "set up", in the home's order (the setup reminder emails list these). */
export const STORE_SETUP_REQUIRED_STEP_KEYS: readonly StoreSetupRequiredStepKey[] = ["product", "theme", "identity", "wallet"];

export const STORE_SETUP_STEP_DONE: Record<StoreSetupStepKey, (flags: StoreSetupFlags) => boolean> = {
  product: (f) => f.product,
  theme: (f) => f.template,
  identity: (f) => f.brand,
  domain: (f) => f.domain,
  seo: (f) => f.seo,
  wallet: (f) => f.wallet,
};

/** The required steps that aren't done; an optional step is never "missing". */
export function missingStoreSetupSteps(flags: StoreSetupFlags): StoreSetupStepKey[] {
  return STORE_SETUP_REQUIRED_STEP_KEYS.filter((key) => !STORE_SETUP_STEP_DONE[key](flags));
}

export function isStoreSetupDone(flags: StoreSetupFlags): boolean {
  return missingStoreSetupSteps(flags).length === 0;
}

/** The dashboard page of a step for one store (a path, same pages as the home cards). */
export function storeSetupStepHref(key: StoreSetupStepKey, storeId: string): string {
  const id = encodeURIComponent(storeId);
  switch (key) {
    case "product":
      return `/stores/${id}/products/add`;
    case "theme":
      return `/stores/${id}/website/templates`;
    case "identity":
      return `/stores/${id}/website/design`;
    case "domain":
      return `/stores/${id}/website/domain`;
    case "seo":
      return `/stores/${id}/website/seo`;
    case "wallet":
      // Account level: the seller's wallet, not a store page.
      return "/wallet";
  }
}
