/**
 * Seller account plans (PLAN.md §11.2, P1-08).
 *
 * `sellers.plan` stores only the plan id; every limit lives here so future
 * subscriptions add plans without touching callers. Pure and edge-safe.
 */

export type PlanFeatures = {
  ai: boolean;
  advancedSettings: boolean;
  customDomain: boolean;
  removeTallabyBadge: boolean;
};

export type PlanLimits = PlanFeatures & {
  maxStores: number;
  aiCreditsMonthly: number;
};

export const PLANS = {
  free: {
    maxStores: 3,
    aiCreditsMonthly: 0,
    ai: false,
    advancedSettings: false,
    // Custom domains are already available to every seller today.
    customDomain: true,
    removeTallabyBadge: false,
  },
} as const satisfies Record<string, PlanLimits>;

export type PlanId = keyof typeof PLANS;

export const DEFAULT_PLAN: PlanId = "free";

/** Unknown, missing or retired plan ids fall back to Free (the safe default). */
export function resolvePlanId(plan: string | null | undefined): PlanId {
  const id = plan?.trim().toLowerCase();
  return id && Object.hasOwn(PLANS, id) ? (id as PlanId) : DEFAULT_PLAN;
}

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  return PLANS[resolvePlanId(plan)];
}

export function hasFeature(plan: string | null | undefined, feature: keyof PlanFeatures): boolean {
  return getPlanLimits(plan)[feature];
}

export type StoreLimitOptions = {
  /** Audited per-seller admin override (D27). Ignored unless a non-negative integer. */
  maxStoresOverride?: number | null;
};

export function getMaxStores(plan: string | null | undefined, options: StoreLimitOptions = {}): number {
  const override = options.maxStoresOverride;
  if (typeof override === "number" && Number.isInteger(override) && override >= 0) {
    return override;
  }
  return getPlanLimits(plan).maxStores;
}

/**
 * `currentCount` counts every store that is not soft-deleted, archived ones
 * included (D26). The caller must lock the seller row while counting.
 */
export function canCreateStore(
  plan: string | null | undefined,
  currentCount: number,
  options: StoreLimitOptions = {},
): boolean {
  return currentCount < getMaxStores(plan, options);
}
