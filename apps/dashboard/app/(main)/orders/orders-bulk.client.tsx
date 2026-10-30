"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, Check, LoaderCircle, PackageCheck, Truck, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { ExportOrdersButton } from "./export-orders-button.client";
import {
  BULK_MAX_ORDERS,
  bulkActionCounts,
  bulkTargets,
  chunk,
  type BulkOrderAction,
} from "./orders-bulk.lib";
import { bulkUpdateSellerOrders } from "./orders.server";
import type { SellerOrderRow } from "./orders.types";
import { PrintOrdersButton } from "./print-orders-button.client";

const ICON: Record<BulkOrderAction, React.ComponentType<{ className?: string }>> = {
  confirm: Check,
  ship: Truck,
  deliver: PackageCheck,
  cancel: Ban,
};

/**
 * Actions on the selected orders (ROADMAP.md F-04c): stage moves each order
 * already allows, print and export. Shows only while something is selected.
 */
export function OrdersBulkBar({ orders, onClear }: { orders: SellerOrderRow[]; onClear: () => void }) {
  const t = useTranslations("orders.bulk");
  const router = useRouter();
  const [confirming, setConfirming] = useState<BulkOrderAction | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  if (orders.length === 0) return null;

  const actions = bulkActionCounts(orders);
  const targets = confirming ? bulkTargets(orders, confirming) : [];

  const run = (action: BulkOrderAction) =>
    startTransition(async () => {
      const ids = bulkTargets(orders, action).map((o) => o.id);
      let done = 0;
      let skipped = 0;
      setProgress({ done: 0, total: ids.length });
      for (const part of chunk(ids, BULK_MAX_ORDERS)) {
        const res = await bulkUpdateSellerOrders({ orderIds: part, action });
        if (!res.success) {
          toast.error(res.error);
          break;
        }
        done += res.done;
        skipped += res.skipped;
        setProgress({ done: done + skipped, total: ids.length });
      }
      setProgress(null);
      setConfirming(null);
      if (done === 0 && skipped === 0) return;
      if (skipped) toast.warning(t("partial", { done, skipped }));
      else toast.success(t("done", { done }));
      onClear();
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary-soft/60 px-3 py-2">
      <span className="text-[13px] font-semibold text-primary-ink">{t("selected", { count: orders.length })}</span>
      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={onClear} disabled={isPending}>
        <X className="size-4" aria-hidden />
        {t("clear")}
      </Button>
      <div className="ms-auto flex flex-wrap items-center gap-2">
        {actions.map(({ action, count }) => {
          const Icon = ICON[action];
          return (
            <Button
              key={action}
              size="sm"
              variant={action === "cancel" ? "outline" : "default"}
              className={action === "cancel" ? "text-destructive hover:text-destructive" : undefined}
              disabled={isPending}
              onClick={() => setConfirming(action)}
            >
              {isPending && confirming === action ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <Icon className="size-4" aria-hidden />
              )}
              {isPending && confirming === action && progress ? t("progress", progress) : t(`actions.${action}`, { count })}
            </Button>
          );
        })}
        <PrintOrdersButton orderIds={orders.map((o) => o.id)} showCount className="h-8 bg-card" />
        <ExportOrdersButton orders={orders} className="h-8" />
      </div>
      <ConfirmActionDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && !isPending && setConfirming(null)}
        title={confirming ? t(`confirm.${confirming}Title`, { count: targets.length }) : ""}
        description={
          confirming
            ? `${t(`confirm.${confirming}Description`)}${
                targets.length < orders.length ? ` ${t("confirm.skipNote", { count: orders.length - targets.length })}` : ""
              }`
            : undefined
        }
        confirmLabel={confirming ? t(`actions.${confirming}`, { count: targets.length }) : ""}
        cancelLabel={t("back")}
        destructive={confirming === "cancel"}
        pending={isPending}
        onConfirm={() => confirming && run(confirming)}
      />
    </div>
  );
}
