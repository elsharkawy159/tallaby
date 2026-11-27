"use client";

import { useState } from "react";
import type { ManualPaymentMethod, PaymentRecipient } from "@/lib/manual-payment-methods";
import { TransferPaymentCard } from "./transfer-payment-card.client";

interface ManualPaymentInstructionsProps {
  orderId: string;
  orderNumber: string | null;
  method: ManualPaymentMethod;
  amount: string;
  currency: string;
  /** Where the money goes: the store's own details, or Tallaby's account. */
  recipient: PaymentRecipient | null;
}

/**
 * A manual-transfer order (InstaPay or a wallet): the chosen way to pay as one
 * card, already open. With an InstaPay link the card is the link, and the
 * receipt form shows once the customer taps it.
 */
export function ManualPaymentInstructions({
  orderId,
  orderNumber,
  method,
  amount,
  currency,
  recipient,
}: ManualPaymentInstructionsProps) {
  const [open, setOpen] = useState(true);
  if (!recipient) return null;
  return (
    <TransferPaymentCard
      orderId={orderId}
      orderNumber={orderNumber}
      method={method}
      amount={Number(amount)}
      currency={currency}
      recipient={recipient}
      open={open}
      onOpenChange={setOpen}
    />
  );
}
