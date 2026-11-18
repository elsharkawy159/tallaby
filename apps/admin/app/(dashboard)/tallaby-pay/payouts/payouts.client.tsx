"use client";

import { ActionButton } from "../tallaby-pay.client";
import {
  markTallabyPayPayoutPaidAction,
  rejectTallabyPayPayoutAction,
  reverseTallabyPayPayoutAction,
} from "../tallaby-pay.server";

/** Mark paid (reference required) and Reject (reason required) for one open request. */
export function PayoutQueueActions({
  payoutId,
  amount,
  canPay,
  blockReason,
}: {
  payoutId: string;
  amount: string;
  canPay: boolean;
  blockReason: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton
        label="Mark paid"
        variant="default"
        disabled={!canPay}
        title={`Mark ${amount} as paid?`}
        description={
          <p>
            Only after the transfer went out from Tallaby&apos;s account. This takes {amount} out of the store&apos;s available
            earnings, emails the seller and is logged.
          </p>
        }
        fields={[{ name: "reference", label: "Transfer reference", min: 2, placeholder: "The bank or wallet transaction number" }]}
        confirm="Mark paid"
        run={(v) => markTallabyPayPayoutPaidAction({ payoutId, reference: v.reference ?? "" })}
      />
      <ActionButton
        label="Reject"
        title="Reject this withdrawal?"
        description={<p>The amount goes back to the store&apos;s available earnings. The seller sees your reason by email and in Earnings.</p>}
        fields={[{ name: "reason", label: "Reason", multiline: true, placeholder: "For example: the holder name doesn't match the verified identity" }]}
        confirm="Reject"
        destructive
        run={(v) => rejectTallabyPayPayoutAction({ payoutId, reason: v.reason ?? "" })}
      />
      {blockReason && <p className="basis-full text-xs text-destructive">{blockReason}</p>}
    </div>
  );
}

/** A paid transfer came back: the amount returns to available earnings. */
export function ReversePayoutAction({ payoutId, amount }: { payoutId: string; amount: string }) {
  return (
    <ActionButton
      label="Reverse"
      variant="ghost"
      title={`Reverse this ${amount} withdrawal?`}
      description={<p>Use this only when the transfer bounced back to Tallaby. {amount} returns to the store&apos;s available earnings.</p>}
      fields={[{ name: "reason", label: "Reason", multiline: true, placeholder: "For example: the bank returned the transfer" }]}
      confirm="Reverse"
      destructive
      run={(v) => reverseTallabyPayPayoutAction({ payoutId, reason: v.reason ?? "" })}
    />
  );
}
