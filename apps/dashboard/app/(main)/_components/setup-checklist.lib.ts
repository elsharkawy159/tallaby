/**
 * The home "get your store ready" checklist (PLAN.md §6.6, P3-04), computed
 * from data, never stored. Only the steps a store needs for its first order:
 * a product, a website template, shipping, then publishing. Store steps
 * belong to the store selected in the sidebar. "Publish your store" runs the
 * builder's Publish from the home page and is offered once there is an
 * active product and the seller has chosen a template for the store.
 */

export type SetupFlags = {
  /** The seller has an active product. */
  product: boolean;
  /**
   * The seller chose a template for the selected store: an install not
   * undone, or the site was ever published (same rule as
   * storeTemplateChosen in @workspace/lib). The new-store Classic
   * placeholder drafts write no install, so they do not count.
   */
  template: boolean;
  /** The selected store saved its shipping settings or has a delivery zone. */
  shipping: boolean;
  /** The selected store's website is live (`site_status = 'published'`). */
  publish: boolean;
};

export type SetupKey = keyof SetupFlags;

export type SetupTask = { key: SetupKey; href: string; done: boolean };

const STORE_STEPS = new Set<SetupKey>(["template", "shipping", "publish"]);

const STEPS: { key: SetupKey; href: (storeId: string) => string }[] = [
  { key: "product", href: () => "/products/add" },
  { key: "template", href: (id) => `/stores/${id}/website/templates` },
  { key: "shipping", href: (id) => `/stores/${id}/shipping` },
  { key: "publish", href: (id) => `/stores/${id}/website` },
];

export function buildSetupTasks(flags: SetupFlags, storeId: string | null): SetupTask[] {
  return STEPS.filter((step) => storeId || !STORE_STEPS.has(step.key)).map((step) => ({
    key: step.key,
    href: step.href(storeId ?? ""),
    done: flags[step.key],
  }));
}

export function isSetupDone(flags: SetupFlags, storeId: string | null): boolean {
  return buildSetupTasks(flags, storeId).every((task) => task.done);
}

/**
 * The steps a store needs before the checklist offers to publish it: an
 * active product and a template the seller chose (owner 2026-10-27; the
 * placeholder Tallaby Classic drafts are not a choice). The publish action
 * enforces the template rule again on the server (publishStoreSite).
 */
export function publishReady(flags: SetupFlags): boolean {
  return flags.product && flags.template;
}

/** Why "Publish now" is locked, as a `home.setup.publish` message key; null when it is not. */
export function publishLockReason(flags: SetupFlags): "locked" | "lockedTemplate" | null {
  if (!flags.product) return "locked";
  if (!flags.template) return "lockedTemplate";
  return null;
}
