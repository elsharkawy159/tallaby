import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, MapPin } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

import { formatAddress, formatCurrency } from "@/lib/format";
import { translateShippingStatus } from "@/lib/rider-labels";
import {
  getStatusColor,
  isSettled,
  type ShippingStatus,
} from "@/lib/shipping-status";

import { AddNote } from "../_components/add-note";
import { CustomerActions } from "../_components/customer-actions";
import { DeliveryActions } from "../_components/delivery-actions";
import { getMyDelivery } from "../rider.server";

export const dynamic = "force-dynamic";

interface DeliveryPageProps {
  params: Promise<{ shipmentId: string }>;
}

async function DeliveryDetail({ shipmentId }: { shipmentId: string }) {
  const t = await getTranslations("rider");
  const tStatus = await getTranslations("status");
  const result = await getMyDelivery(shipmentId);

  if (!result.success || !result.data) {
    notFound();
  }

  const delivery = result.data;
  const items = result.items ?? [];
  const cod = isSettled(delivery.paymentStatus) ? 0 : Number(delivery.totalAmount);
  const status = delivery.status as ShippingStatus;
  const address = formatAddress(
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
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/rider" aria-label={t("backToDeliveries")}>
              <ArrowLeft className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
          <h1 className="truncate text-lg font-bold">{delivery.orderNumber}</h1>
        </div>
        <Badge className={getStatusColor(status)}>
          {translateShippingStatus(tStatus, status)}
        </Badge>
      </div>

      <Card className="gap-0 py-4">
        <CardContent className="space-y-3 px-4">
          <p className="font-medium">{delivery.customerName ?? "—"}</p>

          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0">{address}</span>
          </p>

          {delivery.deliveryInstructions && (
            <p className="rounded-lg bg-muted p-3 text-sm">
              {delivery.deliveryInstructions}
            </p>
          )}

          <CustomerActions
            phone={delivery.phone}
            address={address}
            latitude={delivery.latitude}
            longitude={delivery.longitude}
          />
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

          <div className="space-y-1.5 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("itemsTotal")}</span>
              <span>{formatCurrency(Number(delivery.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("deliveryCharge")}</span>
              <span>{formatCurrency(Number(delivery.shippingCost ?? 0))}</span>
            </div>
            {Number(delivery.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("discount")}
                  {delivery.couponCode ? ` (${delivery.couponCode})` : ""}
                </span>
                <span>-{formatCurrency(Number(delivery.discountAmount))}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>{t("orderTotal")}</span>
              <span>{formatCurrency(Number(delivery.totalAmount))}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t("payment")}</span>
              <span className="capitalize">
                {delivery.paymentMethod} · {delivery.paymentStatus ?? "—"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">
              {cod > 0 ? t("collectOnDelivery") : t("prepaid")}
            </span>
            <span className="text-lg font-bold">
              {cod > 0 ? formatCurrency(cod) : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <DeliveryActions
        shipmentId={delivery.shipmentId}
        status={status}
        codAmount={cod}
      />

      {status === "out_for_delivery" && <AddNote shipmentId={delivery.shipmentId} />}
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
