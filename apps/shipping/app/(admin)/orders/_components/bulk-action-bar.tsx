"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import type { OrderStage } from "../orders.dto";
import { hasStageAction } from "../stage-actions.lib";

interface BulkActionBarProps {
  stage: OrderStage;
  selectedCount: number;
  isPending: boolean;
  onClear: () => void;
  onPrimaryAction: () => void;
}

function stageActionKey(
  stage: OrderStage
): "markConfirmed" | "assign" | "markOutForDelivery" | "markDelivered" | null {
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
      return null;
  }
}

/** A sticky bar that appears once at least one row is selected. */
export function BulkActionBar({ stage, selectedCount, isPending, onClear, onPrimaryAction }: BulkActionBarProps) {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const actionKey = stageActionKey(stage);

  if (selectedCount === 0 || !hasStageAction(stage) || !actionKey) return null;

  const selectedLabel =
    selectedCount === 1
      ? t("selectedCount", { count: selectedCount })
      : t("selectedCount_other", { count: selectedCount });

  return (
    <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-lg border bg-white p-3 shadow-lg dark:bg-gray-950">
      <span className="text-sm font-medium">{selectedLabel}</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClear} disabled={isPending}>
          {tCommon("clear")}
        </Button>
        <Button size="sm" onClick={onPrimaryAction} disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {t(actionKey)}
        </Button>
      </div>
    </div>
  );
}
