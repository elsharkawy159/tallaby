"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, Check, LoaderCircle, PackageCheck, Truck, X } from "lucide-react";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { cn } from "@/lib/utils";
import { ExportOrdersButton } from "./export-orders-button.client";
import {
  BULK_MAX_ORDERS,
  bulkActionCounts,
  bulkTargets,
  chunk,
  type BulkOrderAction,
} from "./orders-bulk.lib";
import { bulkUpdateSellerOrders } from "./orders.server";
import type { OrderSummary } from "./orders.types";
import { BAR_BUTTON } from "./orders-ui";
import { PrintOrdersButton } from "./print-orders-button.client";

const ICON: Record<BulkOrderAction, React.ComponentType<{ className?: string }>> = {
  confirm: Check,
  ship: Truck,
  deliver: PackageCheck,
  cancel: Ban,
};

/**
 * Actions on the selected orders (ROADMAP.md F-04c): stage moves each order
 * already allows, print and export. Floats over the list while something is
 * selected, so it stays in reach on a phone; it wraps instead of scrolling.
 */
export function OrdersBulkBar({ orders, onClear }: { orders: OrderSummary[]; onClear: () => void }) {
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
    <div
      data-save-bar
      data-open
      className="fixed bottom-5 left-1/2 z-40 flex w-max max-w-[calc(100vw-20px)] -translate-x-1/2 flex-wrap items-center gap-1 rounded-[26px] bg-(--tallaby-teal-900) p-2 text-white shadow-(--s-shadow-bar) max-[720px]:inset-x-2.5 max-[720px]:bottom-3 max-[720px]:w-auto max-[720px]:max-w-none max-[720px]:translate-x-0 max-[720px]:rounded-[20px]"
    >
      <span className="px-3 text-[13.5px] font-bold">{t("selected", { count: orders.length })}</span>
      {actions.map(({ action, count }, index) => {
        const Icon = ICON[action];
        const main = index === 0 && action !== "cancel";
        return (
          <button
            key={action}
            type="button"
            className={cn(
              BAR_BUTTON,
              main && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground",
              action === "cancel" && "text-[#fca5a5]",
            )}
            disabled={isPending}
            onClick={() => setConfirming(action)}
          >
            {isPending && confirming === action ? <LoaderCircle className="animate-spin" aria-hidden /> : <Icon aria-hidden />}
            {isPending && confirming === action && progress ? t("progress", progress) : t(`actions.${action}`, { count })}
          </button>
        );
      })}
      <PrintOrdersButton orderIds={orders.map((o) => o.id)} showCount onBar />
      <ExportOrdersButton ids={orders.map((o) => o.id)} count={orders.length} onBar />
      <button type="button" className={cn(BAR_BUTTON, "ms-auto")} onClick={onClear} disabled={isPending}>
        <X aria-hidden />
        {t("clear")}
      </button>
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
