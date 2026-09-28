import { describe, expect, it } from "vitest";
import {
  onboardingDefaults,
  stepForPath,
  toFormPath,
  toSubmission,
  validateStep,
  type OnboardingFormValues,
} from "./become-seller.dto";

const PLAN = "00000000-0000-4000-8000-000000000001";

const filled = (overrides: Partial<OnboardingFormValues> = {}): OnboardingFormValues => ({
  ...onboardingDefaults,
  businessName: "Nile Crafts",
  businessType: "individual",
  supportEmail: "hello@nilecrafts.example",
  supportPhone: "01012345678",
  legalAddress: { street: "12 Tahrir Street", city: "Dokki", state: "GIZA", postalCode: "", country: "EG" },
  model: "seller_managed",
  services: {
    ...onboardingDefaults.services,
    delivery: { provider: "seller", planId: null, config: { mode: "own_riders" } },
  },
  details: {
    ...onboardingDefaults.details,
    estimatedSkus: "11_50",
    estimatedDailyOrders: "0_5",
    sizeCategory: "small",
    hasFragileProducts: false,
  },
  acceptTerms: true,
  ...overrides,
});

const paths = (issues: { path: string }[]) => issues.map((i) => i.path);

describe("validateStep", () => {
  it("passes a complete all-seller application on every step", () => {
    const values = filled();
    for (const step of ["business", "legal", "model", "services", "details", "review", "terms"] as const) {
      expect(validateStep(step, values)).toEqual([]);
    }
  });

  it("only reports the current step's fields", () => {
    const values = filled({ businessName: "", model: "" });
    expect(paths(validateStep("business", values))).toEqual(["businessName"]);
    expect(paths(validateStep("model", values))).toEqual(["model"]);
    expect(validateStep("legal", values)).toEqual([]);
  });

  it("requires a valid Egyptian mobile support phone", () => {
    expect(paths(validateStep("business", filled({ supportPhone: "" })))).toEqual(["supportPhone"]);
    expect(validateStep("business", filled({ supportPhone: "12345" }))[0]?.code).toBe("phone_invalid");
  });

  it("treats the store banner as optional but rejects a malformed URL", () => {
    expect(validateStep("business", filled({ bannerUrl: "" }))).toEqual([]);
    expect(
      validateStep("business", filled({ bannerUrl: "https://cdn.example/banners/1-banner.png" })),
    ).toEqual([]);
    expect(validateStep("business", filled({ bannerUrl: "not a url" }))).toEqual([
      { path: "bannerUrl", code: "url_invalid" },
    ]);
  });

  it("requires a governorate from the canonical list for the legal address", () => {
    const values = filled({ legalAddress: { ...filled().legalAddress, state: "Giza City" } });
    expect(paths(validateStep("legal", values))).toEqual(["legalAddress.state"]);
  });

  it("requires a plan when Tallaby is chosen", () => {
    const values = filled({
      services: { ...filled().services, storage: { provider: "tallaby", planId: null } },
    });
    expect(validateStep("services", values)).toEqual([
      { path: "services.storage.planId", code: "plan_required" },
    ]);
  });

  it("asks for pickup contact only when Tallaby handles something", () => {
    const tallabyDelivery = filled({
      services: { ...filled().services, delivery: { provider: "tallaby", planId: PLAN } },
    });
    expect(paths(validateStep("details", tallabyDelivery))).toEqual(["pickup.contactPhone"]);
    expect(validateStep("details", filled())).toEqual([]);
  });

  it("maps pickup errors to the legal address when the seller reuses it", () => {
    const values = filled({
      services: { ...filled().services, returns: { provider: "tallaby", planId: PLAN } },
      legalAddress: { ...filled().legalAddress, city: "" },
      pickup: { ...onboardingDefaults.pickup, contactPhone: "01012345678" },
    });
    expect(paths(validateStep("details", values))).toEqual(["legalAddress.city"]);
    expect(stepForPath("legalAddress.city")).toBe("legal");
  });

  it("requires accepting the terms", () => {
    expect(paths(validateStep("terms", filled({ acceptTerms: false })))).toEqual(["acceptTerms"]);
  });
});

describe("toSubmission", () => {
  it("passes the banner through, empty when the seller skipped it", () => {
    const url = "https://cdn.example/banners/1-banner.png";
    expect(toSubmission(filled({ bannerUrl: url })).business.bannerUrl).toBe(url);
    expect(toSubmission(filled()).business.bannerUrl).toBe("");
  });

  it("drops answers to questions that weren't asked and strips seller plans", () => {
    const values = filled({
      details: {
        ...filled().details,
        estimatedInventoryUnits: "101_500",
        specialPackagingNotes: "glass",
        coverageGovernorates: ["CAIRO"],
      },
      services: {
        ...filled().services,
        packaging: { provider: "seller", planId: PLAN },
      },
    });
    const { fulfillment } = toSubmission(values);
    expect(fulfillment.details.estimatedInventoryUnits).toBeUndefined();
    expect(fulfillment.details.specialPackagingNotes).toBeUndefined();
    expect(fulfillment.details.coverageGovernorates).toBeUndefined();
    expect(fulfillment.services.packaging).toEqual({ provider: "seller", planId: null });
    expect(fulfillment.pickupAddress).toBeNull();
  });

  it("needs no pickup address when Tallaby stores - the seller drops inventory off", () => {
    const values = filled({
      services: {
        ...filled().services,
        storage: { provider: "tallaby", planId: PLAN },
        delivery: { provider: "tallaby", planId: PLAN },
      },
      details: { ...filled().details, estimatedInventoryUnits: "101_500" },
    });
    expect(toSubmission(values).fulfillment.pickupAddress).toBeNull();
    expect(validateStep("details", values)).toEqual([]);
  });

  it("builds the pickup address from the legal address when requested", () => {
    const values = filled({
      services: { ...filled().services, delivery: { provider: "tallaby", planId: PLAN } },
      pickup: { ...onboardingDefaults.pickup, contactPhone: " 01012345678 " },
    });
    expect(toSubmission(values).fulfillment.pickupAddress).toEqual({
      governorate: "GIZA",
      city: "Dokki",
      street: "12 Tahrir Street",
      landmark: undefined,
      contactName: undefined,
      contactPhone: "01012345678",
    });
  });

  it("keeps the courier name only for external couriers", () => {
    const values = filled({
      services: {
        ...filled().services,
        delivery: { provider: "seller", planId: null, config: { mode: "own_riders", courierName: "Bosta" } },
      },
    });
    expect(toSubmission(values).fulfillment.services.delivery).toEqual({
      provider: "seller",
      planId: null,
      config: { mode: "own_riders" },
    });
  });
});

describe("toFormPath", () => {
  it("routes pickup paths to the pickup form when entered separately", () => {
    const values = filled({ pickup: { ...onboardingDefaults.pickup, sameAsLegal: false } });
    expect(toFormPath("pickupAddress.city", values)).toBe("pickup.city");
    expect(toFormPath("pickupAddress", values)).toBe("pickup.contactPhone");
    expect(toFormPath("services.delivery.planId", values)).toBe("services.delivery.planId");
  });
});
