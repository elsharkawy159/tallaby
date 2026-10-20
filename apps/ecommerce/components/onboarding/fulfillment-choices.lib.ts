import {
  TALLABY_FULFILLMENT_ENABLED,
  sellerManagedPreset,
  tallabyAvailableEverywhere,
  tallabyPreset,
  type FulfillmentPlanView,
} from "@workspace/lib/fulfillment";
import type { OnboardingFormValues } from "./become-seller.dto";

// The choice helpers live in @workspace/lib/fulfillment (choices.ts), shared
// with the dashboard request flow (P8-01). Re-exported so imports keep working.
export {
  defaultPlanId,
  sellerManagedPreset,
  tallabyAvailable,
  tallabyAvailableEverywhere,
  tallabyChoice,
  tallabyPreset,
} from "@workspace/lib/fulfillment";

/**
 * Initial wizard values. While "Let Tallaby handle fulfillment" is "Soon"
 * (TALLABY_FULFILLMENT_ENABLED), new sellers start as seller-managed. Otherwise
 * the recommended setup: Tallaby fulfillment with the first (admin-ordered)
 * plan in every service, falling back to the plain defaults when Tallaby can't
 * cover every service yet, so a seller is never preselected into an option
 * they can't submit.
 */
export function recommendedDefaults(
  plans: readonly FulfillmentPlanView[],
  base: OnboardingFormValues
): OnboardingFormValues {
  if (!TALLABY_FULFILLMENT_ENABLED) {
    return { ...base, model: "seller_managed", services: sellerManagedPreset(plans) };
  }
  if (!tallabyAvailableEverywhere(plans)) return base;
  return {
    ...base,
    model: "tallaby_fulfillment",
    services: tallabyPreset(plans, base.services),
  };
}
