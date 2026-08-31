"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { bulkConfirmOrders, bulkUpdateShipmentStatus } from "../batch.server";
import type { OrderStage, ShippingFilters } from "../orders.dto";
import type { ProviderOption, ShippingOrderRow } from "../orders.types";
import { hasStageAction } from "../stage-actions.lib";
import { AssignDialog } from "./assign-dialog";
import { BulkActionBar } from "./bulk-action-bar";
import { OrdersTable } from "./orders-table";
import type { BulkAssignTarget } from "../batch.dto";

interface OrdersBoardProps {
  rows: ShippingOrderRow[];
  stage: OrderStage;
  filters: ShippingFilters;
  totalCount: number;
  providers: ProviderOption[];
}

const SELECTABLE_STAGES: OrderStage[] = ["pending", "confirmed", "shipped", "out_for_delivery"];

function stageActionKey(
  stage: OrderStage
): "markConfirmed" | "assign" | "markOutForDelivery" | "markDelivered" | undefined {
  switch (stage) {
    case "pending":
      return "markConfirmed";
    case "confirmed":
      return "assign";
    case "shipped":
      return "markOutForDelivery";
    case "out_for_delivery":
      return "markDelivered";
    default:
      return undefined;
  }
}

/**
 * Owns the checkbox selection for the current page of rows and wires it to
 * the sticky bulk action bar, the per-row action button, and the assign
 * dialog — all three drive the same runAction()/runAssign() pair, just with
 * a different orderIds list (the whole selection, or a single row).
 * Selection is deliberately per-page (a plain Set<string>, reset on stage/
 * filter change via the `key` orders.data.tsx already puts on the Suspense
 * boundary) — "Assign all" bypasses it entirely via `{ mode: "filters" }`.
 */
export function OrdersBoard({ rows, stage, filters, totalCount, providers }: OrdersBoardProps) {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [assignTarget, setAssignTarget] = useState<BulkAssignTarget | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const selectable = SELECTABLE_STAGES.includes(stage);
  const actionKey = stageActionKey(stage);
  const rowActionLabel =
    hasStageAction(stage) && actionKey ? t(actionKey) : undefined;

  function toggle(orderId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(rows.map((row) => row.orderId)) : new Set());
  }

  function clear() {
    setSelected(new Set());
  }

  function openAssign(orderIds: string[]) {
    setAssignTarget({ mode: "ids", orderIds });
    setAssignOpen(true);
  }

  /** Drives the bulk action bar (whole selection) and the per-row button (one order). */
  function runAction(orderIds: string[]) {
    if (orderIds.length === 0) return;

    if (stage === "pending") {
      startTransition(async () => {
        const result = await bulkConfirmOrders({ orderIds });
        if (result.success) {
          const confirmed = result.confirmed ?? 0;
          toast.success(
            confirmed === 1
              ? t("confirmedToast", { count: confirmed })
              : t("confirmedToast_other", { count: confirmed })
          );
          clear();
          router.refresh();
        } else {
          toast.error(result.error ?? tCommon("somethingWrong"));
        }
      });
      return;
    }

    if (stage === "confirmed") {
      openAssign(orderIds);
      return;
    }

    if (stage === "shipped" || stage === "out_for_delivery") {
      const status = stage === "shipped" ? "out_for_delivery" : "delivered";
      startTransition(async () => {
        const result = await bulkUpdateShipmentStatus({ orderIds, status });
        if (result.success) {
          const succeeded = result.succeeded ?? 0;
          const failedCount = result.failed?.length ?? 0;
          if (failedCount > 0) {
            toast.warning(
              t("partialUpdateToast", {
                succeeded,
                failed: failedCount,
              }),
              {
                description: result.failed
                  ?.map((f) => `${f.orderNumber}: ${f.reason}`)
                  .join("; "),
              }
            );
          } else {
            toast.success(
              succeeded === 1
                ? t("updatedToast", { count: succeeded })
                : t("updatedToast_other", { count: succeeded })
            );
          }
          clear();
          router.refresh();
        } else {
          toast.error(result.error ?? tCommon("somethingWrong"));
        }
      });
    }
  }

  return (
    <div className="space-y-4">
      {stage === "confirmed" && totalCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAssignTarget({ mode: "filters", filters });
              setAssignOpen(true);
            }}
          >
            {t("assignAll", { count: totalCount })}
          </Button>
        </div>
      )}

      <OrdersTable
        rows={rows}
        selectable={selectable}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
        rowActionLabel={rowActionLabel}
        rowActionPending={isPending}
        onRowAction={(orderId) => runAction([orderId])}
      />

      <BulkActionBar
        stage={stage}
        selectedCount={selected.size}
        isPending={isPending}
        onClear={clear}
        onPrimaryAction={() => runAction([...selected])}
      />

      {assignTarget && (
        <AssignDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          target={assignTarget}
          count={assignTarget.mode === "ids" ? assignTarget.orderIds.length : totalCount}
          providers={providers}
          onAssigned={clear}
        />
      )}
    </div>
  );
}
