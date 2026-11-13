/**
 * "Is this store set up?" — the dashboard home's four setup steps (ROADMAP.md
 * F-86, owner 2026-11-10): add a product, choose the store design (template
 * and brand together), set up payments, set up shipping. Publishing is not a
 * step since 2026-11-07. The dashboard home (`setup-checklist.lib.ts`) and the
 * setup reminder emails (F-94) both decide with these predicates; the flags
 * come from `storeSetupFlagColumns` (store-setup.server.ts). Pure.
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
  /** Shipping settings saved, or a delivery zone. */
  shipping: boolean;
  /** Payment methods saved, or a connected card gateway. */
  payments: boolean;
};

export type StoreSetupStepKey = "product" | "design" | "payments" | "shipping";

/** The steps in the order the home shows them. */
export const STORE_SETUP_STEP_KEYS: readonly StoreSetupStepKey[] = ["product", "design", "payments", "shipping"];

export const STORE_SETUP_STEP_DONE: Record<StoreSetupStepKey, (flags: StoreSetupFlags) => boolean> = {
  product: (f) => f.product,
  design: (f) => f.template && f.brand,
  payments: (f) => f.payments,
  shipping: (f) => f.shipping,
};

export function missingStoreSetupSteps(flags: StoreSetupFlags): StoreSetupStepKey[] {
  return STORE_SETUP_STEP_KEYS.filter((key) => !STORE_SETUP_STEP_DONE[key](flags));
}

export function isStoreSetupDone(flags: StoreSetupFlags): boolean {
  return missingStoreSetupSteps(flags).length === 0;
}

/** The dashboard page of a step for one store (a path, same pages as the home cards). */
export function storeSetupStepHref(key: StoreSetupStepKey, storeId: string, flags: StoreSetupFlags): string {
  const id = encodeURIComponent(storeId);
  switch (key) {
    case "product":
      return `/stores/${id}/products/add`;
    case "design":
      // No template yet: the gallery first; then the brand (logo, colours, fonts).
      return flags.template ? `/stores/${id}/website/design` : `/stores/${id}/website/templates`;
    case "payments":
      return `/stores/${id}/settings/payments`;
    case "shipping":
      return `/stores/${id}/shipping`;
  }
}
