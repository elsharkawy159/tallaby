"use client";

import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatPrice, formatPricePlain } from "@workspace/lib";
import { LIVE_VIEWS_TICK_MS, liveViewsBase, nextLiveViews } from "@/components/product-page/live-views.lib";
import { DealCountdown } from "@/components/storefront/deal-countdown.client";
import { useCurrencyLabel } from "@/lib/currency-label.client";
import type { ProductLocale } from "@/lib/product-translations";
import s from "../storefront.module.css";

/**
 * The store product page's price, stock line and live viewers, in the store's
 * own colours (`--sf-*` tokens). Store-only: the marketplace keeps
 * `PriceTicket`, `ProductStockBadge` and `LiveViews`.
 */

const DANGER = "var(--destructive,#dc2626)";

/** Price 32px, the struck compare price, "Save X", the discount %, free delivery and the deal countdown. */
export function StorePriceBlock({
  price,
  listPrice,
  discountPercent,
  discountEndsAt,
  hasFreeDelivery,
  locale,
}: {
  price: number;
  listPrice: number | null;
  discountPercent: number | null;
  /** A real offer end (the product's or the variant's), still ahead; null for none. */
  discountEndsAt: Date | null;
  hasFreeDelivery: boolean;
  locale: ProductLocale;
}) {
  const t = useTranslations("storeProduct");
  const tProduct = useTranslations("product");
  const currencyLabel = useCurrencyLabel();
  const hasDiscount = listPrice != null && listPrice > price;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <span
          className="text-[32px] font-extrabold leading-none text-(--sf-ink)"
          dangerouslySetInnerHTML={{ __html: formatPrice(price, locale, "lg", currencyLabel) }}
        />
        {hasDiscount && (
          <s
            className="text-base text-(--sf-muted)"
            aria-label={tProduct("insteadOf")}
            dangerouslySetInnerHTML={{ __html: formatPrice(listPrice, locale, "sm", currencyLabel) }}
          />
        )}
        {hasDiscount && (
          <span
            className="self-center rounded-full px-2.5 py-1 text-[13px] font-bold leading-none"
            style={{ color: DANGER, background: `color-mix(in srgb, ${DANGER} 10%, transparent)` }}
          >
            {t("save", { amount: formatPricePlain(listPrice - price, locale, currencyLabel) })}
          </span>
        )}
        {discountPercent != null && (
          <span className="self-center rounded-full bg-(--sf-brand) px-2 py-1 text-xs font-bold leading-none text-(--sf-brand-ink)" dir="ltr">
            {t("discountBadge", { percent: discountPercent })}
          </span>
        )}
      </div>

      {hasFreeDelivery && (
        <p className="flex items-start gap-2 text-sm">
          <Truck className="mt-0.5 size-4 shrink-0 text-(--sf-brand)" aria-hidden />
          <span>
            <span className="font-semibold text-(--sf-ink)">{tProduct("freeDeliveryOnProduct")}</span>{" "}
            <span className="text-(--sf-muted)">{tProduct("freeDeliveryOnProductDescription")}</span>
          </span>
        </p>
      )}

      {/* Known on the server, so the block holds its place until the clock starts. */}
      {hasDiscount && discountEndsAt && <DealCountdown deadline={discountEndsAt.getTime()} placeholder />}
    </div>
  );
}

/** "In stock, ready to ship" / "Only N left" / "Sold out", as a pill. */
export function StoreStockLine({ hasStock, isLowStock, stock }: { hasStock: boolean; isLowStock: boolean; stock: number }) {
  const t = useTranslations("storeProduct");
  // Green, the store's accent, or danger; text mixed toward ink so it reads on light and dark templates.
  const tone = !hasStock ? DANGER : isLowStock ? "var(--sf-sun,#fdad28)" : "#16a34a";
  return (
    <span
      className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-bold"
      style={{
        background: `color-mix(in srgb, ${tone} 13%, transparent)`,
        color: `color-mix(in srgb, ${tone} ${isLowStock && hasStock ? 45 : 80}%, var(--sf-ink))`,
      }}
    >
      <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: tone }} />
      {!hasStock ? t("outOfStock") : isLowStock ? t("lowStock", { count: stock }) : t("inStock")}
    </span>
  );
}

/**
 * "N shoppers are viewing this right now", only when the seller ticked it
 * (the renderer calls it for those products). The number logic is
 * `LiveViews`': drawn after mount (it is random), announced to screen
 * readers once, not on every tick.
 */
export function StoreLiveViews({ productId }: { productId: string }) {
  const t = useTranslations("storeProduct");
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const base = liveViewsBase(productId);
    setCount(base);
    const timer = window.setInterval(() => setCount((current) => nextLiveViews(current ?? base, base, Math.random())), LIVE_VIEWS_TICK_MS);
    return () => window.clearInterval(timer);
  }, [productId]);

  if (count == null) return null;
  return (
    <p className="inline-flex w-fit items-center gap-2.5 rounded-full bg-(--sf-shelf) py-2 ps-4 pe-3.5 text-sm text-(--sf-ink)">
      <span aria-hidden className={s.liveDot} />
      <span>
        {t.rich("liveViews", {
          count,
          // Keyed by the number, so each change replays the bump.
          b: (chunks) => (
            <b key={count} className={s.liveCount}>
              {chunks}
            </b>
          ),
        })}
      </span>
    </p>
  );
}
