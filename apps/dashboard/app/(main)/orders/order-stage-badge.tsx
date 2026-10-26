import { useTranslations } from "next-intl";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@/lib/utils";
import type { SellerOrderStage } from "./order-flow.lib";

/** Same palette as the delivery workspace's shipment badges. */
const STAGE_TONE: Record<SellerOrderStage, string> = {
  awaiting_payment: "bg-muted text-muted-foreground border-border",
  new: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900/60",
  to_ship: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/60",
  out_for_delivery: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900/60",
  failed: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/60",
  delivered: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-900/60",
  returned: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-900/60",
  cancelled: "bg-muted text-foreground border-border",
  refund: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-900/60",
};

export function OrderStageBadge({ stage, className }: { stage: SellerOrderStage; className?: string }) {
  const t = useTranslations("orders.stage");
  return (
    <Badge variant="outline" className={cn("font-medium", STAGE_TONE[stage], className)}>
      {t(stage)}
    </Badge>
  );
}
