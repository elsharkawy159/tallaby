"use client";

import { ClipboardList, FileText, Package, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@/lib/utils";
import { PRINT_MAX_ORDERS, printOrdersHref, type PrintDoc } from "@/app/print/orders/print-orders.lib";

/**
 * Print an invoice or packing slip for these orders (ROADMAP.md F-04a). Opens
 * /print/orders in a new tab, which loads the orders again for the session seller.
 */
export function PrintOrdersButton({
  orderIds,
  showCount = false,
  className,
}: {
  orderIds: readonly string[];
  /** "Print (N)" for a list; plain "Print" for one order. */
  showCount?: boolean;
  className?: string;
}) {
  const t = useTranslations("orders.printActions");
  if (orderIds.length === 0) return null;
  const ids = orderIds.slice(0, PRINT_MAX_ORDERS);
  const open = (doc: PrintDoc) => window.open(printOrdersHref(doc, ids, true), "_blank", "noopener");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("rounded-[10px] bg-card", className)}>
          <Printer className="size-4" aria-hidden />
          {showCount ? t("printCount", { count: ids.length }) : t("print")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {orderIds.length > PRINT_MAX_ORDERS && (
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
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
