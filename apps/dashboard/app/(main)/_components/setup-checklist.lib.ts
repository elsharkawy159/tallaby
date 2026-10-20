/**
 * The home "get your store ready" checklist (PLAN.md §6.6, P3-04), computed
 * from data, never stored. Store steps belong to the store selected in the
 * sidebar; account steps (legal details, payout account) link to /settings.
 * "Publish your store" runs the builder's Publish from the home page and is
 * offered once the profile, first product and legal details are done.
 * Fulfillment is optional (minimal signup) and no longer a required step.
 */

export type SetupFlags = {
  profile: boolean;
  contact: boolean;
  product: boolean;
  /** Account: legal address (street + governorate) and a payout account (P3-05). */
  legal: boolean;
  /** The selected store's website is live (`site_status = 'published'`). */
  publish: boolean;
  payout: boolean;
  coupon: boolean;
  campaign: boolean;
};

export type SetupKey = keyof SetupFlags;

export type SetupTask = { key: SetupKey; href: string; done: boolean };

const STORE_STEPS = new Set<SetupKey>(["profile", "contact", "publish"]);

const STEPS: { key: SetupKey; href: (storeId: string) => string }[] = [
  { key: "profile", href: (id) => `/stores/${id}/settings` },
  { key: "product", href: () => "/products/add" },
  { key: "contact", href: (id) => `/stores/${id}/settings` },
  { key: "legal", href: () => "/settings#legal" },
  { key: "publish", href: (id) => `/stores/${id}/website` },
  { key: "payout", href: () => "/settings#payout" },
  { key: "coupon", href: () => "/coupons" },
  { key: "campaign", href: () => "/marketing" },
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

/** The steps a store needs before the checklist offers to publish it. */
export function publishReady(flags: SetupFlags): boolean {
  return flags.profile && flags.product && flags.legal;
}
