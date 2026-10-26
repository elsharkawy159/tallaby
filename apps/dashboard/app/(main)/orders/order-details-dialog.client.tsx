"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ExternalLink, Info } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CallButton, WhatsAppButton } from "@workspace/ui/components/contact-buttons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { MapsLinkButton } from "@workspace/ui/components/maps-link-button";
import { getPublicUrl, cn } from "@/lib/utils";
import { formatDateTime, formatMoney } from "@/lib/i18n/format";
import { humanizeStatus, translateStatus } from "@/lib/i18n/status";
import { PROGRESS_STEPS, progressIndex } from "./order-flow.lib";
import { OrderActions } from "./order-actions.client";
import { OrderStageBadge } from "./order-stage-badge";
import type { SellerOrderRow } from "./orders.types";

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="break-words text-end font-medium">{value || "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Where the order is on placed → confirmed → out for delivery → delivered.
 * Orders that left that path (cancelled, returned, refunds) show a note instead.
 */
function ProgressTrack({ order }: { order: SellerOrderRow }) {
  const t = useTranslations("orders.progress");
  const locale = useLocale();
  const { stage } = order.flow;
  const current = progressIndex(stage);

  if (current < 0) {
    const at = stage === "cancelled" ? order.cancelledAt : null;
    return (
      <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm">
        <p className="font-medium">{t(`ended.${stage}`)}</p>
        {at && <p className="text-muted-foreground">{formatDateTime(at, locale)}</p>}
      </div>
    );
  }

  const failed = stage === "failed";
  const delivered = stage === "delivered";

  return (
    <ol className="grid grid-cols-4" aria-label={t("label")}>
      {PROGRESS_STEPS.map((step, i) => {
        const done = i < current || (delivered && i === current);
        const active = i === current && !delivered;
        const isFailedStep = failed && i === current;
        const label = isFailedStep ? t("failed") : t(step);
        return (
          <li
            key={step}
            aria-current={active ? "step" : undefined}
            className="relative flex flex-col items-center gap-2 text-center"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-3.5 h-0.5 -translate-y-1/2 end-1/2 w-full -z-0",
                  i <= current ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-7 items-center justify-center rounded-full border-2 bg-background text-xs font-semibold transition-colors",
                done && "border-primary bg-primary text-primary-foreground",
                active && !isFailedStep && "border-primary text-primary ring-4 ring-primary/15",
                isFailedStep && "border-destructive text-destructive ring-4 ring-destructive/15",
                !done && !active && "border-border text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs leading-tight",
                active ? "font-semibold text-foreground" : "text-muted-foreground",
                isFailedStep && "text-destructive",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function FlowNote({ order }: { order: SellerOrderRow }) {
  const t = useTranslations("orders.notes");
  const { flow } = order;
  const note = flow.readOnly
    ? t(`readOnly.${flow.readOnly}`)
    : flow.stage === "awaiting_payment"
      ? t("awaitingPayment")
      : flow.prepaid && (flow.stage === "new" || flow.stage === "to_ship")
        ? t("prepaid")
        : null;
  if (!note) return null;
  return (
    <p className="flex items-start gap-2 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      {note}
    </p>
  );
}

export function OrderDetailsDialog({
  order,
  onClose,
}: {
  order: SellerOrderRow | null;
  onClose: () => void;
}) {
  const t = useTranslations("orders.details");
  const tChannel = useTranslations("orders.channel");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const money = (value: string | number | null | undefined) => formatMoney(value, locale);

  return (
    <Dialog open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <span>{t("title", { number: order.orderNumber })}</span>
                <OrderStageBadge stage={order.flow.stage} />
              </DialogTitle>
              <DialogDescription>
                {t("placedOn", {
                  date: formatDateTime(order.createdAt, locale),
                  channel: order.storeName ?? tChannel("marketplace"),
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
              <ProgressTrack order={order} />
              {order.flow.stage === "failed" && order.failureReason && (
                <p className="text-center text-sm text-destructive">
                  {t("lastAttempt", { reason: order.failureReason })}
                </p>
              )}
              {order.flow.primary && (
                <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <OrderActions order={order} className="flex-wrap" />
                  {order.flow.stage === "to_ship" && (
                    <Link
                      href="/orders/delivery"
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {order.riderName
                        ? t("riderAssigned", { name: order.riderName })
                        : t("useRider")}
                    </Link>
                  )}
                </div>
              )}
              <FlowNote order={order} />
            </div>

            <div className="grid gap-6 md:grid-cols-5">
              <div className="space-y-6 md:col-span-3">
                <Section title={t("items", { count: order.itemCount })}>
                  <ul className="divide-y rounded-lg border">
                    {order.lines.map((line) => (
                      <li key={line.id} className="flex gap-3 p-3">
                        {line.image ? (
                          <Image
                            src={getPublicUrl(line.image, "products")}
                            alt={line.productName}
                            width={56}
                            height={56}
                            className="size-14 shrink-0 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="size-14 shrink-0 rounded-md border bg-muted" />
                        )}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          {line.productUrl ? (
                            <a
                              href={line.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium hover:underline"
                            >
                              <span className="line-clamp-2">{line.productName}</span>
                              <ExternalLink className="size-3.5 shrink-0 opacity-60" />
                            </a>
                          ) : (
                            <span className="line-clamp-2 font-medium">{line.productName}</span>
                          )}
                          {line.variantName && (
                            <div className="text-xs text-muted-foreground">{line.variantName}</div>
                          )}
                          <div className="text-xs text-muted-foreground" dir="auto">
                            {t("itemLine", {
                              quantity: line.quantity,
                              price: money(line.price),
                            })}
                            {line.sku && <span> · {t("sku", { sku: line.sku })}</span>}
                          </div>
                        </div>
                        <div className="shrink-0 text-end text-sm font-medium tabular-nums" dir="ltr">
                          {money(line.total)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section title={t("payment")}>
                  <div className="space-y-2 rounded-lg border p-3">
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
                      value={order.paymentStatus ? translateStatus(tStatus, "payment", order.paymentStatus) : null}
                    />
                    <div className="flex items-baseline justify-between gap-4 border-t pt-2">
                      <span className="text-sm font-semibold">{t("orderTotal")}</span>
                      <span className="text-lg font-bold tabular-nums" dir="ltr">
                        {money(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </Section>

                {(order.notes || order.giftMessage) && (
                  <Section title={t("orderNote")}>
                    <div className="space-y-2 rounded-lg border p-3 text-sm">
                      {order.notes && <p className="whitespace-pre-wrap">{order.notes}</p>}
                      {order.giftMessage && (
                        <p className="whitespace-pre-wrap">
                          <span className="text-muted-foreground">{t("giftMessage")} </span>
                          {order.giftMessage}
                        </p>
                      )}
                    </div>
                  </Section>
                )}
              </div>

              <div className="space-y-6 md:col-span-2">
                <Section title={t("customer")}>
                  <div className="space-y-3 rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{order.customerName || t("guest")}</p>
                      {order.customerPhone && (
                        <p className="text-sm text-muted-foreground" dir="ltr">
                          {order.customerPhone}
                        </p>
                      )}
                      {order.customerEmail && (
                        <p className="break-all text-sm text-muted-foreground">{order.customerEmail}</p>
                      )}
                    </div>
                    {order.customerPhone && (
                      <div className="flex flex-wrap gap-2">
                        <CallButton phone={order.customerPhone} label={t("call")} />
                        <WhatsAppButton
                          phone={order.customerPhone}
                          label={t("whatsapp")}
                          text={t("whatsappText", { number: order.orderNumber })}
                        />
                      </div>
                    )}
                  </div>
                </Section>

                <Section title={t("shippingAddress")}>
                  {order.address ? (
                    <div className="space-y-2 rounded-lg border p-3 text-sm">
                      {order.address.fullName && <p className="font-medium">{order.address.fullName}</p>}
                      {order.address.line && <p>{order.address.line}</p>}
                      {order.address.area && <p className="text-muted-foreground">{order.address.area}</p>}
                      {order.address.instructions && (
                        <p className="rounded-md bg-muted px-2 py-1.5 text-xs">
                          {t("instructions")}: {order.address.instructions}
                        </p>
                      )}
                      <MapsLinkButton
                        latitude={order.address.latitude}
                        longitude={order.address.longitude}
                        type="navigation"
                        label={t("openMap")}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("noAddress")}</p>
                  )}
                </Section>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
