"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Clock, ExternalLink, MessageCircle, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@workspace/ui/components/dialog";
import { buildTelUrl, buildWhatsAppUrl } from "@workspace/ui/lib/contact";
import { MapsLinkButton } from "@workspace/ui/components/maps-link-button";
import { Note, SellerButton } from "@/components/seller-ui";
import { getPublicUrl, cn } from "@/lib/utils";
import { formatDateTime, formatMoney, moneyDir } from "@/lib/i18n/format";
import { Money } from "@/components/money";
import { humanizeStatus, translateStatus } from "@/lib/i18n/status";
import { BlockCustomerButton } from "./block-customer.client";
import { BostaDeliveryCard, canShipWithBosta, ShipWithBostaButton } from "./bosta-ship.client";
import { PROGRESS_STEPS, progressIndex } from "./order-flow.lib";
import { OrderActions } from "./order-actions.client";
import { OrderRiskNote } from "./order-risk.client";
import { OrderStageBadge } from "./order-stage-badge";
import { OrderPaymentProof } from "./payment-proof.client";
import type { SellerOrderRow } from "./orders.types";
import { DetailRow, DIALOG_CLOSE_40, PanelSection, PhoneText } from "./orders-ui";
import { PrintOrdersButton } from "./print-orders-button.client";
import { canExportForWassalha, WassalhaExportButton } from "./wassalha-export.client";
import { WassalhaTrackingCard } from "./wassalha-tracking.client";

const BOX = "rounded-2xl border border-(--s-line) p-3.5";

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
      <div className="rounded-2xl border border-dashed border-(--s-field-strong) px-4 py-3 text-[13px]">
        <p className="font-semibold text-(--s-text)">{t(`ended.${stage}`)}</p>
        {at && <p className="text-(--s-subtle)">{formatDateTime(at, locale)}</p>}
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
                  "absolute end-1/2 top-3.5 h-0.5 w-full -translate-y-1/2",
                  i <= current ? "bg-(--s-primary)" : "bg-(--s-line)",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-7 items-center justify-center rounded-full border-2 bg-(--s-surface) font-montserrat text-xs font-bold transition-colors",
                done && "border-(--s-primary) bg-(--s-primary) text-(--s-solid-fg)",
                active && !isFailedStep && "border-(--s-primary) text-(--s-primary) shadow-[0_0_0_4px_var(--s-focus-soft)]",
                isFailedStep && "border-destructive text-destructive",
                !done && !active && "border-(--s-field) text-(--s-subtle)",
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs leading-tight",
                active ? "font-bold text-(--s-ink)" : "text-(--s-subtle)",
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
    : flow.carrierManaged
      ? t("carrierManaged")
      : flow.stage === "awaiting_payment"
      ? t("awaitingPayment")
      : flow.prepaid && (flow.stage === "new" || flow.stage === "to_ship")
        ? t("prepaid")
        : null;
  if (!note) return null;
  return <Note>{note}</Note>;
}

/** Call and WhatsApp for one customer: the phone number is the seller's main tool. */
function ContactButtons({ phone, whatsappText }: { phone: string; whatsappText: string }) {
  const t = useTranslations("orders.details");
  const tel = buildTelUrl(phone);
  const whatsapp = buildWhatsAppUrl(phone, whatsappText);
  return (
    <div className="flex flex-wrap gap-2">
      {whatsapp && (
        <SellerButton asChild variant="whatsapp" size="sm" className="flex-1">
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden />
            {t("whatsapp")}
          </a>
        </SellerButton>
      )}
      {tel && (
        <SellerButton asChild variant="outline" size="sm" className="flex-1">
          <a href={tel}>
            <Phone aria-hidden />
            {t("call")}
          </a>
        </SellerButton>
      )}
    </div>
  );
}

/**
 * The order's page: a dialog over the list, a bottom sheet on a phone. Header and
 * next step stay put while the middle scrolls, so the next step is always one tap.
 */
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
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const unit = { currency: order?.currency };
  const askUrl = order?.confirmMessage ? buildWhatsAppUrl(order.customerPhone, order.confirmMessage) : null;
  const hasActions = order
    ? Boolean(order.flow.primary || order.flow.corrections.length > 0 || canShipWithBosta(order) || canExportForWassalha(order))
    : false;

  return (
    <Dialog open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        closeLabel={tCommon("close")}
        style={{ maxWidth: 880, padding: 0 }}
        className={cn("flex max-h-[90dvh] flex-col gap-0 overflow-hidden", DIALOG_CLOSE_40)}
        // Focus the panel, not Print: its focus ring would read as the panel's main action.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement).focus();
        }}
      >
        {order && (
          <>
            <header className="shrink-0 border-b border-(--s-line-soft) px-6 py-4 pe-14 max-[720px]:px-[18px] max-[720px]:pe-12">
              <DialogTitle className="flex flex-wrap items-center gap-2 text-lg font-bold leading-normal text-(--s-ink)">
                <span className="font-montserrat">{t("title", { number: order.orderNumber })}</span>
                <OrderStageBadge stage={order.flow.stage} />
              </DialogTitle>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                <DialogDescription className="min-w-0 flex-1 basis-56 text-[13px] text-(--s-muted)">
                  {t("placedOn", {
                    date: formatDateTime(order.createdAt, locale),
                    channel: order.storeName ?? tChannel("marketplace"),
                  })}
                </DialogDescription>
                <PrintOrdersButton orderIds={[order.id]} size="xs" />
              </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5 max-[720px]:px-[18px] max-[720px]:py-4">
              <div className="flex flex-col gap-3 rounded-[20px] bg-(--s-tint) p-4">
                <ProgressTrack order={order} />
                {order.flow.stage === "failed" && order.failureReason && (
                  <p className="break-words text-center text-[13px] font-medium text-destructive">
                    {t("lastAttempt", { reason: order.failureReason })}
                  </p>
                )}
                {hasActions && order.flow.stage === "to_ship" && !order.bostaConnected && !order.wassalhaConnected && (
                  <Link
                    href="/orders/delivery"
                    className="mx-auto inline-flex items-center text-xs font-semibold text-(--s-link) underline-offset-4 hover:underline max-[600px]:min-h-10"
                  >
                    {order.riderName ? t("riderAssigned", { name: order.riderName }) : t("useRider")}
                  </Link>
                )}
              </div>

              {order.unconfirmedHours != null && (
                <Note tone="amber" icon={Clock}>
                  {t("unconfirmedFor", { hours: order.unconfirmedHours })}
                </Note>
              )}
              <OrderRiskNote order={order} />
              <FlowNote order={order} />
              <BostaDeliveryCard order={order} />
              <WassalhaTrackingCard order={order} />

              <div className="grid grid-cols-5 items-start gap-5 max-[760px]:grid-cols-1">
                <div className="col-span-3 flex min-w-0 flex-col gap-5 max-[760px]:col-span-1">
                  <PanelSection title={t("items", { count: order.itemCount })}>
                    <ul className="divide-y divide-(--s-line-soft) rounded-2xl border border-(--s-line)">
                      {order.lines.map((line) => (
                        <li key={line.id} className="flex gap-3 p-3">
                          {line.image ? (
                            <Image
                              src={getPublicUrl(line.image, "products")}
                              alt={line.productName}
                              width={56}
                              height={56}
                              className="size-14 shrink-0 rounded-xl border border-(--s-line) object-cover"
                            />
                          ) : (
                            <div className="size-14 shrink-0 rounded-xl border border-(--s-line) bg-(--s-fill)" />
                          )}
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            {line.productUrl ? (
                              <a
                                href={line.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-start gap-1 text-[13.5px] font-semibold text-(--s-text) hover:underline"
                              >
                                <span className="line-clamp-2 break-words">{line.productName}</span>
                                <ExternalLink className="mt-1 size-3.5 shrink-0 opacity-60" aria-hidden />
                              </a>
                            ) : (
                              <span className="line-clamp-2 break-words text-[13.5px] font-semibold text-(--s-text)">{line.productName}</span>
                            )}
                            {line.variantName && <div className="text-xs text-(--s-subtle)">{line.variantName}</div>}
                            <div className="break-words text-xs text-(--s-subtle)" dir="auto">
                              {t("itemLine", {
                                quantity: line.quantity,
                                price: formatMoney(line.price, locale, unit),
                              })}
                              {line.sku && <span> ({t("sku", { sku: line.sku })})</span>}
                            </div>
                          </div>
                          <div className="shrink-0 text-end font-montserrat text-[13px] font-bold text-(--s-ink) tabular-nums" dir={moneyDir(locale, unit)}>
                            <Money value={line.total} locale={locale} unit={unit} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </PanelSection>

                  <PanelSection title={t("payment")}>
                    <div className={cn(BOX, "flex flex-col gap-2")}>
                      {order.isManual && <DetailRow label={t("source")} value={t("sourceManual")} />}
                      {order.isTest && <DetailRow label={t("source")} value={t("sourceTest")} />}
                      <DetailRow
                        label={t("paymentMethod")}
                        value={
                          order.paymentMethod
                            ? t.has(`paymentMethods.${order.paymentMethod}`)
                              ? t(`paymentMethods.${order.paymentMethod}`)
                              : humanizeStatus(order.paymentMethod)
                            : null
                        }
                      />
                      <DetailRow
                        label={t("paymentStatus")}
                        value={order.paymentStatus ? translateStatus(tStatus, "payment", order.paymentStatus) : null}
                      />
                      <OrderPaymentProof orderId={order.id} />
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-t border-(--s-line-soft) pt-2">
                        <span className="text-[13px] font-bold text-(--s-text)">{t("orderTotal")}</span>
                        <span className="break-words font-montserrat text-lg font-bold text-(--s-ink) tabular-nums" dir={moneyDir(locale, unit)}>
                          <Money value={order.totalAmount} locale={locale} unit={unit} />
                        </span>
                      </div>
                    </div>
                  </PanelSection>

                  {(order.notes || order.giftMessage) && (
                    <PanelSection title={t("orderNote")}>
                      <div className={cn(BOX, "flex flex-col gap-2 text-[13px] text-(--s-body)")}>
                        {order.notes && <p className="whitespace-pre-wrap break-words">{order.notes}</p>}
                        {order.giftMessage && (
                          <p className="whitespace-pre-wrap break-words">
                            <span className="text-(--s-subtle)">{t("giftMessage")} </span>
                            {order.giftMessage}
                          </p>
                        )}
                      </div>
                    </PanelSection>
                  )}
                </div>

                {/* On a phone the customer comes first: calling them is the usual next step. */}
                <div className="col-span-2 flex min-w-0 flex-col gap-5 max-[760px]:order-first max-[760px]:col-span-1">
                  <PanelSection title={t("customer")}>
                    <div className={cn(BOX, "flex flex-col gap-3")}>
                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold text-(--s-text)">{order.customerName || t("guest")}</p>
                        {order.customerPhone && (
                          <p className="text-[13px] text-(--s-muted)">
                            <PhoneText phone={order.customerPhone} />
                          </p>
                        )}
                        {order.customerEmail && <p className="break-all text-[13px] text-(--s-muted)">{order.customerEmail}</p>}
                      </div>
                      {order.customerPhone && (
                        <ContactButtons phone={order.customerPhone} whatsappText={t("whatsappText", { number: order.orderNumber })} />
                      )}
                      <BlockCustomerButton key={`${order.id}:${order.customerBlocked}`} order={order} />
                    </div>
                  </PanelSection>

                  <PanelSection title={t("shippingAddress")}>
                    {order.address ? (
                      <div className={cn(BOX, "flex flex-col items-start gap-2 text-[13px] text-(--s-body)")}>
                        {order.address.fullName && <p className="break-words font-semibold text-(--s-text)">{order.address.fullName}</p>}
                        {order.address.line && <p className="break-words">{order.address.line}</p>}
                        {order.address.area && <p className="break-words text-(--s-subtle)">{order.address.area}</p>}
                        {order.address.instructions && (
                          <p className="w-full break-words rounded-xl bg-(--s-tint) px-2.5 py-1.5 text-xs">
                            {t("instructions")}: {order.address.instructions}
                          </p>
                        )}
                        <MapsLinkButton
                          latitude={order.address.latitude}
                          longitude={order.address.longitude}
                          type="navigation"
                          label={t("openMap")}
                          className="max-[600px]:h-10"
                        />
                      </div>
                    ) : (
                      <p className="text-[13px] text-(--s-subtle)">{t("noAddress")}</p>
                    )}
                  </PanelSection>
                </div>
              </div>
            </div>

            {hasActions && (
              <footer className="shrink-0 border-t border-(--s-line-soft) bg-(--s-surface) px-6 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] max-[720px]:px-[18px]">
                <div className="flex flex-wrap items-center gap-2">
                  <OrderActions order={order} className="flex-1" />
                  <ShipWithBostaButton order={order} className="max-[720px]:flex-1" />
                  {order.storeId && <WassalhaExportButton storeId={order.storeId} orders={[order]} className="max-[720px]:flex-1" />}
                  {askUrl && (
                    <SellerButton asChild variant="outline" size="sm" className="max-[720px]:flex-1">
                      <a href={askUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="text-(--s-whatsapp)" aria-hidden />
                        {t("askToConfirm")}
                      </a>
                    </SellerButton>
                  )}
                </div>
              </footer>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
