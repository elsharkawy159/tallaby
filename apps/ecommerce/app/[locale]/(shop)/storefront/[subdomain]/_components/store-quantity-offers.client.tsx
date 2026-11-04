"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatPricePlain } from "@workspace/lib";
import { pickQuantityTier, quantityOfferUnitDiscountPiastres } from "@workspace/lib/orders/quantity-offers";
import { getQuantityTiers, type QuantityTierCard } from "@/actions/cart-offers";
import { useCurrencyLabel } from "@/lib/currency-label.client";
import { cn } from "@/lib/utils";

/**
 * Quantity offers on the store's product page (ROADMAP.md F-07c): picking a row
 * sets the buy box's quantity. Nothing shows without a tier. The prices are a
 * preview: checkout works the discount out again on the server.
 */
export function StoreQuantityOffers({
  productId,
  price,
  stock,
  quantity,
  readOnly,
  onSelect,
}: {
  productId: string;
  /** The selected variant's price, else the product's, in EGP. */
  price: number;
  /** Infinity for an unlimited product. */
  stock: number;
  quantity: number;
  /** Already in the cart: the count is changed there. */
  readOnly: boolean;
  onSelect: (quantity: number) => void;
}) {
  const t = useTranslations("storeProduct.quantityOffers");
  const locale = useLocale();
  const currencyLabel = useCurrencyLabel();
  const [tiers, setTiers] = useState<QuantityTierCard[]>([]);

  useEffect(() => {
    let stale = false;
    getQuantityTiers(productId).then((rows) => {
      if (!stale) setTiers(rows);
    });
    return () => {
      stale = true;
    };
  }, [productId]);

  const unit = Math.round(price * 100);
  const visible = tiers.filter((tier) => tier.minQuantity <= stock);
  if (visible.length === 0 || stock < 1) return null;

  const active = pickQuantityTier(visible.map((tier) => ({ ...tier, isActive: true })), quantity);
  const money = (piastres: number) => formatPricePlain(piastres / 100, locale, currencyLabel);
  const rows = [
    { minQuantity: 1, unitPiastres: unit, saving: null as string | null },
    ...visible.map((tier) => ({
      minQuantity: tier.minQuantity,
      unitPiastres: unit - quantityOfferUnitDiscountPiastres(unit, tier.discountType, tier.discountValue),
      saving:
        tier.discountType === "percent"
          ? t("percentOff", { value: tier.discountValue })
          : t("amountOff", { value: money(Math.round(tier.discountValue * 100)) }),
    })),
  ];

  return (
    <div role="group" aria-label={t("title")} className="mb-3 grid gap-2">
      <p className="text-sm font-semibold text-(--sf-ink)">{t("title")}</p>
      {rows.map((row) => {
        const selected = (active?.minQuantity ?? 1) === row.minQuantity;
        return (
          <button
            key={row.minQuantity}
            type="button"
            aria-pressed={selected}
            disabled={readOnly}
            onClick={() => onSelect(row.minQuantity)}
            className={cn(
              "flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border-[1.5px] px-3.5 py-2 text-start transition-colors motion-reduce:transition-none",
              selected ? "border-(--sf-brand) bg-[color-mix(in_srgb,var(--sf-brand)_8%,transparent)]" : "border-(--sf-line)",
              readOnly && "cursor-default",
            )}
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-(--sf-ink)">{t("buy", { count: row.minQuantity })}</span>
              {row.saving && <span className="block text-xs font-medium text-(--sf-brand)">{row.saving}</span>}
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums text-(--sf-ink)">{t("each", { price: money(row.unitPiastres) })}</span>
          </button>
        );
      })}
      {readOnly && <p className="text-xs text-(--sf-muted)">{t("changeInCart")}</p>}
    </div>
  );
}
