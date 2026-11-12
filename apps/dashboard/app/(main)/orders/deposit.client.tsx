"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, HandCoins, LoaderCircle, X } from "lucide-react";
import { SellerButton, Tag } from "@/components/seller-ui";
import { Money } from "@/components/money";
import { formatDateTime, moneyDir } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { decideOrderDeposit } from "./deposit.server";
import type { SellerOrderRow } from "./orders.types";

const STATUS_TONE = { awaiting: "warning", reported: "info", paid: "success" } as const;

/**
 * The COD deposit (عربون, ROADMAP.md F-21) on the order panel: how much, how
 * much is left for delivery, its state, and the seller's "Deposit received" /
 * "Not received" for a transfer (a card deposit is marked paid by the
 * gateway). The transfer screenshot shows right below (OrderPaymentProof).
 */
export function OrderDepositCard({ order }: { order: SellerOrderRow }) {
  const t = useTranslations("orders.deposit");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const deposit = order.deposit;
  if (!deposit) return null;

  const unit = { currency: order.currency };
  const open = deposit.status !== "paid" && !["cancelled", "refund"].includes(order.flow.stage) && !order.isTest;

  const decide = (decision: "received" | "not_received") =>
    startTransition(async () => {
      const result = await decideOrderDeposit({ orderId: order.id, decision });
      if (result.success) {
        toast.success(t(decision === "received" ? "confirmed" : "rejected"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  const amountRow = (label: string, value: string, strong = false) => (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-[13px]">
      <span className="text-(--s-subtle)">{label}</span>
      <span
        className={cn("font-montserrat tabular-nums text-(--s-text)", strong ? "text-[15px] font-bold" : "font-semibold")}
        dir={moneyDir(locale, unit)}
      >
        <Money value={value} locale={locale} unit={unit} />
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-(--s-line-soft) bg-(--s-tint) p-3">
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] font-semibold text-(--s-text)">
        <HandCoins className="size-4 text-(--s-subtle)" aria-hidden />
        {deposit.percent ? t("titlePercent", { percent: deposit.percent }) : t("title")}
        <Tag tone={STATUS_TONE[deposit.status]}>{t(`status.${deposit.status}`)}</Tag>
      </p>
      {amountRow(t("depositAmount"), deposit.amount, true)}
      {amountRow(t("onDelivery"), deposit.remainder)}
      {deposit.status === "paid" && (
        <p className="text-xs text-(--s-subtle)">
          {t(deposit.paidVia === "gateway" ? "paidByCard" : "paidByTransfer")}
          {deposit.paidAt && ` · ${formatDateTime(deposit.paidAt, locale)}`}
        </p>
      )}
      {deposit.status === "reported" && deposit.reportedAt && (
        <p className="text-xs text-(--s-subtle)">{t("reportedAt", { date: formatDateTime(deposit.reportedAt, locale) })}</p>
      )}
      {open && (
        <>
          <p className="text-xs leading-relaxed text-(--s-muted)">{t(deposit.status === "reported" ? "checkHint" : "awaitingHint")}</p>
          <div className="flex flex-wrap gap-2">
            <SellerButton size="sm" className="flex-1" disabled={pending} onClick={() => decide("received")}>
              {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Check aria-hidden />}
              {t("received")}
            </SellerButton>
            {deposit.status === "reported" && (
              <SellerButton size="sm" variant="outline" className="flex-1" disabled={pending} onClick={() => decide("not_received")}>
                <X aria-hidden />
                {t("notReceived")}
              </SellerButton>
            )}
          </div>
        </>
      )}
    </div>
  );
}
