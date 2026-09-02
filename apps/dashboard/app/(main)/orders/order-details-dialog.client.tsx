"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { formatCurrency } from "@workspace/lib";
import { getOrderDetails } from "@/actions/orders";
import { getPublicUrl } from "@/lib/utils";
import { getStorefrontProductUrl } from "@/lib/constants";
import {
  formatOrderStatus,
  orderStatusVariant,
  pickProductSlug,
  resolveCustomerEmail,
  resolveCustomerName,
  resolveCustomerPhone,
} from "./orders.lib";

type OrderDetailsResult = Awaited<ReturnType<typeof getOrderDetails>>;
type OrderDetails = NonNullable<
  Extract<OrderDetailsResult, { data: unknown }>["data"]
>;

const money = (value: string | number | null | undefined) =>
  formatCurrency(
    typeof value === "string" ? parseFloat(value) || 0 : (value ?? 0)
  );

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium break-words">{value || "—"}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border p-4 space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function OrderDetailsDialog({
  orderId,
  onClose,
}: {
  orderId: string | null;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!orderId) return;

    setOrder(null);
    setError(null);

    startTransition(async () => {
      const res = await getOrderDetails(orderId);
      if (!res.success) {
        setError(res.error || "Could not load this order.");
        return;
      }
      if (!res.data) {
        setError("This order is no longer available.");
        return;
      }
      setOrder(res.data);
    });
  }, [orderId]);

  const address = order?.userAddress_shippingAddressId;

  return (
    <Dialog open={Boolean(orderId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>Order #{order?.orderNumber ?? "…"}</span>
            {order?.status && (
              <Badge variant={orderStatusVariant(order.status)}>
                {formatOrderStatus(order.status)}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {order?.createdAt
              ? `Placed ${new Date(order.createdAt).toLocaleString()}`
              : "Loading order details…"}
          </DialogDescription>
        </DialogHeader>

        {isPending && !order && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive py-6 text-center">{error}</p>
        )}

        {order && (
          <div className="space-y-4">
            <Section title="Customer">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {resolveCustomerName(order)}
                  </span>
                  {order.user?.isGuest && <Badge variant="outline">Guest</Badge>}
                </div>
                <Row label="Phone" value={resolveCustomerPhone(order)} />
                <Row label="Email" value={resolveCustomerEmail(order)} />
              </div>
            </Section>

            <Section title="Shipping address">
              {address ? (
                <div className="space-y-1.5">
                  <Row label="Name" value={address.fullName} />
                  <Row label="Phone" value={address.phone} />
                  <Row
                    label="Address"
                    value={[address.addressLine1, address.addressLine2]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <Row
                    label="City"
                    value={[address.city, address.state, address.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <Row label="Country" value={address.country} />
                  {address.deliveryInstructions && (
                    <Row
                      label="Instructions"
                      value={address.deliveryInstructions}
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No shipping address on this order.
                </p>
              )}
            </Section>

            {(order.notes || (order.isGift && order.giftMessage)) && (
              <Section title="Order note">
                {order.notes && (
                  <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                )}
                {order.isGift && order.giftMessage && (
                  <p className="text-sm whitespace-pre-wrap">
                    <span className="text-muted-foreground">
                      Gift message:{" "}
                    </span>
                    {order.giftMessage}
                  </p>
                )}
              </Section>
            )}

            <Section title={`Items (${order.orderItems.length})`}>
              <ul className="divide-y">
                {order.orderItems.map((item) => {
                  const image = (item.product?.images as string[] | null)?.[0];
                  const slug = pickProductSlug(
                    item.product?.productTranslations
                  );
                  return (
                    <li key={item.id} className="flex gap-3 py-3 first:pt-0">
                      {image ? (
                        <Image
                          src={getPublicUrl(image, "products")}
                          alt={item.productName}
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded border object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 shrink-0 rounded border bg-muted" />
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        {slug ? (
                          <a
                            href={getStorefrontProductUrl(slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline inline-flex items-center gap-1"
                          >
                            {item.productName}
                            <ExternalLink className="size-3.5 shrink-0 opacity-60" />
                          </a>
                        ) : (
                          <span className="font-medium">
                            {item.productName}
                          </span>
                        )}
                        {item.variantName && (
                          <div className="text-xs text-muted-foreground">
                            {item.variantName}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          SKU: {item.sku} · {item.quantity} × {money(item.price)}
                        </div>
                        {item.status && (
                          <Badge
                            variant={orderStatusVariant(item.status)}
                            className="text-[10px]"
                          >
                            {formatOrderStatus(item.status)}
                          </Badge>
                        )}
                      </div>

                      <div className="text-right text-sm font-medium shrink-0">
                        {money(item.total)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Section>

            <Section title="Summary">
              <div className="space-y-1.5">
                <Row label="Payment method" value={order.paymentMethod} />
                <Row
                  label="Payment status"
                  value={
                    order.paymentStatus
                      ? formatOrderStatus(order.paymentStatus)
                      : null
                  }
                />
                <Separator className="my-2" />
                <Row label="Order total" value={money(order.totalAmount)} />
                <Row
                  label="Your items total"
                  value={money(
                    order.orderItems.reduce(
                      (sum, item) => sum + (parseFloat(item.total) || 0),
                      0
                    )
                  )}
                />
                <Row
                  label="Your earnings"
                  value={money(
                    order.orderItems.reduce(
                      (sum, item) => sum + (parseFloat(item.sellerEarning) || 0),
                      0
                    )
                  )}
                />
              </div>
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
