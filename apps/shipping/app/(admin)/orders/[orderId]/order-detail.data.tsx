import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";

import { formatAddress, formatCurrency, formatDate } from "@/lib/format";
import {
  getFailureReasonLabel,
  getPaymentStatusColor,
  getStatusColor,
  getStatusLabel,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/orders" aria-label="Back to shipping orders">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Name" value={shippingAddress?.fullName ?? order.user?.fullName} />
            <Field label="Phone" value={shippingAddress?.phone ?? order.user?.phone} />
            <Field label="Email" value={order.user?.email} />
            <Field label="Address" value={formatAddress(shippingAddress)} />
            {shippingAddress?.deliveryInstructions && (
              <Field
                label="Delivery notes"
                value={shippingAddress.deliveryInstructions}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order</CardTitle>
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
              <span className="text-muted-foreground">Items total</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery charge</span>
              <span>{formatCurrency(Number(order.shippingCost ?? 0))}</span>
            </div>
            {Number(order.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                </span>
                <span>-{formatCurrency(Number(order.discountAmount))}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Order total</span>
              <span>{formatCurrency(Number(order.totalAmount))}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Payment method</span>
              <span className="capitalize">{order.paymentMethod}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Payment status</span>
              <Badge className={getPaymentStatusColor(order.paymentStatus ?? "")}>
                {getStatusLabel(order.paymentStatus ?? "unknown")}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collect on delivery</span>
              <span className="font-medium">
                {codAmount > 0 ? formatCurrency(codAmount) : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shipping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Provider" value={shipment?.provider?.name} />
            <Field label="Rider" value={shipment?.rider?.fullName} />
            <Field label="Rider phone" value={shipment?.rider?.phone} />
            <Field label="Tracking" value={shipment?.trackingNumber} />
            <Field label="Assigned" value={shipment?.assignedAt ? formatDate(shipment.assignedAt) : null} />
            <Field label="Out for delivery" value={shipment?.shippedAt ? formatDate(shipment.shippedAt) : null} />
            <Field label="Delivered" value={shipment?.deliveredAt ? formatDate(shipment.deliveredAt) : null} />
            {shipment?.failureReason && (
              <Field label="Failure reason" value={shipment.failureReason} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Delivery activity</CardTitle>
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
            <CardTitle className="text-base">Actions</CardTitle>
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

function DeliveryActivity({
  deliveries,
  collections,
}: {
  deliveries: OrderDetail["shipments"][number]["deliveries"];
  collections: OrderDetail["payments"];
}) {
  if (deliveries.length === 0 && collections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No delivery notes, attempts, or collections recorded yet.
      </p>
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
                COD collected — {formatCurrency(Number(payment.amount))} (
                {payment.method})
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(payment.capturedAt ?? payment.createdAt)}
              </span>
            </div>
            {discrepancy !== 0 && (
              <p className="mt-1 text-xs text-orange-700 dark:text-orange-300">
                {discrepancy > 0 ? "Surplus" : "Shortfall"} of{" "}
                {formatCurrency(Math.abs(discrepancy))} vs. expected{" "}
                {data.expectedAmount != null ? formatCurrency(data.expectedAmount) : "—"}
              </p>
            )}
          </div>
        );
      })}

      {deliveries.map((event) => {
        const proof = (event.proofOfDelivery ?? {}) as { reasonCode?: string };

        return (
          <div key={event.id} className="rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">
                {event.status === "note"
                  ? "Note"
                  : event.status === "failed"
                    ? "Delivery failed"
                    : event.status === "delivered"
                      ? "Delivered"
                      : (event.status ?? "Event")}
                {proof.reasonCode && ` — ${getFailureReasonLabel(proof.reasonCode)}`}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(event.createdAt)}
              </span>
            </div>
            {event.deliveryNotes && (
              <p className="mt-1 text-muted-foreground">{event.deliveryNotes}</p>
            )}
            {event.user?.fullName && (
              <p className="mt-1 text-xs text-muted-foreground">
                By {event.user.fullName}
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
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right">{value || "—"}</span>
    </div>
  );
}
