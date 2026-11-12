"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { CreditCard, LoaderCircle, Lock, Truck } from "lucide-react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { currencyDefaultLabel, formatPrice } from "@workspace/lib";
import { createDepositCheckoutUrl } from "@/actions/payment";
import { getManualPaymentMethodConfig, type ManualPaymentMethod, type PaymentRecipient } from "@/lib/manual-payment-methods";
import { ManualPaymentInstructions } from "./manual-payment-instructions";

export type DepositTransferOption = { method: ManualPaymentMethod; recipient: PaymentRecipient };

/**
 * After a COD order with a deposit (عربون, ROADMAP.md F-21): what to pay now
 * and what is left for delivery, then the ways to pay the store: its own card
 * gateway and/or its wallets and InstaPay (with a transfer screenshot). The
 * money goes to the seller; the order ships once it is paid.
 */
export function DepositPayment({
  orderId,
  orderNumber,
  currency,
  amount,
  remainder,
  percent,
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
  percent: number | null;
  /** The store's card gateway takes the deposit. */
  card: boolean;
  transfers: DepositTransferOption[];
}) {
  const t = useTranslations("checkout");
  const td = useTranslations("checkout.deposit");
  const locale = useLocale();
  const label = currencyDefaultLabel(currency);
  const options = [...(card ? ["card"] : []), ...transfers.map((x) => x.method)];
  const [choice, setChoice] = useState<string>(options[0] ?? "");
  const [isPending, startTransition] = useTransition();
  const transfer = transfers.find((x) => x.method === choice) ?? null;
  const price = (value: number, size: "sm" | "lg" = "sm") => ({ __html: formatPrice(value, locale, size, label) });

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
    <div className="space-y-4 md:space-y-6">
      <Card className="rounded-xl md:rounded-2xl border border-primary/25 overflow-hidden py-0 gap-0">
        <CardContent className="p-4 md:p-6 space-y-4">
          <div>
            <h2 className="text-base md:text-xl font-bold text-gray-900">{td("pageTitle")}</h2>
            <p className="mt-1 text-xs md:text-sm leading-relaxed text-gray-600">{td("pageIntro")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5">
              <p className="text-xs font-semibold text-gray-700">{percent ? td("payNow", { percent }) : td("payNowPlain")}</p>
              <p className="text-xl md:text-2xl font-bold text-primary" dangerouslySetInnerHTML={price(amount, "lg")} />
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <Truck className="size-3.5" aria-hidden />
                {td("onDelivery")}
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900" dangerouslySetInnerHTML={price(remainder, "lg")} />
            </div>
          </div>
          <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs md:text-sm leading-relaxed text-amber-900">{td("deadline")}</p>

          {options.length > 1 && (
            <div role="radiogroup" aria-label={td("chooseMethod")} className="flex flex-wrap gap-2">
              {options.map((option) => {
                const config = option === "card" ? null : getManualPaymentMethodConfig(option as ManualPaymentMethod);
                const name = option === "card" ? t("payByCard") : config ? t(config.titleKey as never) : option;
                const selected = option === choice;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setChoice(option)}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-xl border-2 bg-white px-3 py-2 text-xs md:text-sm font-semibold text-gray-800 transition-colors",
                      selected ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    {option === "card" ? (
                      <CreditCard className="size-5 text-primary" aria-hidden />
                    ) : config ? (
                      <Image src={config.logo} alt="" width={22} height={22} className="size-5.5 object-contain" />
                    ) : null}
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {choice === "card" && (
        <Card className="rounded-xl md:rounded-2xl border border-gray-200 py-0 gap-0">
          <CardContent className="space-y-3 p-4 md:p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Lock className="size-4 text-primary" aria-hidden />
              {td("cardTitle")}
            </p>
            <p className="text-xs md:text-sm leading-relaxed text-gray-600">{td("cardHint")}</p>
            <Button type="button" size="lg" className="w-full gap-2" disabled={isPending} onClick={payByCard}>
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
              <span>{td("payByCard")}</span>
              <span dangerouslySetInnerHTML={price(amount)} />
            </Button>
          </CardContent>
        </Card>
      )}

      {transfer && (
        <ManualPaymentInstructions
          key={transfer.method}
          orderId={orderId}
          orderNumber={orderNumber}
          method={transfer.method}
          amount={amount.toFixed(2)}
          currency={currency}
          recipient={transfer.recipient}
          deposit
        />
      )}
    </div>
  );
}
