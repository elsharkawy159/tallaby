import { useTranslations } from "next-intl";
import { StatusBadge, type BadgeTone } from "@/components/seller-ui";
import type { SellerOrderStage } from "./order-flow.lib";

/** Same tones as the delivery workspace's shipment badges. */
const STAGE_TONE: Record<SellerOrderStage, BadgeTone> = {
  awaiting_payment: "muted",
  new: "warning",
  to_ship: "info",
  out_for_delivery: "info",
  failed: "danger",
  delivered: "success",
  returned: "warning",
  cancelled: "muted",
  refund: "warning",
};

export function OrderStageBadge({ stage, className }: { stage: SellerOrderStage; className?: string }) {
  const t = useTranslations("orders.stage");
  return (
    <StatusBadge tone={STAGE_TONE[stage]} className={className}>
      {t(stage)}
    </StatusBadge>
  );
}
