import { getLocale, getTranslations } from "next-intl/server";
import { AlertTriangle, CheckCircle2, ClipboardList, Truck, UserCheck } from "lucide-react";
import { Card, CardContent, CardTitle } from "@workspace/ui/components/card";
import { cn } from "@/lib/utils";
import type { ShipmentInfo } from "./order-confirmation.types";

type Step = { key: string; at: string | null; icon: typeof Truck; tone?: "danger" };

/**
 * When each delivery step happened (PLAN.md P3-06). Times come from the
 * shipment, which the seller's delivery tracking or the Tallaby rider app
 * update; the page already refreshes live (order-realtime / order-polling).
 */
export async function DeliveryTimeline({ placedAt, shipments }: { placedAt: string; shipments: ShipmentInfo[] }) {
  const shipment = shipments[0];
  if (!shipment) return null;
  const [t, locale] = await Promise.all([getTranslations("orders"), getLocale()]);
  const format = (iso: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Cairo",
    }).format(new Date(iso));

  const steps: Step[] = [
    { key: "deliveryPlaced", at: placedAt || null, icon: ClipboardList },
    { key: "deliveryAssigned", at: shipment.assignedAt, icon: UserCheck },
    { key: "deliveryOutForDelivery", at: shipment.shippedAt, icon: Truck },
    { key: "deliveryDelivered", at: shipment.deliveredAt, icon: CheckCircle2 },
  ];
  const reached = steps.filter((s) => s.at);
  const failed = shipment.status === "failed";

  return (
    <Card className="rounded-xl md:rounded-2xl border overflow-hidden pt-0 bg-white">
      <div className="bg-linear-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
        <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
          <Truck className="h-4 w-4 md:h-5 md:w-5" /> {t("deliveryUpdates")}
        </CardTitle>
      </div>
      <CardContent>
        <ol className="relative space-y-4 border-s border-gray-200 ps-5">
          {reached.map((step) => (
            <li key={step.key} className="relative">
              <span className="absolute -start-[29px] flex size-6 items-center justify-center rounded-full bg-green-100 text-green-700">
                <step.icon className="size-3.5" aria-hidden />
              </span>
              <p className="text-xs md:text-sm font-medium text-gray-900">{t(step.key)}</p>
              <time dateTime={step.at!} className="text-xs text-gray-500">
                {format(step.at!)}
              </time>
            </li>
          ))}
          {failed && (
            <li className="relative">
              <span className={cn("absolute -start-[29px] flex size-6 items-center justify-center rounded-full bg-red-100 text-red-700")}>
                <AlertTriangle className="size-3.5" aria-hidden />
              </span>
              <p className="text-xs md:text-sm font-medium text-red-700">
                {shipment.failureReason
                  ? t("deliveryFailed", { reason: shipment.failureReason })
                  : t("deliveryFailedNoReason")}
              </p>
            </li>
          )}
        </ol>
      </CardContent>
    </Card>
  );
}
