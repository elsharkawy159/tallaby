import { z } from "zod";
import { EGYPT_MOBILE_REGEX } from "../fulfillment/validate";
import { normalizeBlockedPhone } from "../stores/blocked-phones.lib";

/**
 * Manual orders: a seller enters an order taken by phone or chat (ROADMAP.md
 * F-05). Pure rules and the input shape; the design note is
 * docs/superpowers/specs/2026-10-30-manual-orders-design.md.
 */

/** How the seller was already paid. The seller holds this money, never Tallaby. */
export const MANUAL_PAID_VIA = ["instapay", "vodafone_cash", "e_cash", "bank_transfer", "cash"] as const;
export type ManualPaidVia = (typeof MANUAL_PAID_VIA)[number];

/** An order link the customer never confirmed is cancelled after this long. */
export const MANUAL_LINK_EXPIRY_HOURS = 48;

export const MANUAL_MAX_LINES = 30;

export const manualOrderInputSchema = z
  .object({
    requestId: z.string().uuid(),
    lines: z
      .array(
        z.object({
          productId: z.string().uuid(),
          variantId: z.string().uuid().optional(),
          quantity: z.number().int().min(1).max(99),
        }),
      )
      .min(1)
      .max(MANUAL_MAX_LINES),
    customer: z.object({
      name: z.string().trim().min(2).max(120),
      phone: z
        .string()
        .transform((value) => normalizeBlockedPhone(value))
        .pipe(z.string().regex(EGYPT_MOBILE_REGEX)),
    }),
    address: z.object({
      state: z.string().trim().min(1).max(60),
      city: z.string().trim().min(1).max(120),
      addressLine1: z.string().trim().min(3).max(300),
    }),
    /** What the seller takes off, in EGP. Comes out of the seller's own lines. */
    discountEgp: z.number().min(0).max(1_000_000).default(0),
    payment: z.enum(["cod", "paid"]),
    paidVia: z.enum(MANUAL_PAID_VIA).optional(),
    notes: z.string().trim().max(1000).optional(),
    /** Create the order and let the customer confirm it from a link. */
    sendLink: z.boolean().default(false),
  })
  .refine((input) => input.payment !== "paid" || Boolean(input.paidVia), { path: ["paidVia"] })
  .refine((input) => !(input.sendLink && input.payment === "paid"), { path: ["sendLink"] });

export type ManualOrderInput = z.infer<typeof manualOrderInputSchema>;

/** The seller's discount can't pass the goods total, and never touches shipping. */
export function capManualDiscountPiastres(discountEgp: number, goodsPiastres: number): number {
  if (!Number.isFinite(discountEgp) || discountEgp <= 0) return 0;
  return Math.min(Math.round(discountEgp * 100), Math.max(0, goodsPiastres));
}

export type ManualOrderTotals = {
  goodsPiastres: number;
  discountPiastres: number;
  shippingPiastres: number;
  totalPiastres: number;
};

export function manualOrderTotals(input: {
  goodsPiastres: number;
  discountEgp: number;
  shippingPiastres: number;
}): ManualOrderTotals {
  const discountPiastres = capManualDiscountPiastres(input.discountEgp, input.goodsPiastres);
  return {
    goodsPiastres: input.goodsPiastres,
    discountPiastres,
    shippingPiastres: input.shippingPiastres,
    totalPiastres: input.goodsPiastres - discountPiastres + input.shippingPiastres,
  };
}

/** `orders.metadata.manualOrder`: who entered the order, and what it waits for. */
export type ManualOrderMeta = {
  createdBy: string;
  createdAt: string;
  paidVia?: ManualPaidVia;
  awaitingCustomer?: boolean;
  confirmedAt?: string;
};

export function readManualOrderMeta(metadata: unknown): ManualOrderMeta | null {
  const value = (metadata as { manualOrder?: unknown } | null | undefined)?.manualOrder;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ManualOrderMeta) : null;
}

/** A pending order whose link the customer can still confirm. */
export function isAwaitingCustomer(order: { status: string | null; metadata: unknown }): boolean {
  return order.status === "pending" && readManualOrderMeta(order.metadata)?.awaitingCustomer === true;
}

export type ManualOrderErrorKey =
  | "productUnavailable"
  | "insufficientStock"
  | "customerBlocked"
  | "notCovered"
  | "outsideEgypt"
  | "noCod"
  | "alreadySubmitted"
  | "generic";

/** Turns an order error from `placeOrderFromCart` into a key the form translates. */
export function manualOrderErrorKey(error: string): ManualOrderErrorKey {
  if (error === "storeCustomerBlocked") return "customerBlocked";
  if (error === "storeShippingNotCovered") return "notCovered";
  if (error === "storeShippingOutsideEgypt") return "outsideEgypt";
  if (error === "storeShippingNoCod" || error.startsWith("Cash on delivery")) return "noCod";
  if (error.startsWith("Insufficient stock")) return "insufficientStock";
  if (error.startsWith("Product is no longer")) return "productUnavailable";
  return "generic";
}
