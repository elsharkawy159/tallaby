import { z } from "zod";
import {
  COLLECTION_METHODS,
  DELIVERY_FAILURE_REASONS,
  PAYMENT_STATUSES,
  RIDER_STATUSES,
  SHIPPING_STATUSES,
} from "@/lib/shipping-status";

const FAILURE_REASON_CODES = DELIVERY_FAILURE_REASONS.map((r) => r.code) as [
  string,
  ...string[],
];

export const PAGE_SIZE = 100;

const pageSchema = z.coerce.number().int().min(1);
const pageSizeSchema = z.coerce.number().int().min(1).max(100);

/**
 * The order pipeline's tabs. Each is a derived predicate over
 * `orders.status` + `shipments.status` (see `stageWhere()` in
 * orders.server.ts) — there is no `stage` column. "all" keeps the old free
 * `?status=` filter reachable for backward-compatible deep links.
 */
export const ORDER_STAGES = [
  "all",
  "pending",
  "confirmed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "failed",
  "cancelled",
  "returned",
] as const;

export type OrderStage = (typeof ORDER_STAGES)[number];

/** Happy-path stages on the All tab (before terminal sections). */
export const PIPELINE_STAGES = [
  "pending",
  "confirmed",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const satisfies readonly Exclude<OrderStage, "all">[];

/** Terminal sections rendered after Delivered on the All tab. */
export const TERMINAL_STAGES = ["failed", "cancelled", "returned"] as const satisfies readonly Exclude<
  OrderStage,
  "all"
>[];

export const ALL_PAGE_SECTIONS = [...PIPELINE_STAGES, ...TERMINAL_STAGES] as const;

export type AllPageSection = (typeof ALL_PAGE_SECTIONS)[number];

export const shippingFiltersSchema = z.object({
  stage: z.enum(ORDER_STAGES).default("all"),
  search: z.string().trim().max(200).optional(),
  status: z.enum(SHIPPING_STATUSES).optional(),
  providerId: z.uuid().optional(),
  riderId: z.uuid().optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  codOnly: z.enum(["cod", "prepaid"]).optional(),
  page: pageSchema.default(1),
  pageSize: pageSizeSchema.default(PAGE_SIZE),
});

export type ShippingFilters = z.infer<typeof shippingFiltersSchema>;

export const assignProviderSchema = z.object({
  orderId: z.uuid(),
  providerId: z.uuid().nullable(),
});

export const assignRiderSchema = z.object({
  orderId: z.uuid(),
  riderId: z.uuid().nullable(),
});

export const updateStatusSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(SHIPPING_STATUSES),
  failureReason: z.string().trim().max(500).optional(),
});

export const riderUpdateStatusSchema = z.object({
  shipmentId: z.uuid(),
  status: z.enum(RIDER_STATUSES),
  reasonCode: z.enum(FAILURE_REASON_CODES).optional(),
  failureReason: z.string().trim().max(500).optional(),
});

export const collectPaymentSchema = z.object({
  shipmentId: z.uuid(),
  amount: z.coerce.number().min(0).max(1_000_000),
  method: z.enum(COLLECTION_METHODS),
});

export const addDeliveryNoteSchema = z.object({
  shipmentId: z.uuid(),
  note: z.string().trim().min(1).max(500),
});

export const toggleProviderSchema = z.object({
  providerId: z.uuid(),
  isActive: z.boolean(),
});

/**
 * Search params arrive as strings and may be absent or hand-edited. Each field
 * is parsed independently so one bad value degrades only itself: a malformed
 * page number should not silently discard the search term.
 */
export function parseFilters(
  params: Record<string, string | undefined>
): ShippingFilters {
  const pick = <T>(schema: z.ZodType<T>, value: string | undefined): T | undefined => {
    if (!value) return undefined;
    const result = schema.safeParse(value);
    return result.success ? result.data : undefined;
  };

  return {
    stage: pick(shippingFiltersSchema.shape.stage, params.stage) ?? "all",
    search: pick(shippingFiltersSchema.shape.search, params.search),
    status: pick(shippingFiltersSchema.shape.status, params.status),
    providerId: pick(shippingFiltersSchema.shape.providerId, params.providerId),
    riderId: pick(shippingFiltersSchema.shape.riderId, params.riderId),
    paymentStatus: pick(shippingFiltersSchema.shape.paymentStatus, params.paymentStatus),
    codOnly: pick(shippingFiltersSchema.shape.codOnly, params.codOnly),
    page: pick(pageSchema, params.page) ?? 1,
    pageSize: pick(pageSizeSchema, params.pageSize) ?? PAGE_SIZE,
  };
}
