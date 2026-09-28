"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import { getOrderDetails } from "@/actions/orders";
import { getPublicUrl } from "@/lib/utils";
import { getStorefrontProductUrl } from "@/lib/constants";
import { formatDateTime, formatMoney } from "@/lib/i18n/format";
import { humanizeStatus, translateStatus } from "@/lib/i18n/status";
import {
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

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-end font-medium break-words">{value || "—"}</span>
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
  const t = useTranslations("orders.details");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const money = (value: string | number | null | undefined) =>
    formatMoney(value, locale);
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
        setError(t("loadFailed"));
        return;
      }
      if (!res.data) {
        setError(t("unavailable"));
        return;
      }
      setOrder(res.data);
    });
  }, [orderId, t]);

  const address = order?.userAddress_shippingAddressId;

  return (
    <Dialog open={Boolean(orderId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>{t("title", { number: order?.orderNumber ?? "…" })}</span>
            {order?.status && (
              <Badge variant={orderStatusVariant(order.status)}>
                {translateStatus(tStatus, "order", order.status)}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {order?.createdAt
              ? t("placed", { date: formatDateTime(order.createdAt, locale) })
              : t("loading")}
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
            <Section title={t("customer")}>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {resolveCustomerName(order, t("guest"))}
                  </span>
                  {order.user?.isGuest && <Badge variant="outline">{t("guest")}</Badge>}
                </div>
                <Row label={t("phone")} value={resolveCustomerPhone(order)} />
                <Row label={t("email")} value={resolveCustomerEmail(order)} />
              </div>
            </Section>

            <Section title={t("shippingAddress")}>
              {address ? (
                <div className="space-y-1.5">
                  <Row label={t("name")} value={address.fullName} />
                  <Row label={t("phone")} value={address.phone} />
                  <Row
                    label={t("address")}
                    value={[address.addressLine1, address.addressLine2]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <Row
                    label={t("city")}
                    value={[address.city, address.state, address.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <Row label={t("country")} value={address.country} />
                  {address.deliveryInstructions && (
                    <Row
                      label={t("instructions")}
                      value={address.deliveryInstructions}
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("noAddress")}
                </p>
              )}
            </Section>

            {(order.notes || (order.isGift && order.giftMessage)) && (
              <Section title={t("orderNote")}>
                {order.notes && (
                  <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                )}
                {order.isGift && order.giftMessage && (
                  <p className="text-sm whitespace-pre-wrap">
                    <span className="text-muted-foreground">
                      {t("giftMessage")}{" "}
                    </span>
                    {order.giftMessage}
                  </p>
                )}
              </Section>
            )}

            <Section title={t("items", { count: order.orderItems.length })}>
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
                          {t("itemLine", {
                            sku: item.sku,
                            quantity: item.quantity,
                            price: money(item.price),
                          })}
                        </div>
                        {item.status && (
                          <Badge
                            variant={orderStatusVariant(item.status)}
                            className="text-[10px]"
                          >
                            {translateStatus(tStatus, "order", item.status)}
                          </Badge>
                        )}
                      </div>

                      <div className="text-end text-sm font-medium shrink-0">
                        {money(item.total)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Section>

            <Section title={t("summary")}>
              <div className="space-y-1.5">
                <Row
                  label={t("paymentMethod")}
                  value={
                    order.paymentMethod
                      ? t.has(`paymentMethods.${order.paymentMethod}`)
                        ? t(`paymentMethods.${order.paymentMethod}`)
                        : humanizeStatus(order.paymentMethod)
                      : null
                  }
                />
                <Row
                  label={t("paymentStatus")}
                  value={
                    order.paymentStatus
                      ? translateStatus(tStatus, "payment", order.paymentStatus)
                      : null
                  }
                />
                <Separator className="my-2" />
                <Row label={t("orderTotal")} value={money(order.totalAmount)} />
                <Row
                  label={t("yourItemsTotal")}
                  value={money(
                    order.orderItems.reduce(
                      (sum, item) => sum + (parseFloat(item.total) || 0),
                      0
                    )
                  )}
                />
                <Row
                  label={t("yourEarnings")}
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
