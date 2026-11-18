"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Banknote } from "lucide-react";
import { Tag } from "@/components/seller-ui";
import { Money } from "@/components/money";
import { formatDate, moneyDir } from "@/lib/i18n/format";
import { SALE_STATE_TONE } from "../stores/[storeId]/earnings/earnings.lib";
import { getOrderTallabyPay, type OrderTallabyPaySale } from "./tallaby-pay.server";
import type { SellerOrderRow } from "./orders.types";

const EGP = { currency: "EGP" } as const;

/**
 * "Paid with Tallaby Pay" on the order panel (ROADMAP.md F-100f): what the
 * customer paid, Tallaby Pay's fee, the seller's net and its earnings status,
 * from the sale row. Loads only for an order paid online or with a deposit;
 * renders nothing when the order has no Tallaby Pay sale.
 */
export function OrderTallabyPay({ order }: { order: SellerOrderRow }) {
  const t = useTranslations("orders.details.tallabyPay");
  const tState = useTranslations("tallabyPayEarnings.sales.states");
  const locale = useLocale();
  const [sales, setSales] = useState<OrderTallabyPaySale[]>([]);
  const maybe = order.paymentMethod === "online_payment" || order.deposit !== null;

  useEffect(() => {
    if (!maybe) return;
    let live = true;
    getOrderTallabyPay(order.id).then((rows) => live && setSales(rows));
    return () => {
      live = false;
    };
  }, [order.id, maybe]);

  if (!maybe || sales.length === 0) return null;
  const dir = moneyDir(locale, EGP);

  return (
    <div className="flex flex-col gap-2 border-t border-(--s-line-soft) pt-2">
      {sales.map((sale) => (
        <div key={sale.purpose} className="flex flex-col gap-1.5 rounded-2xl bg-(--s-tint) px-3 py-2.5 text-[13px]">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-(--s-text)">
            <Banknote className="size-4 text-(--s-subtle)" aria-hidden />
            {t(sale.purpose === "deposit" ? "paidDeposit" : "paid")}
            <Tag tone={SALE_STATE_TONE[sale.state]}>
              {sale.state === "pending_until" && sale.releaseAt
                ? tState("pending_until", { date: formatDate(sale.releaseAt, locale) })
                : tState(sale.state)}
            </Tag>
          </p>
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
            <dt className="text-(--s-subtle)">{t("gross")}</dt>
            <dd className="font-montserrat tabular-nums" dir={dir}>
              <Money value={sale.gross} locale={locale} unit={EGP} />
            </dd>
            <dt className="text-(--s-subtle)">{t("fee")}</dt>
            <dd className="font-montserrat tabular-nums text-(--s-subtle)" dir={dir}>
              <Money value={sale.fee} locale={locale} unit={EGP} />
            </dd>
            <dt className="font-bold text-(--s-text)">{t("net")}</dt>
            <dd className="font-montserrat font-bold tabular-nums text-(--s-ink)" dir={dir}>
              <Money value={sale.net} locale={locale} unit={EGP} />
            </dd>
          </dl>
          <p className="text-xs leading-[1.6] text-(--s-subtle)">
            {t("hint")}{" "}
            <Link href={`/stores/${sale.storeId}/earnings`} className="font-semibold text-(--s-link) underline-offset-2 hover:underline">
              {t("viewEarnings")}
            </Link>
          </p>
        </div>
      ))}
    </div>
  );
}
