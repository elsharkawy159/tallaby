"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ImageIcon, MapPin, Phone } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { getPublicUrl } from "@/lib/utils";
import { formatDateTime, formatMoney } from "@/lib/i18n/format";
import { OrderActions } from "./order-actions.client";
import { OrderStageBadge } from "./order-stage-badge";
import type { SellerOrderRow } from "./orders.types";

/**
 * One order as a card (card view of /orders). The whole card opens the order
 * panel; the next-step button sits at the bottom so a seller can work a queue
 * without opening anything.
 */
export function OrderCard({ order, onOpen }: { order: SellerOrderRow; onOpen: () => void }) {
  const t = useTranslations("orders");
  const tPayment = useTranslations("orders.details.paymentMethods");
  const locale = useLocale();
  const [first] = order.lines;
  const thumbs = order.lines.slice(0, 4);
  const needsYou = order.flow.stage === "new";
  const failed = order.flow.stage === "failed";
  const ended = ["cancelled", "returned", "refund"].includes(order.flow.stage);

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-input hover:shadow-[0_6px_20px_rgba(20,81,99,0.08)]",
        needsYou && "border-primary/40",
        failed && "border-destructive/40",
      )}
    >
      {/* Covers the card so it opens on click; the action buttons sit above it. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={t("details.title", { number: order.orderNumber })}
        className="absolute inset-0 z-0 rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />

      <div className="pointer-events-none relative flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-primary-ink">#{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(order.createdAt, locale)}
              {" · "}
              {order.storeName ?? t("channel.marketplace")}
            </p>
          </div>
          <OrderStageBadge stage={order.flow.stage} className="shrink-0" />
        </div>

        <div className="space-y-1 text-sm">
          <p className="truncate font-medium">{order.customerName || t("guest")}</p>
          {order.address?.area && (
            <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{order.address.area}</span>
            </p>
          )}
          {order.customerPhone && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="size-3.5 shrink-0" aria-hidden="true" />
              <span dir="ltr">{order.customerPhone}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-2.5">
          <div className="flex shrink-0 -space-x-3 rtl:space-x-reverse">
            {thumbs.map((line) =>
              line.image ? (
                <Image
                  key={line.id}
                  src={getPublicUrl(line.image, "products")}
                  alt=""
                  width={40}
                  height={40}
                  className={cn("size-10 rounded-lg border-2 border-card bg-white object-cover", ended && "opacity-60")}
                />
              ) : (
                <span
                  key={line.id}
                  className="grid size-10 place-items-center rounded-lg border-2 border-card bg-muted text-faint"
                >
                  <ImageIcon className="size-4" aria-hidden="true" />
                </span>
              ),
            )}
          </div>
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">{first?.productName}</p>
            <p className="text-xs text-muted-foreground">
              {order.lines.length > 1
                ? t("table.moreItems", { count: order.itemCount })
                : (first?.variantName ?? t("table.qty", { count: order.itemCount }))}
            </p>
          </div>
        </div>

        {failed && order.failureReason && (
          <p className="line-clamp-2 text-xs text-destructive">
            {t("details.lastAttempt", { reason: order.failureReason })}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            <p className="text-[17px] font-extrabold tabular-nums" dir="ltr">
              {formatMoney(order.totalAmount, locale)}
            </p>
            {order.paymentMethod && tPayment.has(order.paymentMethod) && (
              <p className="text-xs text-muted-foreground">{tPayment(order.paymentMethod)}</p>
            )}
          </div>
        </div>
      </div>

      {order.flow.primary && (
        <div className="relative z-10 border-t p-3">
          <OrderActions order={order} compact className="[&>button:first-child]:flex-1" />
        </div>
      )}
    </article>
  );
}
