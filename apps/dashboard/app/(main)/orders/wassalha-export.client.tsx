"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileSpreadsheet, LoaderCircle } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { downloadXlsx } from "@/lib/product-excel";
import type { SellerOrderRow } from "./orders.types";
import { exportForWassalha } from "./wassalha-export.server";

/** The order can go into a Wassalha sheet: its store has Wassalha, it waits to ship, and no carrier took it. */
export function canExportForWassalha(order: SellerOrderRow): boolean {
  return (
    order.wassalhaConnected &&
    !order.flow.readOnly &&
    !order.flow.carrierManaged &&
    !order.bosta?.trackingNumber &&
    (order.flow.stage === "new" || order.flow.stage === "to_ship")
  );
}

/**
 * "Export for Wassalha" (F-12c): one order (order card, order panel) or every
 * exportable order on screen for one store (orders toolbar). Downloads the
 * sheet to upload on the Wassalha dashboard; orders that can't go in are
 * listed in a toast.
 */
export function WassalhaExportButton({
  storeId,
  orders,
  showCount,
  className,
}: {
  storeId: string;
  orders: SellerOrderRow[];
  showCount?: boolean;
  className?: string;
}) {
  const t = useTranslations("orders.wassalha");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const ids = orders.filter(canExportForWassalha).map((o) => o.id);
  if (ids.length === 0) return null;
  const again = ids.length === 1 && orders.find((o) => o.id === ids[0])?.wassalhaExported;

  const run = () =>
    startTransition(async () => {
      const result = await exportForWassalha(storeId, ids);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      const { rows, header, exported, skipped } = result.data;
      if (rows.length > 0) {
        const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
        await downloadXlsx(rows, { fileName: `wassalha-${stamp}.xlsx`, sheetName: "Sheet1", header });
        toast.success(t("exported", { count: exported }));
      }
      if (skipped.length > 0) {
        toast.warning(t("skipped", { count: skipped.length }), {
          description: skipped
            .slice(0, 5)
            .map((s) => `${s.orderNumber ? `#${s.orderNumber}: ` : ""}${t(`reasons.${s.reason}`)}`)
            .join("\n"),
          duration: 10_000,
        });
      }
      router.refresh();
    });

  return (
    <Button type="button" variant="outline" size="sm" className={cn("gap-1.5", className)} disabled={pending} onClick={run}>
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <FileSpreadsheet className="size-4" aria-hidden />}
      {again ? t("exportAgain") : showCount ? t("exportMany", { count: ids.length }) : t("export")}
    </Button>
  );
}
