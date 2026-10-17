/**
 * The home "get your store ready" checklist (PLAN.md §6.6, P3-04), computed
 * from data, never stored. Store steps belong to the store selected in the
 * sidebar. Legal address and payout details join with P3-05, when they have
 * an editor in the dashboard; "store published" joins with the builder (P4).
 * Fulfillment is optional (minimal signup) and no longer a required step.
 */

export type SetupFlags = {
  profile: boolean;
  contact: boolean;
  policies: boolean;
  product: boolean;
  coupon: boolean;
  campaign: boolean;
};

export type SetupKey = keyof SetupFlags;

export type SetupTask = { key: SetupKey; href: string; done: boolean };

const STORE_STEPS = new Set<SetupKey>(["profile", "contact", "policies"]);

const STEPS: { key: SetupKey; href: (storeId: string) => string }[] = [
  { key: "profile", href: (id) => `/stores/${id}/settings` },
  { key: "product", href: () => "/products/add" },
  { key: "contact", href: (id) => `/stores/${id}/settings` },
  { key: "policies", href: (id) => `/stores/${id}/settings/policies` },
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
