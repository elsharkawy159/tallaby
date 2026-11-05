"use client";

import { ClipboardList, FileText, Package, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { SellerButton, type SellerButtonSize } from "@/components/seller-ui";
import { PRINT_MAX_ORDERS, printOrdersHref, type PrintDoc } from "@/app/print/orders/print-orders.lib";
import { BAR_BUTTON } from "./orders-ui";

/**
 * Print an invoice or packing slip for these orders (ROADMAP.md F-04a). Opens
 * /print/orders in a new tab, which loads the orders again for the session seller.
 */
export function PrintOrdersButton({
  orderIds,
  total = orderIds.length,
  showCount = false,
  onBar = false,
  size,
  className,
}: {
  orderIds: readonly string[];
  /** How many orders these ids were cut from, when the list has more than one print job. */
  total?: number;
  /** "Print (N)" for a list; plain "Print" for one order. */
  showCount?: boolean;
  /** Sits on the dark selection bar. */
  onBar?: boolean;
  size?: SellerButtonSize;
  className?: string;
}) {
  const t = useTranslations("orders.printActions");
  if (orderIds.length === 0) return null;
  const ids = orderIds.slice(0, PRINT_MAX_ORDERS);
  const open = (doc: PrintDoc) => window.open(printOrdersHref(doc, ids, true), "_blank", "noopener");
  const label = (
    <>
      <Printer aria-hidden />
      {showCount ? t("printCount", { count: ids.length }) : t("print")}
    </>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {onBar ? (
          <button type="button" className={BAR_BUTTON}>
            {label}
          </button>
        ) : (
          <SellerButton variant="outline" size={size} className={className}>
            {label}
          </SellerButton>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {total > PRINT_MAX_ORDERS && (
          <DropdownMenuLabel className="text-xs font-normal text-(--s-subtle)">
            {t("capped", { max: PRINT_MAX_ORDERS })}
          </DropdownMenuLabel>
        )}
        <DropdownMenuItem onSelect={() => open("invoice")}>
          <FileText className="size-4" aria-hidden />
          {showCount ? t("invoices") : t("invoice")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => open("slip")}>
          <Package className="size-4" aria-hidden />
          {showCount ? t("slips") : t("slip")}
        </DropdownMenuItem>
        {showCount && (
          <DropdownMenuItem onSelect={() => open("picking")}>
            <ClipboardList className="size-4" aria-hidden />
            {t("picking")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
