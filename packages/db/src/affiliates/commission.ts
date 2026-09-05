import { and, eq } from "drizzle-orm";

import type { db as dbType } from "../drizzle/database";
import { affiliateCommissions, affiliates, notifications } from "../drizzle/schema";
import {
  getOrCreateUserWallet,
  getUserWalletSummary,
  postWalletTransaction,
  WALLET_REFERENCE_TYPES,
} from "../wallet/user-wallet";
import { AFFILIATE_COMMISSION_RATE } from "./constants";

type Tx = Parameters<Parameters<typeof dbType.transaction>[0]>[0];

export interface AffiliateAttribution {
  affiliateId: string;
  /** The affiliate's own userId — denormalized onto affiliate_commissions for RLS, same reasoning as user_wallet_transactions.userId. */
  affiliateUserId: string;
  couponId: string;
}

/**
 * Resolves whether `couponId` is an affiliate's code, for attribution at
 * order-creation time. Returns null (no attribution, but the discount still
 * applies as an ordinary coupon) when:
 *   - the coupon isn't an affiliate code at all, or
 *   - the affiliate account is inactive, or
 *   - the buyer IS the affiliate (self-referral earns no commission — the
 *     business rules describe "another Tallaby customer" using the code).
 */
export async function resolveAffiliateForCoupon(
  db: Tx | typeof dbType,
  couponId: string,
  buyerUserId: string
): Promise<AffiliateAttribution | null> {
  const affiliate = await db.query.affiliates.findFirst({
    where: and(eq(affiliates.couponId, couponId), eq(affiliates.status, "active")),
    columns: { id: true, userId: true, couponId: true },
  });

  if (!affiliate) return null;
  if (affiliate.userId === buyerUserId) return null;

  return {
    affiliateId: affiliate.id,
    affiliateUserId: affiliate.userId,
    couponId: affiliate.couponId,
  };
}

export interface CreatePendingCommissionInput {
  affiliate: AffiliateAttribution;
  orderId: string;
  /**
   * Eligible merchandise subtotal excluding shipping, BEFORE the customer's
   * discount is subtracted.
   *
   * Decision (documented per the task's request to record it): this project's
   * existing financial model computes seller commission
   * (order_items.commission_amount) as 10% of the pre-discount item subtotal
   * — the discount is applied afterward, on top of, not into, that base. The
   * affiliate commission follows the same base for consistency: it is 10% of
   * `subtotal` in packages/lib/src/orders/place-order.ts, the same value that
   * seeds both the seller commission and the customer's discount amount, not
   * `subtotal - discountAmount`. Shipping is never part of this figure.
   */
  orderEligibleAmount: string;
  shippingAmount: string;
}

/**
 * Records the (not-yet-earned) commission a delivered order would produce.
 * Called once, inside the same transaction that creates the order — never
 * retried, since a new order row is only ever inserted once, so no
 * idempotency guard is needed here (earnAffiliateCommission is where the
 * real "must never double-credit" guarantee lives).
 */
export async function createPendingAffiliateCommission(
  tx: Tx,
  input: CreatePendingCommissionInput
): Promise<void> {
  const commissionAmount = (
    Number(input.orderEligibleAmount) * AFFILIATE_COMMISSION_RATE
  ).toFixed(2);

  if (Number(commissionAmount) <= 0) return;

  await tx.insert(affiliateCommissions).values({
    affiliateId: input.affiliate.affiliateId,
    userId: input.affiliate.affiliateUserId,
    orderId: input.orderId,
    couponId: input.affiliate.couponId,
    type: "commission",
    status: "pending",
    orderEligibleAmount: input.orderEligibleAmount,
    shippingAmount: input.shippingAmount,
    commissionRate: AFFILIATE_COMMISSION_RATE,
    commissionAmount,
  });
}

/**
 * Order reached Delivered: turns a pending commission into earned money in
 * the affiliate's wallet.
 *
 * Idempotent by construction, two layers deep:
 *   1. The UPDATE below only ever claims a row that is still 'pending'. A
 *      duplicate call (retried webhook, admin re-save, a second delivery
 *      event) finds zero matching rows and returns — exactly the guard
 *      creditSellerOnDelivery uses for order_items.status.
 *   2. Even if that guard were somehow bypassed, postWalletTransaction's own
 *      (type, reference_type, reference_id) unique index — keyed on this
 *      commission row's id — would reject a second credit for the same row.
 *
 * A no-op (not an error) when the order has no affiliate attribution at all.
 */
export async function earnAffiliateCommission(
  tx: Tx,
  orderId: string
): Promise<void> {
  const now = new Date().toISOString();

  const [claimed] = await tx
    .update(affiliateCommissions)
    .set({ status: "earned", updatedAt: now })
    .where(
      and(
        eq(affiliateCommissions.orderId, orderId),
        eq(affiliateCommissions.type, "commission"),
        eq(affiliateCommissions.status, "pending")
      )
    )
    .returning({
      id: affiliateCommissions.id,
      userId: affiliateCommissions.userId,
      commissionAmount: affiliateCommissions.commissionAmount,
    });

  if (!claimed) return;

  const wallet = await getOrCreateUserWallet(tx, claimed.userId);
  const walletTx = await postWalletTransaction(tx, {
    walletId: wallet.id,
    userId: claimed.userId,
    type: "commission",
    amount: claimed.commissionAmount,
    direction: "credit",
    referenceType: WALLET_REFERENCE_TYPES.affiliateCommission,
    referenceId: claimed.id,
    description: "Affiliate commission — order delivered",
    metadata: { orderId, affiliateCommissionId: claimed.id },
  });

  await tx
    .update(affiliateCommissions)
    .set({ walletTransactionId: walletTx.id, updatedAt: now })
    .where(eq(affiliateCommissions.id, claimed.id));

  // Reuses the existing notifications table/type — no new notification
  // system. 'order_update' is the closest existing type; there is no
  // dedicated 'affiliate' notification_type value.
  await tx.insert(notifications).values({
    userId: claimed.userId,
    type: "order_update",
    title: "Commission earned",
    message: `Your affiliate commission of ${claimed.commissionAmount} EGP was credited to your wallet.`,
    data: { affiliateCommissionId: claimed.id, orderId, kind: "affiliate_commission_earned" },
  });
}

/**
 * Order was cancelled (or otherwise failed) before delivery: the pending
 * commission never becomes real money. No-op if there is nothing pending
 * (no attribution, or the order already reached Delivered — a cancellation
 * arriving after delivery must never touch an already-earned commission; use
 * reverseAffiliateCommission for that case instead).
 */
export async function cancelPendingAffiliateCommission(
  tx: Tx,
  orderId: string
): Promise<void> {
  await tx
    .update(affiliateCommissions)
    .set({ status: "cancelled", updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(affiliateCommissions.orderId, orderId),
        eq(affiliateCommissions.type, "commission"),
        eq(affiliateCommissions.status, "pending")
      )
    );
}

/**
 * Order was returned/refunded after an earned commission was already
 * credited: posts a reversal — a NEW ledger-style row (type='reversal'),
 * never a mutation of the original 'earned' row — and debits the affiliate's
 * wallet to match.
 *
 * Idempotent: the UPDATE that flips the original row 'earned' -> 'reversed'
 * only ever claims a row still in 'earned'. A duplicate call finds nothing
 * and returns. The reversal row's parent_commission_id also carries a partial
 * unique index (one reversal per original), a second independent guard.
 *
 * `refundedAmount`, when given, scales the reversal proportionally to the
 * refunded share of the order's eligible amount (partial refund support);
 * omitted or covering the full eligible amount reverses the commission in
 * full.
 *
 * Never lets a reversal fail the caller's transaction over the affiliate's
 * current wallet balance: if the affiliate has less available than the
 * reversal amount (already paid out, or spent), this debits whatever is
 * available and records the shortfall in the ledger description rather than
 * throwing InsufficientWalletBalanceError — a return must always be able to
 * complete regardless of the affiliate's spending since. The commission
 * record itself always reflects the true reversed amount for audit purposes,
 * even when the wallet could only absorb part of it.
 */
export async function reverseAffiliateCommission(
  tx: Tx,
  orderId: string,
  options: { refundedAmount?: string } = {}
): Promise<void> {
  const now = new Date().toISOString();

  const original = await tx.query.affiliateCommissions.findFirst({
    where: and(
      eq(affiliateCommissions.orderId, orderId),
      eq(affiliateCommissions.type, "commission"),
      eq(affiliateCommissions.status, "earned")
    ),
  });

  if (!original) return;

  let reversalAmount = Number(original.commissionAmount);
  if (options.refundedAmount != null) {
    const eligible = Number(original.orderEligibleAmount);
    const fraction =
      eligible > 0 ? Math.min(1, Number(options.refundedAmount) / eligible) : 1;
    reversalAmount =
      Math.round(Number(original.commissionAmount) * fraction * 100) / 100;
  }
  if (reversalAmount <= 0) return;

  const [claimed] = await tx
    .update(affiliateCommissions)
    .set({ status: "reversed", updatedAt: now })
    .where(
      and(
        eq(affiliateCommissions.id, original.id),
        eq(affiliateCommissions.status, "earned")
      )
    )
    .returning({ id: affiliateCommissions.id });

  if (!claimed) return;

  const reversalAmountStr = reversalAmount.toFixed(2);

  const [reversalRow] = await tx
    .insert(affiliateCommissions)
    .values({
      affiliateId: original.affiliateId,
      userId: original.userId,
      orderId: original.orderId,
      couponId: original.couponId,
      type: "reversal",
      status: "reversed",
      orderEligibleAmount: original.orderEligibleAmount,
      shippingAmount: original.shippingAmount,
      commissionRate: original.commissionRate,
      commissionAmount: reversalAmountStr,
      parentCommissionId: original.id,
    })
    .returning({ id: affiliateCommissions.id });

  if (!reversalRow) throw new Error("Affiliate reversal insert returned no row");

  const wallet = await getOrCreateUserWallet(tx, original.userId);
  const summary = await getUserWalletSummary(tx, original.userId);
  const available = summary ? Math.max(0, Number(summary.availableBalance)) : 0;
  const debitAmount = Math.min(reversalAmount, available);

  if (debitAmount > 0) {
    const shortfall = reversalAmount - debitAmount;
    const walletTx = await postWalletTransaction(tx, {
      walletId: wallet.id,
      userId: original.userId,
      type: "commission_reversal",
      amount: debitAmount.toFixed(2),
      direction: "debit",
      referenceType: WALLET_REFERENCE_TYPES.affiliateCommission,
      referenceId: reversalRow.id,
      description:
        shortfall > 0
          ? "Affiliate commission reversal — order returned/refunded (partial: balance insufficient for full clawback)"
          : "Affiliate commission reversal — order returned/refunded",
      metadata: { orderId, parentCommissionId: original.id, shortfall: shortfall > 0 ? shortfall.toFixed(2) : undefined },
    });

    await tx
      .update(affiliateCommissions)
      .set({ walletTransactionId: walletTx.id, updatedAt: now })
      .where(eq(affiliateCommissions.id, reversalRow.id));
  } else {
    await tx
      .update(affiliateCommissions)
      .set({
        notes: "Wallet balance was insufficient at reversal time; no funds could be clawed back.",
        updatedAt: now,
      })
      .where(eq(affiliateCommissions.id, reversalRow.id));
  }

  await tx.insert(notifications).values({
    userId: original.userId,
    type: "order_update",
    title: "Commission reversed",
    message: `${reversalAmountStr} EGP was reversed from your affiliate commission because the order was returned or refunded.`,
    data: { affiliateCommissionId: reversalRow.id, parentCommissionId: original.id, orderId, kind: "affiliate_commission_reversed" },
  });
}
