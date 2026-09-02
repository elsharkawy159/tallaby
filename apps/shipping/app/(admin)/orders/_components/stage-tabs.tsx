"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@workspace/ui/lib/utils";
import { ORDER_STAGES, type OrderStage } from "../orders.dto";
import type { StageCounts } from "../orders.types";

function countFor(stage: OrderStage, counts: StageCounts): number | null {
  switch (stage) {
    case "pending":
      return counts.pending;
    case "confirmed":
      return counts.confirmed;
    case "shipped":
      return counts.shipped;
    case "out_for_delivery":
      return counts.outForDelivery;
    case "delivered":
      return counts.delivered;
    case "failed":
      return counts.failed;
    case "cancelled":
      return counts.cancelled;
    case "returned":
      return counts.returned;
    case "all":
      return null;
  }
}

interface StageTabsProps {
  activeStage: OrderStage;
  counts: StageCounts;
}

/**
 * Plain links, not the shadcn Tabs primitive — each stage is a distinct
 * server-fetched page of data (via `?stage=`), not client-side panel
 * switching, so a real navigation (with prefetch) is the right model.
 */
export function StageTabs({ activeStage, counts }: StageTabsProps) {
  const t = useTranslations("orders");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="inline-flex h-10 flex-wrap items-center gap-0.5 rounded-lg border border-input bg-muted p-0.5">
      {ORDER_STAGES.map((stage) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("stage", stage);
        params.delete("page");

        const isActive = stage === activeStage;
        const count = countFor(stage, counts);

        return (
          <Link
            key={stage}
            href={`${pathname}?${params.toString()}`}
            scroll={false}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(`stages.${stage}`)}
            {count !== null && (
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs",
                  isActive ? "bg-muted text-foreground" : "bg-background text-muted-foreground"
                )}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
