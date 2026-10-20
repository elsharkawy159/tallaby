import { describe, expect, it } from "vitest";
import { fulfillmentRequestSchema, type FulfillmentPlanView, type FulfillmentServiceType } from "@workspace/lib/fulfillment";
import { initialRequestValues, toFormPath, toFulfillmentRequest } from "./fulfillment-request.lib";

const plan = (id: string, code: string, serviceType: FulfillmentServiceType): FulfillmentPlanView => ({
  id,
  code,
  serviceType,
  nameEn: code,
  nameAr: code,
  descriptionEn: null,
  descriptionAr: null,
  features: [],
  limits: null,
  pricing: null,
  shippingSpeed: null,
  availability: null,
  isActive: true,
  sortOrder: 0,
});

const STORAGE = "00000000-0000-4000-8000-000000000001";
const DELIVERY = "00000000-0000-4000-8000-000000000002";
const plans = [plan(STORAGE, "storage_basic", "storage"), plan(DELIVERY, "delivery_standard", "delivery")];
const noRequest = { model: null, operationalDetails: undefined, pickupAddress: undefined, services: [] };

describe("initialRequestValues", () => {
  it("starts from today's setup when the seller has no rows", () => {
    const values = initialRequestValues(plans, noRequest);
    expect(values.model).toBe("seller_managed");
    expect(values.services.delivery).toEqual({ provider: "tallaby", planId: DELIVERY });
    expect(values.services.storage).toEqual({ provider: "seller", planId: null });
    expect(values.details.hasFragileProducts).toBeNull();
  });

  it("starts from the current request and saved answers", () => {
    const values = initialRequestValues(plans, {
      model: "seller_managed",
      operationalDetails: { estimatedSkus: "11_50", hasFragileProducts: true, coverageGovernorates: ["CAIRO", 4] },
      pickupAddress: { governorate: "GIZA", city: "Dokki", street: "1 Tahrir St", contactPhone: "01012345678" },
      services: [
        { serviceType: "storage", requestedProvider: "tallaby", requestedPlanId: STORAGE, requestedConfig: {} },
        { serviceType: "delivery", requestedProvider: "seller", requestedPlanId: null, requestedConfig: { mode: "own_riders" } },
      ],
    });
    expect(values.services.storage).toEqual({ provider: "tallaby", planId: STORAGE });
    expect(values.services.delivery).toMatchObject({ provider: "seller", planId: null, config: { mode: "own_riders" } });
    expect(values.details).toMatchObject({ estimatedSkus: "11_50", hasFragileProducts: true, coverageGovernorates: ["CAIRO"] });
    expect(values.pickup).toMatchObject({ governorate: "GIZA", city: "Dokki" });
  });

  it("starts every service as the seller's when no Tallaby plan is on offer", () => {
    const values = initialRequestValues([], {
      ...noRequest,
      services: [{ serviceType: "storage", requestedProvider: "tallaby", requestedPlanId: STORAGE, requestedConfig: {} }],
    });
    expect(values.services.storage).toEqual({ provider: "seller", planId: null });
    expect(values.services.delivery.provider).toBe("seller");
  });
});

describe("toFulfillmentRequest", () => {
  it("produces a payload the shared schema accepts, dropping unasked answers and the pickup address", () => {
    const values = initialRequestValues(plans, noRequest);
    // Tallaby storage: the seller drops stock off at the warehouse, so no pickup address.
    values.services.storage = { provider: "tallaby", planId: STORAGE };
    values.details = {
      ...values.details,
      estimatedSkus: "1_10",
      estimatedDailyOrders: "0_5",
      sizeCategory: "small",
      hasFragileProducts: false,
      estimatedInventoryUnits: "1_100",
      specialPackagingNotes: "not asked: packaging stays with the seller",
    };
    values.pickup.city = "Ignored";
    const payload = toFulfillmentRequest(values);
    expect(payload.details.estimatedInventoryUnits).toBe("1_100");
    expect(payload.details.specialPackagingNotes).toBeUndefined();
    expect(payload.pickupAddress).toBeNull();
    expect(fulfillmentRequestSchema.safeParse(payload).success).toBe(true);
  });

  it("requires a pickup address when Tallaby collects from the seller", () => {
    const values = initialRequestValues(plans, noRequest);
    values.details = { ...values.details, estimatedSkus: "1_10", estimatedDailyOrders: "0_5", sizeCategory: "small", hasFragileProducts: false };
    const result = fulfillmentRequestSchema.safeParse({ ...toFulfillmentRequest(values), pickupAddress: null });
    expect(result.success).toBe(false);
    const payload = toFulfillmentRequest(values);
    // Delivery by Tallaby from the seller's own stock needs a pickup address.
    expect(payload.pickupAddress).not.toBeNull();
    const issues = fulfillmentRequestSchema.safeParse(payload);
    expect(issues.success).toBe(false);
    expect(issues.error!.issues.map((i) => toFormPath(i.path.join(".")))).toContain("pickup.city");
  });
});
