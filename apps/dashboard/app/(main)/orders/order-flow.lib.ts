import { TALLABY_SERVICES_ENABLED } from "@workspace/lib/fulfillment";
import type { ShippingStatus } from "@/lib/shipping/shipping-status";

/**
 * Whether the seller ships this line. While Tallaby runs no fulfillment
 * services (TALLABY_SERVICES_ENABLED off, owner 2026-10-21) every line is the
 * seller's: a stale `platform_fulfilled` flag on a product (many live
 * products still carry one) must not lock the seller out of their orders.
 */
export function isSellerHandledLine(
  fulfillmentType: string | null | undefined,
  servicesEnabled: boolean = TALLABY_SERVICES_ENABLED,
): boolean {
  if (!servicesEnabled) return true;
  return fulfillmentType === "seller_fulfilled" || fulfillmentType == null;
}

/**
 * How a seller works an order from /orders, now that the seller ships their
 * own orders (no rider needed). One model for the list, the order panel and
 * the server action, so the buttons a seller sees are exactly the moves the
 * server accepts.
 *
 * Shipment moves go through applySellerShipmentStatus (same graph as the
 * delivery workspace and apps/shipping); "confirm" and "cancel" happen before
 * anything leaves, so they write the order directly.
 */

export type SellerOrderStage =
  | "awaiting_payment"
  | "new"
  | "to_ship"
  | "out_for_delivery"
  | "failed"
  | "delivered"
  | "returned"
  | "cancelled"
  | "refund";

export type SellerOrderAction =
  | "confirm"
  | "ship"
  | "deliver"
  | "fail"
  | "return"
  | "cancel";

export const SELLER_ORDER_ACTIONS = [
  "confirm",
  "ship",
  "deliver",
  "fail",
  "return",
  "cancel",
] as const satisfies readonly SellerOrderAction[];

/** Why an order is view-only for this seller. */
export type ReadOnlyReason = "multi_seller" | "tallaby" | "digital";

export interface SellerOrderFlowInput {
  orderStatus: string | null;
  paymentStatus: string | null;
  isDigitalOnly: boolean | null;
  /** Every line of the order belongs to this seller. */
  allLinesOwned: boolean;
  /** At least one of this seller's lines is seller-fulfilled. */
  sellerFulfilled: boolean;
  shipment: {
    status: string;
    ownedBySeller: boolean;
    /** A carrier delivery (Bosta) exists: the carrier moves the shipment, not the seller. */
    carrierManaged?: boolean;
  } | null;
  /** The customer already paid some of it from their Tallaby wallet. */
  walletPaid: boolean;
}

export interface SellerOrderFlow {
  stage: SellerOrderStage;
  /** The next step, shown as the main button. */
  primary: SellerOrderAction | null;
  /** Every allowed action, primary first. */
  actions: SellerOrderAction[];
  readOnly: ReadOnlyReason | null;
  /** Paid in advance, so it can't be cancelled here (refunds go through Tallaby). */
  prepaid: boolean;
  /** The shipment is with a carrier (Bosta), whose updates move it; no manual moves. */
  carrierManaged: boolean;
}

export function isPaymentSettled(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === "paid" || paymentStatus === "collected";
}

const SHIPMENT_STAGE: Partial<Record<ShippingStatus, SellerOrderStage>> = {
  pending: "to_ship",
  assigned: "to_ship",
  out_for_delivery: "out_for_delivery",
  failed: "failed",
  delivered: "delivered",
  returned: "returned",
  cancelled: "cancelled",
};

export function resolveSellerOrderStage(input: SellerOrderFlowInput): SellerOrderStage {
  const status = input.orderStatus ?? "pending";
  if (status === "cancelled") return "cancelled";
  if (status === "refund_requested" || status === "refunded") return "refund";

  const fromShipment = input.shipment
    ? SHIPMENT_STAGE[input.shipment.status as ShippingStatus]
    : undefined;
  if (fromShipment) return fromShipment;

  switch (status) {
    case "delivered":
      return "delivered";
    case "returned":
      return "returned";
    case "out_for_delivery":
      return "out_for_delivery";
    case "payment_processing":
      return "awaiting_payment";
    case "pending":
      // A prepaid order needs no confirmation call (same rule as apps/shipping).
      return isPaymentSettled(input.paymentStatus) ? "to_ship" : "new";
    default:
      // confirmed, shipping_soon, shipped
      return "to_ship";
  }
}

function readOnlyReason(input: SellerOrderFlowInput): ReadOnlyReason | null {
  if (input.isDigitalOnly) return "digital";
  if (!input.allLinesOwned) return "multi_seller";
  if (!input.sellerFulfilled) return "tallaby";
  if (input.shipment && !input.shipment.ownedBySeller) return "tallaby";
  return null;
}

export function resolveSellerOrderFlow(input: SellerOrderFlowInput): SellerOrderFlow {
  const stage = resolveSellerOrderStage(input);
  const prepaid = isPaymentSettled(input.paymentStatus) || input.walletPaid;
  const readOnly = readOnlyReason(input);

  const carrierManaged = Boolean(input.shipment?.carrierManaged);

  if (readOnly) return { stage, primary: null, actions: [], readOnly, prepaid, carrierManaged };
  // Bosta updates the status itself; cancelling goes through Bosta (order panel).
  if (carrierManaged) return { stage, primary: null, actions: [], readOnly: null, prepaid, carrierManaged };

  const cancel: SellerOrderAction[] = prepaid ? [] : ["cancel"];
  let actions: SellerOrderAction[] = [];
  switch (stage) {
    case "new":
      actions = ["confirm", ...cancel];
      break;
    case "to_ship":
      actions = ["ship", ...cancel];
      break;
    case "out_for_delivery":
      actions = ["deliver", "fail", "return"];
      break;
    case "failed":
      actions = ["ship", "return"];
      break;
  }

  return { stage, primary: actions[0] ?? null, actions, readOnly: null, prepaid, carrierManaged };
}

/** Shipment status each shipment move lands on. */
export const ACTION_SHIPMENT_STATUS: Partial<Record<SellerOrderAction, ShippingStatus>> = {
  ship: "out_for_delivery",
  deliver: "delivered",
  fail: "failed",
  return: "returned",
};

/** The ordered steps shown on the order's progress track. */
export const PROGRESS_STEPS = ["new", "to_ship", "out_for_delivery", "delivered"] as const;

/** Index of the stage on the progress track; -1 when the order left the happy path. */
export function progressIndex(stage: SellerOrderStage): number {
  if (stage === "awaiting_payment") return 0;
  if (stage === "failed") return 2;
  return (PROGRESS_STEPS as readonly string[]).indexOf(stage);
}
