/**
 * Tallaby Pay callback rules that need no database (ROADMAP.md F-100c,
 * design §6.2). Pure: safe anywhere.
 */
import {
  readOrderDepositGateway,
  readOrderGateway,
  readOrderTallabyPay,
  type TallabyPayOrderSnapshot,
} from "../payments/store-gateways.lib";

/** The order fields the callback decides on. */
export type TallabyPaySettleOrder = {
  storeId: string | null;
  currency: string | null;
  metadata: unknown;
};

export type TallabyPaySettleTarget = {
  purpose: "order" | "deposit";
  /** The Tallaby Pay integration row named by the order's snapshot (it need not still be connected). */
  integrationId: string;
  /** Fee and hold snapshotted at placement; never the current setting. */
  snapshot: TallabyPayOrderSnapshot;
};

/**
 * - `not_store_order`, `not_tallaby_pay`, `not_egp`: the callback is not ours to settle (ack and ignore).
 * - `no_snapshot`: a Tallaby Pay order without its fee snapshot, a data bug that must not be credited at a guessed rate.
 */
export type TallabyPaySettleSkip = "not_store_order" | "not_tallaby_pay" | "not_egp" | "no_snapshot";

/**
 * What a callback for this order settles. `isDeposit` is true for a COD order
 * with a deposit (F-21): the payment then pays the deposit and the snapshot is
 * `deposit.gateway`, else `paymentGateway`. Only a storefront EGP order whose
 * snapshot names Tallaby Pay qualifies.
 */
export function readTallabyPaySettleTarget(
  order: TallabyPaySettleOrder,
  isDeposit: boolean,
): { target: TallabyPaySettleTarget } | { skip: TallabyPaySettleSkip } {
  if (!order.storeId) return { skip: "not_store_order" };
  const gateway = isDeposit ? readOrderDepositGateway(order.metadata) : readOrderGateway(order.metadata);
  if (gateway?.provider !== "tallaby_pay") return { skip: "not_tallaby_pay" };
  // v1 is EGP stores only (design §2.4); checkout never sends another currency.
  if ((order.currency || "EGP") !== "EGP") return { skip: "not_egp" };
  const snapshot = readOrderTallabyPay(order.metadata);
  if (!snapshot) return { skip: "no_snapshot" };
  return { target: { purpose: isDeposit ? "deposit" : "order", integrationId: gateway.integrationId, snapshot } };
}

/** `tallaby_pay_sales.easykash_ref` is 1–200 characters (0175 CHECK). */
export function isValidEasykashRef(ref: string): boolean {
  return ref.length > 0 && ref.length <= 200;
}

/**
 * `payments.transaction_id` of a Tallaby Pay payment and the advisory lock key
 * (design §6.2). EasyKash refs are unique within Tallaby's one account, so no
 * store namespace is needed (unlike a seller gateway's `store:<integration>:`).
 */
export function tallabyPayTransactionId(easykashRef: string): string {
  return `tallaby_pay:${easykashRef}`;
}
