import {
  BASELINE_DELIVERY_PLAN_CODE,
  FULFILLMENT_SERVICE_TYPES,
  plansForService,
  type FulfillmentPlanView,
  type FulfillmentServiceType,
  type ServiceChoice,
  type ServiceChoices,
} from "@workspace/lib/fulfillment";
import type { OnboardingFormValues } from "./become-seller.dto";

/** First active plan for a service (admin sort order), or null if Tallaby doesn't offer it yet. */
export function defaultPlanId(
  plans: readonly FulfillmentPlanView[],
  serviceType: FulfillmentServiceType
): string | null {
  return plansForService(plans, serviceType)[0]?.id ?? null;
}

export function tallabyAvailable(
  plans: readonly FulfillmentPlanView[],
  serviceType: FulfillmentServiceType
): boolean {
  return plansForService(plans, serviceType).length > 0;
}

/** Tallaby choice that keeps an already-selected, still-available plan. */
export function tallabyChoice(
  plans: readonly FulfillmentPlanView[],
  serviceType: FulfillmentServiceType,
  current?: ServiceChoice
): ServiceChoice {
  const available = plansForService(plans, serviceType);
  const keep =
    current?.provider === "tallaby" && available.some((p) => p.id === current.planId);
  return {
    provider: "tallaby",
    planId: keep ? current!.planId : (available[0]?.id ?? null),
  };
}

/** "Let Tallaby handle fulfillment": every service with Tallaby. */
export function tallabyPreset(
  plans: readonly FulfillmentPlanView[],
  current: ServiceChoices
): ServiceChoices {
  return Object.fromEntries(
    FULFILLMENT_SERVICE_TYPES.map((type) => [type, tallabyChoice(plans, type, current[type])])
  ) as ServiceChoices;
}

/**
 * Starting point for "I want to manage fulfillment": how sellers operate today
 * (they store, pack, answer customers and handle returns; Tallaby's standard
 * delivery ships the orders). Everything stays editable on the next step.
 */
export function sellerManagedPreset(plans: readonly FulfillmentPlanView[]): ServiceChoices {
  const seller: ServiceChoice = { provider: "seller", planId: null };
  const deliveryPlans = plansForService(plans, "delivery");
  const standard =
    deliveryPlans.find((p) => p.code === BASELINE_DELIVERY_PLAN_CODE) ?? deliveryPlans[0];
  return {
    storage: seller,
    packaging: seller,
    delivery: standard ? { provider: "tallaby", planId: standard.id } : seller,
    customer_service: seller,
    returns: seller,
  };
}

/** True when Tallaby offers an active plan for every service. */
export function tallabyAvailableEverywhere(plans: readonly FulfillmentPlanView[]): boolean {
  return FULFILLMENT_SERVICE_TYPES.every((type) => tallabyAvailable(plans, type));
}

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
