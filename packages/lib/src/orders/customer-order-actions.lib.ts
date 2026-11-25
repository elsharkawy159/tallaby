/**
 * When a shopper may confirm or cancel an order from outside the store (the
 * WhatsApp buttons, ROADMAP.md F-109, docs/whatsapp.md §4 Buttons). Pure.
 *
 * Confirm follows the dashboard's own "confirm" rule (order-flow.lib.ts in
 * apps/dashboard): a `pending` order that isn't waiting for its deposit, is not
 * digital-only or a test, has only the store's own lines and no carrier
 * shipment yet.
 *
 * Cancel follows the store's own customer cancel (apps/ecommerce
 * `cancelOrder`), narrowed to orders where no money was collected and no
 * parcel exists, so a button never has to refund anything or recall a
 * shipment: `pending` or `confirmed`, not paid or collected, no wallet
 * payment, no paid deposit, no open shipment. Anything else is refused and
 * the shopper is asked to contact the store.
 */

/** The store's customer cancel statuses, without `payment_processing` (never messaged). */
export const BUTTON_CANCELLABLE_STATUSES = ["pending", "confirmed"] as const;

export interface CustomerConfirmInput {
  status: string | null;
  isTest: boolean;
  isDigitalOnly: boolean | null;
  depositStatus: string | null;
  /** Lines of another seller than the store's. */
  foreignLines: number;
  /** A carrier (e.g. Bosta) already holds the shipment. */
  carrierManaged: boolean;
}

export function customerCanConfirm(input: CustomerConfirmInput): boolean {
  if (input.status !== "pending") return false;
  if (input.isTest || input.isDigitalOnly) return false;
  if (input.depositStatus === "awaiting" || input.depositStatus === "reported") return false;
  if (input.foreignLines > 0 || input.carrierManaged) return false;
  return true;
}

export interface CustomerCancelInput {
  status: string | null;
  isTest: boolean;
  paymentStatus: string | null;
  depositStatus: string | null;
  /** A completed customer-wallet payment exists for the order. */
  walletPaid: boolean;
  /** A shipment that isn't cancelled exists. */
  hasOpenShipment: boolean;
}

export function customerCanCancel(input: CustomerCancelInput): boolean {
  if (!(BUTTON_CANCELLABLE_STATUSES as readonly string[]).includes(input.status ?? "")) return false;
  if (input.isTest) return false;
  if (input.paymentStatus === "paid" || input.paymentStatus === "collected") return false;
  if (input.depositStatus === "paid") return false;
  if (input.walletPaid || input.hasOpenShipment) return false;
  return true;
}

export type CustomerOrderActionResult = "confirmed" | "cancelled" | "already" | "refused" | "not_found";
