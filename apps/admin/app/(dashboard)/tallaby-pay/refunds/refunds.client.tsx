"use client";

import { ActionButton } from "../tallaby-pay.client";
import {
  declineTallabyPayRefundAction,
  markTallabyPayDuplicateRefundedAction,
  refundTallabyPaySaleAction,
} from "../tallaby-pay.server";

const FIELDS = [
  { name: "reason", label: "Reason", multiline: true, placeholder: "For example: the seller cancelled before shipping" },
  { name: "reference", label: "EasyKash refund reference", optional: true, min: 0 },
];

/** Record a refund made in Tallaby's EasyKash account for a sale that was never delivered (F-100d action). */
export function RefundSaleAction({ saleId, amount, disabled }: { saleId: string; amount: string; disabled?: boolean }) {
  return (
    <ActionButton
      label="Mark refunded"
      variant="default"
      disabled={disabled}
      title={`Record a ${amount} refund?`}
      description={
        <p>
          First refund {amount} to the customer in Tallaby&apos;s EasyKash account. This takes the sale&apos;s net out of the
          store&apos;s pending earnings, its fee out of the Fees box, and marks the order&apos;s payment refunded.
        </p>
      }
      fields={FIELDS}
      confirm="Mark refunded"
      run={(v) => refundTallabyPaySaleAction({ saleId, reason: v.reason ?? "", reference: v.reference || undefined })}
    />
  );
}

/** A second payment for an order already paid: the money never reached the seller. */
export function RefundDuplicateAction({ paymentId, amount }: { paymentId: string; amount: string }) {
  return (
    <ActionButton
      label="Mark refunded"
      variant="default"
      title={`Record a ${amount} refund?`}
      description={
        <p>
          First refund this second payment ({amount}) to the customer in Tallaby&apos;s EasyKash account. No store earnings
          change: this money was never credited.
        </p>
      }
      fields={FIELDS}
      confirm="Mark refunded"
      run={(v) => markTallabyPayDuplicateRefundedAction({ paymentId, reason: v.reason ?? "", reference: v.reference || undefined })}
    />
  );
}

/** Turn down a seller's refund request: nothing is refunded and the sale releases on delivery. */
export function DeclineRefundAction({ saleId }: { saleId: string }) {
  return (
    <ActionButton
      label="Decline"
      title="Decline this refund request?"
      description={
        <p>
          Nothing is refunded. The money stays in the store&apos;s pending earnings and becomes available when the order is
          delivered, right away if it already was. The seller is notified.
        </p>
      }
      fields={[{ name: "reason", label: "Reason", multiline: true, placeholder: "For example: the customer received the order" }]}
      confirm="Decline"
      destructive
      run={(v) => declineTallabyPayRefundAction({ saleId, reason: v.reason ?? "" })}
    />
  );
}
