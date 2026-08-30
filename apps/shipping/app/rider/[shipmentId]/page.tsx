import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

import { formatAddress, formatCurrency } from "@/lib/format";
import {
  getStatusColor,
  getStatusLabel,
  type ShippingStatus,
} from "@/lib/shipping-status";

import { DeliveryActions } from "../_components/delivery-actions";
import { getMyDelivery } from "../rider.server";

export const dynamic = "force-dynamic";

interface DeliveryPageProps {
  params: Promise<{ shipmentId: string }>;
}

async function DeliveryDetail({ shipmentId }: { shipmentId: string }) {
  const result = await getMyDelivery(shipmentId);

  // A shipment assigned to someone else is indistinguishable from one that
  // doesn't exist — the query is scoped by rider id, so both return nothing.
  if (!result.success || !result.data) {
    notFound();
  }

  const delivery = result.data;
  const items = result.items ?? [];
  const cod =
    delivery.paymentStatus === "paid" ? 0 : Number(delivery.totalAmount);
  const status = delivery.status as ShippingStatus;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/rider" aria-label="Back to my deliveries">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="truncate text-lg font-bold">{delivery.orderNumber}</h1>
        </div>
        <Badge className={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Badge>
      </div>

      <Card className="gap-0 py-4">
        <CardContent className="space-y-3 px-4">
          <p className="font-medium">{delivery.customerName ?? "—"}</p>

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
            <a
              href={`tel:${delivery.phone}`}
              className="flex items-center gap-2 text-sm font-medium text-primary"
            >
              <Phone className="size-4 shrink-0" />
              {delivery.phone}
            </a>
          )}

          {delivery.deliveryInstructions && (
            <p className="rounded-lg bg-muted p-3 text-sm">
              {delivery.deliveryInstructions}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 py-4">
        <CardContent className="space-y-3 px-4">
          <ul className="space-y-1 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {item.productName}
                  {item.variantName && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {item.variantName}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  × {item.quantity}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">
              {cod > 0 ? "Collect on delivery" : "Prepaid"}
            </span>
            <span className="text-lg font-bold">
              {cod > 0 ? formatCurrency(cod) : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <DeliveryActions shipmentId={delivery.shipmentId} status={status} />
    </div>
  );
}

export default async function DeliveryPage({ params }: DeliveryPageProps) {
  const { shipmentId } = await params;

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <DeliveryDetail shipmentId={shipmentId} />
    </Suspense>
  );
}
