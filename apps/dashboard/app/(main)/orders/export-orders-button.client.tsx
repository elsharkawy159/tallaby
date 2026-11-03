"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { translateStatus } from "@/lib/i18n/status";
import { downloadXlsx, todayStamp } from "@/lib/product-excel";
import { chunk } from "./orders-bulk.lib";
import { listFilteredOrderIdsAction, loadOrdersForExportAction } from "./orders-list.server";
import { ORDER_EXPORT_COLUMNS, orderExportRow } from "./orders-export.lib";
import type { SellerOrderRow } from "./orders.types";
import type { OrdersListFilters } from "./orders-view.lib";

const EXPORT_CHUNK = 200;

/**
 * Orders as .xlsx (ROADMAP.md F-04b): the selected ids, or every order under
 * the filters across pages. The rows are read again in chunks for the session
 * seller, since the browser holds only one page; the sheet is built here.
 */
export function ExportOrdersButton({
  ids,
  filters,
  count,
  className,
}: {
  ids?: readonly string[];
  filters?: OrdersListFilters;
  count: number;
  className?: string;
}) {
  const t = useTranslations("orders");
  const tStatus = useTranslations("status");
  const [exporting, startExporting] = useTransition();
  if (count === 0) return null;

  const loadRows = async (): Promise<SellerOrderRow[] | null> => {
    const list = ids ? { success: true as const, ids: [...ids] } : await listFilteredOrderIdsAction(filters);
    if (!list.success) return null;
    const rows: SellerOrderRow[] = [];
    for (const part of chunk(list.ids, EXPORT_CHUNK)) {
      const res = await loadOrdersForExportAction(part);
      if (!res.success) return null;
      rows.push(...res.orders);
    }
    return rows;
  };

  const exportRows = () =>
    startExporting(async () => {
      try {
        const orders = await loadRows();
        if (!orders) {
          toast.error(t("export.failed"));
          return;
        }
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
        await downloadXlsx(sheet, { fileName: `orders-${todayStamp()}.xlsx`, sheetName: t("export.sheet"), header });
      } catch {
        toast.error(t("export.failed"));
      }
    });

  return (
    <Button variant="outline" className={cn("rounded-[10px] bg-card", className)} onClick={exportRows} disabled={exporting}>
      <Download className="size-4" aria-hidden />
      {t("export.button", { count })}
    </Button>
  );
}
