"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Copy, TriangleAlert } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { customerPhone } from "@workspace/lib/customers";
import { cn } from "@/lib/utils";
import type { SellerOrderRow } from "./orders.types";

const TONE = "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-300";

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
        <Badge variant="outline" className={cn("gap-1 font-medium", TONE)} title={t("refusedTitle", { refused: risk.refused, delivered: risk.delivered })}>
          <TriangleAlert className="size-3" aria-hidden />
          {t("refused", { count: risk.refused })}
        </Badge>
      )}
      {risk.duplicates.length > 0 && (
        <Badge variant="outline" className={cn("gap-1 font-medium", TONE)} title={t("duplicateTitle", { numbers: risk.duplicates.map((n) => `#${n}`).join(", ") })}>
          <Copy className="size-3" aria-hidden />
          {t("duplicate")}
        </Badge>
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
    <div className={cn("space-y-1 rounded-lg border p-3 text-xs", TONE)}>
      {risk.refused > 0 && (
        <p className="flex items-start gap-2 font-medium">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {t("refusedNote", { refused: risk.refused, delivered: risk.delivered })}
        </p>
      )}
      {risk.duplicates.length > 0 && (
        <p className="flex items-start gap-2 font-medium">
          <Copy className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {t("duplicateNote", { numbers: risk.duplicates.map((n) => `#${n}`).join(", ") })}
        </p>
      )}
      {phone && (
        <Link
          href={`/orders/customers?store=${order.storeId}`}
          className="inline-block underline underline-offset-4 hover:no-underline"
        >
          {t("seeCustomers")}
        </Link>
      )}
    </div>
  );
}
