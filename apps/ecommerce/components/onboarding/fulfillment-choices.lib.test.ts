import { describe, expect, it } from "vitest";
import {
  FULFILLMENT_SERVICE_TYPES,
  type FulfillmentPlanView,
  type FulfillmentServiceType,
} from "@workspace/lib/fulfillment";
import { onboardingDefaults, validateStep } from "./become-seller.dto";
import { recommendedDefaults } from "./fulfillment-choices.lib";

const plan = (
  id: string,
  serviceType: FulfillmentServiceType,
  sortOrder: number,
  isActive = true
): FulfillmentPlanView => ({
  id,
  code: `${serviceType}_${id}`,
  serviceType,
  nameEn: id,
  nameAr: id,
  descriptionEn: null,
  descriptionAr: null,
  features: [],
  limits: null,
  pricing: null,
  shippingSpeed: null,
  availability: null,
  isActive,
  sortOrder,
});

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const fullCatalog = [
  plan(uuid(1), "storage", 20),
  plan(uuid(2), "storage", 10), // lowest sort order -> default
  plan(uuid(3), "packaging", 10),
  plan(uuid(4), "delivery", 10),
  plan(uuid(5), "customer_service", 10),
  plan(uuid(6), "returns", 10),
];

describe("recommendedDefaults", () => {
  it("preselects Tallaby fulfillment with the first plan of every service", () => {
    const values = recommendedDefaults(fullCatalog, onboardingDefaults);
    expect(values.model).toBe("tallaby_fulfillment");
    for (const type of FULFILLMENT_SERVICE_TYPES) {
      expect(values.services[type].provider).toBe("tallaby");
    }
    expect(values.services.storage.planId).toBe(uuid(2));
    // The preselection is a valid answer to the model and services steps.
    expect(validateStep("model", values)).toEqual([]);
    expect(validateStep("services", values)).toEqual([]);
  });

  it("falls back to no preselection when Tallaby can't cover every service", () => {
    const partial = fullCatalog.filter((p) => p.serviceType !== "returns");
    expect(recommendedDefaults(partial, onboardingDefaults)).toBe(onboardingDefaults);
    const inactive = fullCatalog.map((p) =>
      p.serviceType === "returns" ? { ...p, isActive: false } : p
    );
    expect(recommendedDefaults(inactive, onboardingDefaults).model).toBe("");
  });
});
