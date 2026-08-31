import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { MapsLinkButton } from "@workspace/ui/components/maps-link-button";
import { Separator } from "@workspace/ui/components/separator";

import { formatAddress, formatCurrency, formatDate } from "@/lib/format";
import {
  getPaymentStatusColor,
  getStatusColor,
  isSettled,
  type ShippingStatus,
} from "@/lib/shipping-status";

import {
  getActiveProviders,
  getRiders,
  getShippingOrderDetail,
} from "../orders.server";
import type { OrderDetail } from "../orders.types";
import { ShippingActions } from "./_components/shipping-actions";

interface OrderDetailDataProps {
  orderId: string;
}

export async function OrderDetailData({ orderId }: OrderDetailDataProps) {
  const t = await getTranslations("orders");
  const tStatus = await getTranslations("status");
  const tPayment = await getTranslations("paymentStatus");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();

  const [orderResult, providersResult, ridersResult] = await Promise.all([
    getShippingOrderDetail(orderId),
    getActiveProviders(),
    getRiders(),
  ]);

  if (!orderResult.success || !orderResult.data) {
    notFound();
  }

  const order = orderResult.data;
  const shipment = order.shipments[0] ?? null;
  const shippingAddress = order.userAddress_shippingAddressId;
  const status = (shipment?.status ?? "pending") as ShippingStatus;
  const codAmount = isSettled(order.paymentStatus) ? 0 : Number(order.totalAmount);
  const emDash = tCommon("emDash");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/orders" aria-label={t("backAria")}>
              <ArrowLeft className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("placed", { date: formatDate(order.createdAt, locale) })}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(status)}>
          {tStatus(status)}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("customer")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label={t("name")} value={shippingAddress?.fullName ?? order.user?.fullName} emDash={emDash} />
            <Field label={t("phone")} value={shippingAddress?.phone ?? order.user?.phone} emDash={emDash} />
            <Field label={t("email")} value={order.user?.email} emDash={emDash} />
            <div className="space-y-2">
              <Field label={t("address")} value={formatAddress(shippingAddress)} emDash={emDash} />
              <MapsLinkButton
                type="navigation"
                latitude={shippingAddress?.latitude}
                longitude={shippingAddress?.longitude}
              />
            </div>
            {shippingAddress?.deliveryInstructions && (
              <Field
                label={t("deliveryNotes")}
                value={shippingAddress.deliveryInstructions}
                emDash={emDash}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("order")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate">{item.productName}</span>
                    {item.variantName && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.variantName}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      × {item.quantity}
                    </span>
                  </span>
                  <span className="whitespace-nowrap">
                    {formatCurrency(Number(item.total))}
                  </span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("itemsTotal")}</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("deliveryCharge")}</span>
              <span>{formatCurrency(Number(order.shippingCost ?? 0))}</span>
            </div>
            {Number(order.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {order.couponCode
                    ? t("discountWithCoupon", { code: order.couponCode })
                    : t("discount")}
                </span>
                <span>-{formatCurrency(Number(order.discountAmount))}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>{t("orderTotal")}</span>
              <span>{formatCurrency(Number(order.totalAmount))}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("paymentMethod")}</span>
              <span className="capitalize">{order.paymentMethod}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("paymentStatus")}</span>
              <Badge className={getPaymentStatusColor(order.paymentStatus ?? "")}>
                {tPayment((order.paymentStatus ?? "unknown") as "pending")}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("collectOnDelivery")}</span>
              <span className="font-medium">
                {codAmount > 0 ? formatCurrency(codAmount) : emDash}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("shipping")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label={t("provider")} value={shipment?.provider?.name} emDash={emDash} />
            <Field label={t("rider")} value={shipment?.rider?.fullName} emDash={emDash} />
            <Field label={t("riderPhone")} value={shipment?.rider?.phone} emDash={emDash} />
            <Field label={t("tracking")} value={shipment?.trackingNumber} emDash={emDash} />
            <Field
              label={t("assigned")}
              value={shipment?.assignedAt ? formatDate(shipment.assignedAt, locale) : null}
              emDash={emDash}
            />
            <Field
              label={t("outForDelivery")}
              value={shipment?.shippedAt ? formatDate(shipment.shippedAt, locale) : null}
              emDash={emDash}
            />
            <Field
              label={t("delivered")}
              value={shipment?.deliveredAt ? formatDate(shipment.deliveredAt, locale) : null}
              emDash={emDash}
            />
            {shipment?.failureReason && (
              <Field label={t("failureReason")} value={shipment.failureReason} emDash={emDash} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("deliveryActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveryActivity
              deliveries={shipment?.deliveries ?? []}
              collections={order.payments.filter((p) => p.status === "collected")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("actions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ShippingActions
              orderId={order.id}
              status={status}
              providerId={shipment?.providerId ?? null}
              riderId={shipment?.riderId ?? null}
              providers={providersResult.data}
              riders={ridersResult.data}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function DeliveryActivity({
  deliveries,
  collections,
}: {
  deliveries: OrderDetail["shipments"][number]["deliveries"];
  collections: OrderDetail["payments"];
}) {
  const t = await getTranslations("orders");
  const tCommon = await getTranslations("common");
  const tReasons = await getTranslations("failureReasons");
  const locale = await getLocale();
  const emDash = tCommon("emDash");

  if (deliveries.length === 0 && collections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("noActivity")}</p>
    );
  }

  return (
    <div className="space-y-3">
      {collections.map((payment) => {
        const data = (payment.paymentData ?? {}) as {
          expectedAmount?: number;
          discrepancy?: number;
        };
        const discrepancy = data.discrepancy ?? 0;

        return (
          <div
            key={payment.id}
            className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {t("codCollected", {
                  amount: formatCurrency(Number(payment.amount)),
                  method: payment.method,
                })}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(payment.capturedAt ?? payment.createdAt, locale)}
              </span>
            </div>
            {discrepancy !== 0 && (
              <p className="mt-1 text-xs text-orange-700 dark:text-orange-300">
                {t("discrepancyVs", {
                  type: discrepancy > 0 ? t("surplus") : t("shortfall"),
                  amount: formatCurrency(Math.abs(discrepancy)),
                  expected:
                    data.expectedAmount != null
                      ? formatCurrency(data.expectedAmount)
                      : emDash,
                })}
              </p>
            )}
          </div>
        );
      })}

      {deliveries.map((event) => {
        const proof = (event.proofOfDelivery ?? {}) as { reasonCode?: string };
        const eventLabel =
          event.status === "note"
            ? t("note")
            : event.status === "failed"
              ? t("deliveryFailed")
              : event.status === "delivered"
                ? t("delivered")
                : (event.status ?? t("event"));

        return (
          <div key={event.id} className="rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">
                {eventLabel}
                {proof.reasonCode &&
                  ` — ${tReasons(proof.reasonCode as "customer_unavailable")}`}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(event.createdAt, locale)}
              </span>
            </div>
            {event.deliveryNotes && (
              <p className="mt-1 text-muted-foreground">{event.deliveryNotes}</p>
            )}
            {event.user?.fullName && (
              <p className="mt-1 text-xs text-muted-foreground">
                {tCommon("by", { name: event.user.fullName })}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label,
  value,
  emDash,
}: {
  label: string;
  value?: string | null;
  emDash: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-end">{value || emDash}</span>
    </div>
  );
}
