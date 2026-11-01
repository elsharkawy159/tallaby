/**
 * The home "get your store ready" checklist (PLAN.md §6.6, P3-04), computed
 * from data, never stored. Ordered so a new seller finishes the store in
 * minutes (owner, 2026-11-01): choose a template, set the brand identity
 * (logo, colours, fonts), add a product, then publish. Shipping comes last
 * and is optional ("later"): it never counts toward setup being done.
 * Store steps belong to the store selected in the sidebar. "Publish your
 * store" runs the builder's Publish from the home page and is offered once
 * there is an active product and the seller has chosen a template.
 */

export type SetupFlags = {
  /**
   * The seller chose a template for the selected store: an install not
   * undone, or the site was ever published (same rule as
   * storeTemplateChosen in @workspace/lib). The new-store Classic
   * placeholder drafts write no install, so they do not count.
   */
  template: boolean;
  /**
   * The selected store has a logo, or its design system (colours, fonts,
   * buttons) was saved after its latest template install.
   */
  brand: boolean;
  /** The seller has an active product. */
  product: boolean;
  /** The selected store's website is live (`site_status = 'published'`). */
  publish: boolean;
  /** The selected store saved its shipping settings or has a delivery zone. */
  shipping: boolean;
};

export type SetupKey = keyof SetupFlags;

export type SetupTask = { key: SetupKey; href: string; done: boolean; optional: boolean };

const STORE_STEPS = new Set<SetupKey>(["template", "brand", "publish", "shipping"]);

/** Steps that can wait: shown last, never block setup being done. */
const OPTIONAL_STEPS = new Set<SetupKey>(["shipping"]);

const STEPS: { key: SetupKey; href: (storeId: string) => string }[] = [
  { key: "template", href: (id) => `/stores/${id}/website/templates` },
  { key: "brand", href: (id) => `/stores/${id}/website/design` },
  { key: "product", href: () => "/products/add" },
  { key: "publish", href: (id) => `/stores/${id}/website` },
  { key: "shipping", href: (id) => `/stores/${id}/shipping` },
];

export function buildSetupTasks(flags: SetupFlags, storeId: string | null): SetupTask[] {
  return STEPS.filter((step) => storeId || !STORE_STEPS.has(step.key)).map((step) => ({
    key: step.key,
    href: step.href(storeId ?? ""),
    done: flags[step.key],
    optional: OPTIONAL_STEPS.has(step.key),
  }));
}

/** The required steps are done: the store is ready for its first order. */
export function isSetupDone(flags: SetupFlags, storeId: string | null): boolean {
  return buildSetupTasks(flags, storeId).every((task) => task.done || task.optional);
}

/** Every step, the later ones too, is done: the guide can go away. */
export function isGuideDone(flags: SetupFlags, storeId: string | null): boolean {
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
  if (!flags.template) return "lockedTemplate";
  if (!flags.product) return "locked";
  return null;
}
