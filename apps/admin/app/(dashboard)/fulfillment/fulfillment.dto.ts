import { z } from "zod";
import {
  FULFILLMENT_AGREEMENT_STATUSES,
  FULFILLMENT_FEE_TYPES,
  FULFILLMENT_REVIEW_STATUSES,
  FULFILLMENT_SERVICE_STATUSES,
  FULFILLMENT_SERVICE_TYPES,
  feeTypesForService,
} from "@workspace/lib/fulfillment";
import { DEFAULT_RATE_PERIOD, RATE_PERIODS } from "./fulfillment.lib";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

/** Parses a JSON object text field; empty means null ("not configured"). */
const jsonObjectText = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        ctx.addIssue({ code: "custom", message: "Must be a JSON object" });
        return z.NEVER;
      }
      return Object.keys(parsed).length ? (parsed as Record<string, unknown>) : null;
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid JSON" });
      return z.NEVER;
    }
  });

export const planFormSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{3,60}$/, "Lowercase letters, numbers and underscores (3-60)"),
  serviceType: z.enum(FULFILLMENT_SERVICE_TYPES),
  nameEn: z.string().trim().min(2, "Required").max(100),
  nameAr: z.string().trim().min(2, "Required").max(100),
  descriptionEn: optionalText(500),
  descriptionAr: optionalText(500),
  features: z
    .array(z.object({ en: z.string().trim().min(1).max(150), ar: z.string().trim().min(1).max(150) }))
    .max(20),
  limits: jsonObjectText,
  // Pricing is optional by design: no amount + no note = "discussed with our team".
  pricingAmount: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) {
        ctx.addIssue({ code: "custom", message: "Enter a non-negative number" });
        return z.NEVER;
      }
      return n;
    }),
  pricingModel: z.enum(["fixed", "per_unit", "per_order", "monthly", "custom"]).nullable(),
  pricingUnit: optionalText(40),
  pricingNoteEn: optionalText(200),
  pricingNoteAr: optionalText(200),
  shippingSpeed: z.enum(["standard", "expedited", "priority", "one_day", "same_day"]).nullable(),
  availabilityGovernorates: z.array(z.string()).max(40),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
});
export type PlanFormInput = z.input<typeof planFormSchema>;
export type PlanFormData = z.output<typeof planFormSchema>;

export const serviceStatusSchema = z.object({
  sellerId: z.string().uuid(),
  serviceType: z.enum(FULFILLMENT_SERVICE_TYPES),
  // `active` is only reachable through activation (copies requested -> active).
  status: z.enum(FULFILLMENT_SERVICE_STATUSES).exclude(["active"]),
  notes: optionalText(1000),
});

export const activateServiceSchema = z.object({
  sellerId: z.string().uuid(),
  serviceType: z.enum(FULFILLMENT_SERVICE_TYPES),
  agreementId: z.string().uuid().nullable().optional(),
  notes: optionalText(1000),
});

export const reviewSchema = z.object({
  sellerId: z.string().uuid(),
  reviewStatus: z.enum(FULFILLMENT_REVIEW_STATUSES),
  adminNotes: optionalText(2000),
});

export const agreementSchema = z
  .object({
    id: z.string().uuid().optional(),
    sellerId: z.string().uuid(),
    serviceType: z.enum(FULFILLMENT_SERVICE_TYPES),
    planId: z.string().uuid().nullable(),
    rates: z
      .array(
        z.object({
          feeType: z.enum(FULFILLMENT_FEE_TYPES),
          label: optionalText(100),
          amount: z.coerce.number().min(0),
          unit: z.enum(RATE_PERIODS).default(DEFAULT_RATE_PERIOD),
          note: optionalText(200),
        })
      )
      .max(20),
    effectiveFrom: z.string().date().nullable(),
    effectiveTo: z.string().date().nullable(),
    status: z.enum(FULFILLMENT_AGREEMENT_STATUSES),
    notes: optionalText(2000),
  })
  .refine((v) => !v.effectiveFrom || !v.effectiveTo || v.effectiveTo >= v.effectiveFrom, {
    path: ["effectiveTo"],
    message: "End date must be after the start date",
  })
  .superRefine((v, ctx) => {
    // A rate is either this service's own fee, special handling, or a named "other".
    const allowed = feeTypesForService(v.serviceType);
    v.rates.forEach((rate, index) => {
      if (!allowed.includes(rate.feeType)) {
        ctx.addIssue({ code: "custom", path: ["rates", index, "feeType"], message: "This fee doesn't belong to the selected service" });
      }
      if (rate.feeType === "other" && !rate.label) {
        ctx.addIssue({ code: "custom", path: ["rates", index, "label"], message: "Name the \"other\" fee" });
      }
    });
  });
export type AgreementInput = z.input<typeof agreementSchema>;
