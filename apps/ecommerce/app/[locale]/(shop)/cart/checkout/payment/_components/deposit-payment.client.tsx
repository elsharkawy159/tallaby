"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CreditCard, LoaderCircle } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { createDepositCheckoutUrl } from "@/actions/payment";
import type { ManualPaymentMethod, PaymentRecipient } from "@/lib/manual-payment-methods";
import {
  PaymentOptionHeaderBody,
  TransferPaymentCard,
  paymentOptionClass,
  paymentOptionHeaderClass,
  usePriceTag,
} from "./transfer-payment-card.client";

export type DepositTransferOption = { method: ManualPaymentMethod; recipient: PaymentRecipient };

/**
 * After a COD order with a deposit (عربون, ROADMAP.md F-21): one line with
 * what to pay now and what is left for delivery, then one card per way to pay
 * the store: its own card gateway and/or its wallets and InstaPay (with a
 * transfer receipt). The money goes to the seller; the order ships once paid.
 */
export function DepositPayment({
  orderId,
  orderNumber,
  currency,
  amount,
  remainder,
  card,
  transfers,
}: {
  orderId: string;
  orderNumber: string | null;
  currency: string;
  /** Deposit, in currency units. */
  amount: number;
  /** Cash left for delivery. */
  remainder: number;
  /** The store's card gateway takes the deposit. */
  card: boolean;
  transfers: DepositTransferOption[];
}) {
  const td = useTranslations("checkout.deposit");
  const nowTag = usePriceTag(amount, currency);
  const restTag = usePriceTag(remainder, currency);
  const optionCount = (card ? 1 : 0) + transfers.length;
  // A single transfer opens by itself; with several, the customer picks one.
  const [openMethod, setOpenMethod] = useState<ManualPaymentMethod | null>(
    optionCount === 1 && transfers[0] ? transfers[0].method : null,
  );
  const [isPending, startTransition] = useTransition();

  const payByCard = () =>
    startTransition(async () => {
      const result = await createDepositCheckoutUrl(orderId);
      if (result.success) {
        window.location.assign(result.data.checkoutUrl);
      } else {
        toast.error(td("cardFailed"));
      }
    });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-gray-900">{td("pageTitle")}</h1>
        <p className="mt-1.5 text-sm md:text-base leading-relaxed text-gray-700">
          {td.rich("splitLine", {
            now: () => <strong className="font-bold text-primary">{nowTag()}</strong>,
            rest: () => <strong className="font-semibold text-gray-900">{restTag()}</strong>,
          })}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">{td("deadline")}</p>
      </div>

      <div className="space-y-3">
        {card && (
          <div className={paymentOptionClass(false)}>
            <button type="button" disabled={isPending} onClick={payByCard} className={cn(paymentOptionHeaderClass, "cursor-pointer")}>
              <PaymentOptionHeaderBody
                icon={<CreditCard className="size-6 text-primary" aria-hidden />}
                name={td.rich("payAmountByCard", { amount: nowTag })}
                action={<span className="text-xs md:text-sm font-normal text-gray-500">{td("cardHint")}</span>}
              />
              {isPending && <LoaderCircle className="size-5 shrink-0 animate-spin text-primary" aria-hidden />}
            </button>
          </div>
        )}
        {transfers.map((transfer) => (
          <TransferPaymentCard
            key={transfer.method}
            orderId={orderId}
            orderNumber={orderNumber}
            method={transfer.method}
            amount={amount}
            currency={currency}
            recipient={transfer.recipient}
            deposit
            open={openMethod === transfer.method}
            onOpenChange={(next) =>
              setOpenMethod((current) => (next ? transfer.method : current === transfer.method ? null : current))
            }
          />
        ))}
      </div>
    </div>
  );
}
