import {
  FULFILLMENT_SERVICE_TYPES,
  normalizeServiceChoices,
  requiresPickupAddress,
  sellerManagedPreset,
  type FulfillmentModel,
  type FulfillmentPlanView,
  type FulfillmentProvider,
  type ServiceChoice,
  type ServiceChoices,
  type ServiceConfig,
} from "@workspace/lib/fulfillment";

/**
 * Form state for the dashboard "Request Tallaby services" flow (PLAN.md §15,
 * P8-01) and its conversion to the shared `fulfillmentRequestSchema` shape.
 * Mirrors the onboarding wizard's form (apps/ecommerce become-seller.dto.ts),
 * minus the business/legal parts a signed-up seller already has.
 */

export interface FulfillmentRequestFormValues {
  model: FulfillmentModel;
  services: ServiceChoices;
  details: {
    estimatedSkus: string;
    estimatedDailyOrders: string;
    sizeCategory: string;
    hasFragileProducts: boolean | null;
    estimatedInventoryUnits: string;
    specialPackagingNotes: string;
    coverageGovernorates: string[];
  };
  pickup: {
    governorate: string;
    city: string;
    street: string;
    landmark: string;
    contactName: string;
    contactPhone: string;
  };
}

/** What the page knows about the seller's existing request (all optional: sellers may have no rows). */
export interface ExistingFulfillmentRequest {
  model: FulfillmentModel | null;
  operationalDetails: unknown;
  pickupAddress: unknown;
  services: {
    serviceType: (typeof FULFILLMENT_SERVICE_TYPES)[number];
    requestedProvider: FulfillmentProvider;
    requestedPlanId: string | null;
    requestedConfig: ServiceConfig;
  }[];
}

const str = (value: unknown) => (typeof value === "string" ? value : "");
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

/** Starts from the seller's current request, or from today's setup when there is none. */
export function initialRequestValues(
  plans: readonly FulfillmentPlanView[],
  existing: ExistingFulfillmentRequest
): FulfillmentRequestFormValues {
  const services = sellerManagedPreset(plans);
  for (const row of existing.services) {
    const choice: ServiceChoice = {
      provider: row.requestedProvider,
      planId: row.requestedProvider === "tallaby" ? row.requestedPlanId : null,
      ...(row.requestedConfig?.mode
        ? { config: { mode: row.requestedConfig.mode, courierName: row.requestedConfig.courierName } }
        : {}),
    };
    services[row.serviceType] = choice;
  }

  const d = record(existing.operationalDetails);
  const p = record(existing.pickupAddress);
  return {
    model: existing.model ?? "seller_managed",
    services,
    details: {
      estimatedSkus: str(d.estimatedSkus),
      estimatedDailyOrders: str(d.estimatedDailyOrders),
      sizeCategory: str(d.sizeCategory),
      hasFragileProducts: typeof d.hasFragileProducts === "boolean" ? d.hasFragileProducts : null,
      estimatedInventoryUnits: str(d.estimatedInventoryUnits),
      specialPackagingNotes: str(d.specialPackagingNotes),
      coverageGovernorates: Array.isArray(d.coverageGovernorates)
        ? d.coverageGovernorates.filter((g): g is string => typeof g === "string")
        : [],
    },
    pickup: {
      governorate: str(p.governorate),
      city: str(p.city),
      street: str(p.street),
      landmark: str(p.landmark),
      contactName: str(p.contactName),
      contactPhone: str(p.contactPhone),
    },
  };
}

const blankToUndefined = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/** The payload the server action validates with `fulfillmentRequestSchema`. */
export function toFulfillmentRequest(values: FulfillmentRequestFormValues) {
  const services = normalizeServiceChoices(values.services);
  const d = values.details;
  const p = values.pickup;
  return {
    model: values.model,
    services,
    details: {
      estimatedSkus: blankToUndefined(d.estimatedSkus),
      estimatedDailyOrders: blankToUndefined(d.estimatedDailyOrders),
      sizeCategory: blankToUndefined(d.sizeCategory),
      hasFragileProducts: d.hasFragileProducts ?? undefined,
      // Only keep answers for questions that were actually asked.
      estimatedInventoryUnits:
        services.storage.provider === "tallaby" ? blankToUndefined(d.estimatedInventoryUnits) : undefined,
      specialPackagingNotes:
        services.packaging.provider === "tallaby" ? blankToUndefined(d.specialPackagingNotes) : undefined,
      coverageGovernorates:
        services.delivery.provider === "tallaby" && d.coverageGovernorates.length
          ? d.coverageGovernorates
          : undefined,
    },
    pickupAddress: requiresPickupAddress(services)
      ? {
          governorate: p.governorate,
          city: p.city,
          street: p.street,
          landmark: blankToUndefined(p.landmark),
          contactName: blankToUndefined(p.contactName),
          contactPhone: p.contactPhone.trim(),
        }
      : null,
  };
}

/** Maps a submission path (pickupAddress.city) to the form field that shows its error. */
export function toFormPath(path: string): string {
  return path.startsWith("pickupAddress.") ? `pickup.${path.slice("pickupAddress.".length)}` : path === "pickupAddress" ? "pickup.contactPhone" : path;
}
