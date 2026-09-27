import { z } from "zod";
import {
  collectRequestIssues,
  governorateSchema,
  operationalDetailsSchema,
  pickupAddressSchema,
  requiresPickupAddress,
  type FulfillmentModel,
  type PickupAddress,
  type ServiceChoices,
} from "@workspace/lib/fulfillment";
import { BUSINESS_TYPE_OPTIONS } from "./become-seller.types";

/**
 * Seller onboarding schemas. Error messages are stable codes; the wizard
 * renders them through `onboarding.errors.<code>` so they are translated,
 * and the server returns the same codes keyed by form path.
 */

const BUSINESS_TYPES = BUSINESS_TYPE_OPTIONS.map((o) => o.value) as [
  string,
  ...string[],
];

export const businessInfoSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "business_name_short")
    .max(100, "too_long"),
  businessType: z.enum(BUSINESS_TYPES, { message: "required" }),
  description: z.string().trim().max(1000, "too_long").optional(),
  logoUrl: z.union([z.string().url("url_invalid"), z.literal("")]).optional(),
  supportEmail: z
    .string()
    .trim()
    .min(1, "required")
    .email("email_invalid")
    .max(255, "too_long"),
  supportPhone: z
    .string()
    .trim()
    .max(20, "too_long")
    .regex(/^[+\d\s()-]*$/, "phone_invalid")
    .optional(),
});

/** Stored as-is in `sellers.legal_address`; `state` holds a canonical governorate key. */
export const legalAddressSchema = z.object({
  street: z.string().trim().min(5, "street_required").max(200, "too_long"),
  city: z.string().trim().min(2, "city_required").max(100, "too_long"),
  state: governorateSchema,
  postalCode: z.string().trim().max(20, "too_long").optional(),
  country: z.literal("EG"),
});
export type LegalAddress = z.infer<typeof legalAddressSchema>;

// ---------------------------------------------------------------------------
// Form state (what react-hook-form holds; loose on purpose so partially
// filled drafts round-trip through localStorage)
// ---------------------------------------------------------------------------

export interface OnboardingFormValues {
  businessName: string;
  businessType: string;
  description: string;
  logoUrl: string;
  supportEmail: string;
  supportPhone: string;
  legalAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: "EG";
  };
  model: FulfillmentModel | "";
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
    sameAsLegal: boolean;
    governorate: string;
    city: string;
    street: string;
    landmark: string;
    contactName: string;
    contactPhone: string;
  };
  acceptTerms: boolean;
}

const sellerChoice = { provider: "seller" as const, planId: null };

export const onboardingDefaults: OnboardingFormValues = {
  businessName: "",
  businessType: "",
  description: "",
  logoUrl: "",
  supportEmail: "",
  supportPhone: "",
  legalAddress: { street: "", city: "", state: "", postalCode: "", country: "EG" },
  model: "",
  services: {
    storage: sellerChoice,
    packaging: sellerChoice,
    delivery: sellerChoice,
    customer_service: sellerChoice,
    returns: sellerChoice,
  },
  details: {
    estimatedSkus: "",
    estimatedDailyOrders: "",
    sizeCategory: "",
    hasFragileProducts: null,
    estimatedInventoryUnits: "",
    specialPackagingNotes: "",
    coverageGovernorates: [],
  },
  pickup: {
    sameAsLegal: true,
    governorate: "",
    city: "",
    street: "",
    landmark: "",
    contactName: "",
    contactPhone: "",
  },
  acceptTerms: false,
};

// ---------------------------------------------------------------------------
// Form -> submission
// ---------------------------------------------------------------------------

const blankToUndefined = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export function toOperationalDetails(values: OnboardingFormValues) {
  const d = values.details;
  const services = values.services;
  return {
    estimatedSkus: blankToUndefined(d.estimatedSkus),
    estimatedDailyOrders: blankToUndefined(d.estimatedDailyOrders),
    sizeCategory: blankToUndefined(d.sizeCategory),
    hasFragileProducts: d.hasFragileProducts ?? undefined,
    // Only keep answers for questions that were actually asked.
    estimatedInventoryUnits:
      services.storage.provider === "tallaby"
        ? blankToUndefined(d.estimatedInventoryUnits)
        : undefined,
    specialPackagingNotes:
      services.packaging.provider === "tallaby"
        ? blankToUndefined(d.specialPackagingNotes)
        : undefined,
    coverageGovernorates:
      services.delivery.provider === "tallaby" && d.coverageGovernorates.length
        ? d.coverageGovernorates
        : undefined,
  };
}

/** The pickup address the request will carry, or null when none is needed. */
export function toPickupAddress(values: OnboardingFormValues) {
  if (!requiresPickupAddress(values.services)) return null;
  const p = values.pickup;
  const source = p.sameAsLegal
    ? {
        governorate: values.legalAddress.state,
        city: values.legalAddress.city,
        street: values.legalAddress.street,
      }
    : { governorate: p.governorate, city: p.city, street: p.street };
  return {
    ...source,
    landmark: p.sameAsLegal ? undefined : blankToUndefined(p.landmark),
    contactName: blankToUndefined(p.contactName),
    contactPhone: p.contactPhone.trim(),
  };
}

/** Removes plan/config noise that doesn't apply to the chosen provider. */
export function normalizeServices(services: ServiceChoices): ServiceChoices {
  const out = { ...services };
  for (const key of Object.keys(out) as (keyof ServiceChoices)[]) {
    const choice = out[key];
    if (choice.provider === "seller") {
      out[key] = {
        provider: "seller",
        planId: null,
        ...(key === "delivery" && choice.config?.mode
          ? {
              config: {
                mode: choice.config.mode,
                ...(choice.config.mode === "external_courier" &&
                choice.config.courierName?.trim()
                  ? { courierName: choice.config.courierName.trim() }
                  : {}),
              },
            }
          : {}),
      };
    } else {
      out[key] = { provider: "tallaby", planId: choice.planId };
    }
  }
  return out;
}

export function toSubmission(values: OnboardingFormValues) {
  return {
    business: {
      businessName: values.businessName,
      businessType: values.businessType,
      description: blankToUndefined(values.description),
      logoUrl: values.logoUrl ?? "",
      supportEmail: values.supportEmail,
      supportPhone: blankToUndefined(values.supportPhone),
    },
    legalAddress: {
      ...values.legalAddress,
      postalCode: blankToUndefined(values.legalAddress.postalCode),
    },
    fulfillment: {
      model: values.model || undefined,
      services: normalizeServices(values.services),
      details: toOperationalDetails(values),
      pickupAddress: toPickupAddress(values),
    },
    acceptTerms: values.acceptTerms,
  };
}
export type OnboardingSubmission = ReturnType<typeof toSubmission>;

// ---------------------------------------------------------------------------
// Step validation. Each step validates only its own slice so errors appear
// on the step the seller is looking at; the server re-validates everything.
// ---------------------------------------------------------------------------

export interface FieldIssue {
  /** react-hook-form path, e.g. "legalAddress.city" or "services.delivery.planId". */
  path: string;
  code: string;
}

export const ONBOARDING_STEPS = [
  "business",
  "legal",
  "model",
  "services",
  "details",
  "review",
  "terms",
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

const zodIssues = (
  result: { success: true } | { success: false; error: z.ZodError },
  prefix: string
): FieldIssue[] =>
  result.success
    ? []
    : result.error.issues.map((issue) => ({
        path: [prefix, ...issue.path.map(String)].filter(Boolean).join("."),
        code: issue.message,
      }));

/** Maps a submission-shape path (pickupAddress.city) to the form field that owns it. */
export function toFormPath(path: string, values: OnboardingFormValues): string {
  if (!path.startsWith("pickupAddress")) return path;
  const field = path.split(".")[1];
  if (!field) return "pickup.contactPhone";
  if (values.pickup.sameAsLegal && ["governorate", "city", "street"].includes(field)) {
    return field === "governorate" ? "legalAddress.state" : `legalAddress.${field}`;
  }
  return `pickup.${field}`;
}

/** Which wizard step owns a form path; used to jump back to the first error. */
export function stepForPath(path: string): OnboardingStep {
  if (path.startsWith("legalAddress")) return "legal";
  if (path === "model") return "model";
  if (path.startsWith("services")) return "services";
  if (path.startsWith("details") || path.startsWith("pickup")) return "details";
  if (path === "acceptTerms") return "terms";
  return "business";
}

export function validateStep(
  step: OnboardingStep,
  values: OnboardingFormValues
): FieldIssue[] {
  const submission = toSubmission(values);

  switch (step) {
    case "business":
      return zodIssues(businessInfoSchema.safeParse(submission.business), "");
    case "legal":
      return zodIssues(
        legalAddressSchema.safeParse(submission.legalAddress),
        "legalAddress"
      );
    case "model":
      return values.model ? [] : [{ path: "model", code: "model_required" }];
    case "services":
      return collectRequestIssues({
        model: values.model || "seller_managed",
        services: submission.fulfillment.services,
        details: submission.fulfillment.details as never,
        pickupAddress: submission.fulfillment.pickupAddress as PickupAddress | null,
      })
        .filter((issue) => issue.path[0] === "services")
        .map((issue) => ({ path: issue.path.join("."), code: issue.message }));
    case "details": {
      const { details, pickupAddress, services } = submission.fulfillment;
      const issues = zodIssues(operationalDetailsSchema.safeParse(details), "details");
      if (pickupAddress) {
        issues.push(
          ...zodIssues(pickupAddressSchema.safeParse(pickupAddress), "pickupAddress")
        );
      }
      issues.push(
        ...collectRequestIssues({
          model: values.model || "seller_managed",
          services,
          details: details as never,
          pickupAddress: pickupAddress as PickupAddress | null,
        })
          .filter((issue) => issue.path[0] === "details")
          .map((issue) => ({ path: issue.path.join("."), code: issue.message }))
      );
      return dedupe(issues.map((issue) => ({ ...issue, path: toFormPath(issue.path, values) })));
    }
    case "review":
      return (["business", "legal", "model", "services", "details"] as const).flatMap(
        (s) => validateStep(s, values)
      );
    case "terms":
      return values.acceptTerms ? [] : [{ path: "acceptTerms", code: "terms_required" }];
  }
}

function dedupe(issues: FieldIssue[]): FieldIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    if (seen.has(issue.path)) return false;
    seen.add(issue.path);
    return true;
  });
}
