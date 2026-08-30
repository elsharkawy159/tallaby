import Link from "next/link";
import { ChevronRight, MapPin, Phone } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";

import { formatAddress, formatCurrency } from "@/lib/format";
import { getStatusColor, getStatusLabel, isSettled } from "@/lib/shipping-status";
import type { RiderDelivery } from "../rider.server";

export function DeliveryCard({ delivery }: { delivery: RiderDelivery }) {
  const cod = isSettled(delivery.paymentStatus) ? 0 : Number(delivery.totalAmount);

  return (
    <Link href={`/rider/${delivery.shipmentId}`} className="block">
      <Card className="gap-0 py-4 transition-colors active:bg-gray-50 dark:active:bg-gray-900">
        <CardContent className="space-y-3 px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{delivery.orderNumber}</p>
              <p className="truncate text-sm text-muted-foreground">
                {delivery.customerName ?? "—"}
              </p>
            </div>
            <Badge className={getStatusColor(delivery.status)}>
              {getStatusLabel(delivery.status)}
            </Badge>
          </div>

          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0">
              {formatAddress(
                delivery.addressLine1
                  ? {
                      addressLine1: delivery.addressLine1,
                      addressLine2: delivery.addressLine2,
                      city: delivery.city ?? "",
                      state: delivery.state ?? "",
                      postalCode: delivery.postalCode,
                      country: delivery.country,
                    }
                  : null
              )}
            </span>
          </p>

          {delivery.phone && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-4 shrink-0" />
              {delivery.phone}
            </p>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm">
              {cod > 0 ? (
                <>
                  <span className="text-muted-foreground">Collect </span>
                  <span className="font-semibold">{formatCurrency(cod)}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Prepaid</span>
              )}
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
