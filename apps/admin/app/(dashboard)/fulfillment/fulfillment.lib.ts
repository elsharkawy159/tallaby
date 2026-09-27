import type {
  FulfillmentAgreementStatus,
  FulfillmentPlanView,
  FulfillmentProvider,
  FulfillmentReviewStatus,
  FulfillmentServiceStatus,
  FulfillmentServiceType,
} from "@workspace/lib/fulfillment";

export const SERVICE_LABELS: Record<FulfillmentServiceType, string> = {
  storage: "Storage",
  packaging: "Packaging",
  delivery: "Delivery",
  customer_service: "Customer service",
  returns: "Returns",
};

export const STATUS_LABELS: Record<FulfillmentServiceStatus, string> = {
  requested: "Requested",
  under_review: "Under review",
  awaiting_agreement: "Awaiting agreement",
  active: "Active",
  paused: "Paused",
  rejected: "Rejected",
};

export const STATUS_CLASSES: Record<FulfillmentServiceStatus, string> = {
  requested: "bg-amber-100 text-amber-900 border-amber-200",
  under_review: "bg-blue-100 text-blue-900 border-blue-200",
  awaiting_agreement: "bg-violet-100 text-violet-900 border-violet-200",
  active: "bg-green-100 text-green-900 border-green-200",
  paused: "bg-gray-100 text-gray-800 border-gray-200",
  rejected: "bg-red-100 text-red-900 border-red-200",
};

export const REVIEW_LABELS: Record<FulfillmentReviewStatus, string> = {
  pending_contact: "Needs contact",
  contacted: "Contacted",
  configured: "Configured",
};

export const AGREEMENT_STATUS_LABELS: Record<FulfillmentAgreementStatus, string> = {
  draft: "Draft",
  proposed: "Proposed",
  accepted: "Accepted",
  active: "Active",
  superseded: "Superseded",
  terminated: "Terminated",
};

export const FEE_TYPE_LABELS = {
  storage: "Storage fee",
  packaging: "Packaging fee",
  delivery: "Delivery fee",
  return: "Return fee",
  customer_service: "Customer service fee",
  inbound_receiving: "Inbound receiving fee",
  special_handling: "Special handling fee",
  other: "Other",
} as const;

/** Display name of a rate: its own label for "other", the fee name otherwise. */
export function rateLabel(rate: { feeType: keyof typeof FEE_TYPE_LABELS; label?: string | null }): string {
  if (rate.feeType === "other") return rate.label?.trim() || FEE_TYPE_LABELS.other;
  return FEE_TYPE_LABELS[rate.feeType] ?? rate.feeType;
}

export const MODEL_LABELS = {
  seller_managed: "Seller-managed (mixed)",
  tallaby_fulfillment: "Tallaby fulfillment",
} as const;

/** "Tallaby — Storage Growth" / "Seller". */
export function describeChoice(
  provider: FulfillmentProvider,
  planId: string | null,
  plansById: Map<string, FulfillmentPlanView>
): string {
  if (provider === "seller") return "Seller";
  const plan = planId ? plansById.get(planId) : undefined;
  return plan ? `Tallaby — ${plan.nameEn}` : "Tallaby";
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Billing periods an agreement rate can be charged per. */
export const RATE_PERIODS = ["day", "week", "month", "quarter", "year"] as const;
export type RatePeriod = (typeof RATE_PERIODS)[number];
export const DEFAULT_RATE_PERIOD: RatePeriod = "month";

export const RATE_PERIOD_LABELS: Record<RatePeriod, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  quarter: "Quarter",
  year: "Year",
};

/** "per month"; tolerates unknown or missing values from older rows. */
export function formatRatePeriod(unit: string | null | undefined): string {
  if (!unit) return "";
  const label = RATE_PERIOD_LABELS[unit as RatePeriod];
  return ` / ${label ? label.toLowerCase() : unit}`;
}
