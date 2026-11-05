"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Copy, TriangleAlert } from "lucide-react";
import { customerPhone } from "@workspace/lib/customers";
import { Note, Tag } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import type { SellerOrderRow } from "./orders.types";

/**
 * Risk signals of a store order (ROADMAP.md F-02d): the phone refused orders
 * on this store before, or placed another open order within minutes.
 * Compact chips for the card and table; a line per signal in the order panel.
 */
export function OrderRiskBadges({ order, className }: { order: SellerOrderRow; className?: string }) {
  const t = useTranslations("orders.risk");
  const risk = order.risk;
  if (!risk) return null;
  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {risk.refused > 0 && (
        <span title={t("refusedTitle", { refused: risk.refused, delivered: risk.delivered })}>
          <Tag tone="danger">
            <TriangleAlert aria-hidden />
            {t("refused", { count: risk.refused })}
          </Tag>
        </span>
      )}
      {risk.duplicates.length > 0 && (
        <span title={t("duplicateTitle", { numbers: risk.duplicates.map((n) => `#${n}`).join(", ") })}>
          <Tag tone="danger">
            <Copy aria-hidden />
            {t("duplicate")}
          </Tag>
        </span>
      )}
    </span>
  );
}

export function OrderRiskNote({ order }: { order: SellerOrderRow }) {
  const t = useTranslations("orders.risk");
  const risk = order.risk;
  if (!risk || !order.storeId) return null;
  const phone = customerPhone({ addressPhone: order.customerPhone, userPhone: null });
  return (
    <Note tone="danger" icon={TriangleAlert}>
      <div className="flex flex-col gap-1 font-medium">
        {risk.refused > 0 && <p>{t("refusedNote", { refused: risk.refused, delivered: risk.delivered })}</p>}
        {risk.duplicates.length > 0 && (
          <p className="flex items-start gap-1.5">
            <Copy className="mt-1 size-3.5 shrink-0" aria-hidden />
            {t("duplicateNote", { numbers: risk.duplicates.map((n) => `#${n}`).join(", ") })}
          </p>
        )}
        {phone && (
          <Link
            href={`/orders/customers?store=${order.storeId}`}
            className="inline-flex w-fit items-center underline underline-offset-4 hover:no-underline max-[600px]:min-h-10"
          >
            {t("seeCustomers")}
          </Link>
        )}
      </div>
    </Note>
  );
}
