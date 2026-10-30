"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { translateStatus } from "@/lib/i18n/status";
import { downloadXlsx, todayStamp } from "@/lib/product-excel";
import { ORDER_EXPORT_COLUMNS, orderExportRow } from "./orders-export.lib";
import type { SellerOrderRow } from "./orders.types";

/**
 * The orders on screen (store, tab, search and Bosta filter applied) as .xlsx
 * (ROADMAP.md F-04b), built in the browser from rows this seller already loaded.
 */
export function ExportOrdersButton({ orders, className }: { orders: readonly SellerOrderRow[]; className?: string }) {
  const t = useTranslations("orders");
  const tStatus = useTranslations("status");
  const [exporting, startExporting] = useTransition();
  if (orders.length === 0) return null;

  const exportRows = () =>
    startExporting(async () => {
      const header = ORDER_EXPORT_COLUMNS.map((column) => t(`export.columns.${column}`));
      const labels = {
        marketplace: t("channel.marketplace"),
        stage: (stage: SellerOrderRow["flow"]["stage"]) => t(`stage.${stage}`),
        paymentMethod: (method: string) =>
          t.has(`details.paymentMethods.${method}`) ? t(`details.paymentMethods.${method}`) : method.replace(/_/g, " "),
        paymentStatus: (status: string) => translateStatus(tStatus, "payment", status),
      };
      const sheet = orders.map((order) => {
        const values = orderExportRow(order, labels);
        return Object.fromEntries(ORDER_EXPORT_COLUMNS.map((column, i) => [header[i], values[column]]));
      });
      try {
        await downloadXlsx(sheet, { fileName: `orders-${todayStamp()}.xlsx`, sheetName: t("export.sheet"), header });
      } catch {
        toast.error(t("export.failed"));
      }
    });

  return (
    <Button variant="outline" className={cn("rounded-[10px] bg-card", className)} onClick={exportRows} disabled={exporting}>
      <Download className="size-4" aria-hidden />
      {t("export.button", { count: orders.length })}
    </Button>
  );
}
