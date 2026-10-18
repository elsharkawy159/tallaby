import {
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
 * Initial wizard values: the recommended setup, "Let Tallaby handle
 * fulfillment" with the first (admin-ordered) plan in every service. Falls
 * back to the plain defaults when Tallaby can't cover every service yet, so a
 * seller is never preselected into an option they can't submit.
 */
export function recommendedDefaults(
  plans: readonly FulfillmentPlanView[],
  base: OnboardingFormValues
): OnboardingFormValues {
  if (!tallabyAvailableEverywhere(plans)) return base;
  return {
    ...base,
    model: "tallaby_fulfillment",
    services: tallabyPreset(plans, base.services),
  };
}
