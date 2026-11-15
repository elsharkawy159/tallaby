"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Clock, ImageIcon, MapPin, MessageCircle, Phone } from "lucide-react";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { buildTelUrl, buildWhatsAppUrl } from "@workspace/ui/lib/contact";
import { SellerButton } from "@/components/seller-ui";
import { cn, getPublicUrl } from "@/lib/utils";
import { formatDateTime, moneyDir } from "@/lib/i18n/format";
import { Money } from "@/components/money";
import { BostaChip, canShipWithBosta, ShipWithBostaButton } from "./bosta-ship.client";
import { OrderActions } from "./order-actions.client";
import { OrderRiskBadges } from "./order-risk.client";
import { OrderStageBadge } from "./order-stage-badge";
import type { SellerOrderRow } from "./orders.types";
import { PhoneText } from "./orders-ui";
import { canExportForWassalha, WassalhaExportButton } from "./wassalha-export.client";

/**
 * One order as a card (card view of /orders, and the list on every phone). The
 * whole card opens the order panel; the next-step button sits at the bottom so a
 * seller can work a queue without opening anything.
 */
export function OrderCard({
  order,
  onOpen,
  selected = false,
  onSelectedChange,
}: {
  order: SellerOrderRow;
  onOpen: () => void;
  /** Bulk selection (F-04c); no checkbox without onSelectedChange. */
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
}) {
  const t = useTranslations("orders");
  const tPayment = useTranslations("orders.details.paymentMethods");
  const locale = useLocale();
  const [first] = order.lines;
  const thumbs = order.lines.slice(0, 4);
  const failed = order.flow.stage === "failed";
  const ended = ["cancelled", "returned", "refund"].includes(order.flow.stage);
  const askUrl = order.confirmMessage ? buildWhatsAppUrl(order.customerPhone, order.confirmMessage) : null;
  const telUrl = buildTelUrl(order.customerPhone);

  return (
    <article
      className={cn(
        "group relative flex min-w-0 flex-col rounded-[24px] border border-(--s-line) bg-(--s-glass) text-(--s-body) shadow-(--s-shadow-card) transition-[border-color,box-shadow] duration-150 hover:shadow-(--s-shadow-hover) max-[600px]:rounded-[20px]",
        order.unconfirmedHours != null && "border-accent/70",
        failed && "border-destructive/40",
        selected && "border-(--s-primary) shadow-[0_0_0_3px_var(--s-focus-soft)]",
      )}
    >
      {/* Covers the card so it opens on click; everything that acts sits above it. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={t("details.title", { number: order.orderNumber })}
        className="absolute inset-0 z-0 cursor-pointer rounded-[inherit] focus-visible:outline-offset-[-3px]"
      />

      <div className="pointer-events-none relative flex flex-1 flex-col gap-3 p-4 max-[600px]:p-3.5">
        <div className="flex items-start gap-2">
          {onSelectedChange && (
            <label className="pointer-events-auto -my-2.5 -ms-2.5 grid size-10 shrink-0 cursor-pointer place-items-center">
              <Checkbox
                checked={selected}
                onCheckedChange={(value) => onSelectedChange(value === true)}
                aria-label={t("bulk.selectOrder", { number: order.orderNumber })}
                className="size-5"
              />
            </label>
          )}
          <div className="me-auto min-w-0">
            <p className="flex flex-wrap items-center gap-1.5 font-montserrat text-sm font-bold text-(--s-ink)">
              <bdi dir="ltr">#{order.orderNumber}</bdi>
              {order.isTest && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-sans text-[11px] font-semibold text-amber-900 dark:bg-amber-400/20 dark:text-amber-200">
                  {t("testBadge")}
                </span>
              )}
            </p>
            <p className="text-xs text-(--s-subtle)">{formatDateTime(order.createdAt, locale)}</p>
            <p className="break-words text-xs text-(--s-subtle)">{order.storeName ?? t("channel.marketplace")}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <OrderStageBadge stage={order.flow.stage} />
            <BostaChip order={order} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="break-words text-sm font-bold text-(--s-text)">{order.customerName || t("guest")}</p>
          <OrderRiskBadges order={order} />
          {order.address?.area && (
            <p className="flex items-start gap-1.5 text-xs text-(--s-subtle)">
              <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">{order.address.area}</span>
            </p>
          )}
          {order.customerPhone &&
            (telUrl ? (
              <a
                href={telUrl}
                className="pointer-events-auto relative z-10 flex w-fit items-center gap-1.5 text-xs text-(--s-subtle) hover:text-(--s-ink) max-[600px]:min-h-10"
              >
                <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                <PhoneText phone={order.customerPhone} />
              </a>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-(--s-subtle)">
                <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                <PhoneText phone={order.customerPhone} />
              </p>
            ))}
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-(--s-tint) p-2.5">
          <div className="flex shrink-0 -space-x-3 rtl:space-x-reverse">
            {thumbs.map((line) =>
              line.image ? (
                <Image
                  key={line.id}
                  src={getPublicUrl(line.image, "products")}
                  alt=""
                  width={40}
                  height={40}
                  className={cn("size-10 rounded-xl border-2 border-(--s-surface) bg-white object-cover", ended && "opacity-60")}
                />
              ) : (
                <span
                  key={line.id}
                  className="grid size-10 place-items-center rounded-xl border-2 border-(--s-surface) bg-(--s-fill) text-(--s-faint)"
                >
                  <ImageIcon className="size-4" aria-hidden="true" />
                </span>
              ),
            )}
          </div>
          <div className="min-w-0 text-[13px]">
            <p className="line-clamp-2 break-words font-semibold text-(--s-text)">{first?.productName}</p>
            <p className="text-xs text-(--s-subtle)">
              {order.lines.length > 1
                ? t("table.moreItems", { count: order.itemCount })
                : (first?.variantName ?? t("table.qty", { count: order.itemCount }))}
            </p>
          </div>
        </div>

        {order.unconfirmedHours != null && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-accent-ink">
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            {t("details.unconfirmedFor", { hours: order.unconfirmedHours })}
          </p>
        )}

        {failed && order.failureReason && (
          <p className="line-clamp-2 break-words text-xs text-destructive">
            {t("details.lastAttempt", { reason: order.failureReason })}
          </p>
        )}

        <div className="mt-auto pt-1">
          <p className="break-words font-montserrat text-[17px] font-extrabold text-(--s-ink) tabular-nums" dir={moneyDir(locale, order)}>
            <bdi>
              <Money value={order.totalAmount} locale={locale} unit={order} />
            </bdi>
          </p>
          {order.paymentMethod && tPayment.has(order.paymentMethod) && (
            <p className="text-xs text-(--s-subtle)">{tPayment(order.paymentMethod)}</p>
          )}
        </div>
      </div>

      {(order.flow.primary || order.flow.corrections.length > 0 || canShipWithBosta(order) || canExportForWassalha(order)) && (
        <div className="relative z-10 flex flex-wrap gap-1.5 border-t border-(--s-line-soft) p-3">
          <OrderActions order={order} compact className="min-w-0 flex-[1_1_auto]" />
          <ShipWithBostaButton order={order} className="flex-1" />
          {order.storeId && <WassalhaExportButton storeId={order.storeId} orders={[order]} className="flex-1" />}
          {askUrl && (
            <SellerButton asChild variant="outline" size="sm" className="flex-1">
              <a href={askUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="text-(--s-whatsapp)" aria-hidden />
                {t("details.askToConfirm")}
              </a>
            </SellerButton>
          )}
        </div>
      )}
    </article>
  );
}
