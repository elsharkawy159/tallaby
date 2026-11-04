"use client";

import { useState, useTransition } from "react";
import { Gift, Ticket } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatPricePlain } from "@workspace/lib";
import { Button } from "@workspace/ui/components/button";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { chooseFreeGift, type CartCouponCard, type CartGiftChoice, type CartOffersView } from "@/actions/cart-offers";
import { applyCouponToCart, removeCouponFromCart } from "@/actions/coupons";
import { useCurrencyLabel } from "@/lib/currency-label.client";
import { useCart } from "@/providers/cart-provider";

/**
 * The coupons and free gifts on offer in a store's cart (ROADMAP.md F-13c). Applying
 * a coupon keeps it for checkout, which validates it again; a gift is checked on the
 * server here and again when the order is placed. Nothing shows when there is nothing.
 */
export function CartOffers({ view, onChange }: { view: CartOffersView; onChange: () => void }) {
  const t = useTranslations("storefront.cartOffers");
  const locale = useLocale();
  const currencyLabel = useCurrencyLabel();
  const money = (piastres: number) => formatPricePlain(piastres / 100, locale, currencyLabel);
  if (view.coupons.length === 0 && view.gifts.length === 0 && !view.nextGift) return null;

  return (
    <div className="space-y-3 border-t border-(--sf-line) py-3">
      {view.nextGift && (
        <p className="flex items-center gap-2 text-sm text-(--sf-muted)">
          <Gift className="size-4 shrink-0 text-(--sf-brand)" aria-hidden />
          {t("giftAddMore", { amount: money(view.nextGift.shortPiastres), name: view.nextGift.ruleName })}
        </p>
      )}
      {view.gifts.map((gift) => (
        <GiftChoice key={gift.ruleId} gift={gift} onChange={onChange} />
      ))}
      {view.coupons.length > 0 && (
        <section aria-label={t("couponsTitle")}>
          <h2 className="mb-2 text-sm font-semibold">{t("couponsTitle")}</h2>
          <ul className="space-y-2">
            {view.coupons.map((coupon) => (
              <CouponRow key={coupon.code} coupon={coupon} applied={coupon.code.toUpperCase() === view.appliedCouponCode?.toUpperCase()} onChange={onChange} money={money} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CouponRow({ coupon, applied, onChange, money }: { coupon: CartCouponCard; applied: boolean; onChange: () => void; money: (piastres: number) => string }) {
  const t = useTranslations("storefront.cartOffers");
  const [pending, startTransition] = useTransition();
  const value =
    coupon.discountType === "percentage"
      ? t("percentOff", { value: coupon.discountValue })
      : coupon.discountType === "free_shipping"
        ? t("freeShipping")
        : t("amountOff", { value: money(Math.round(coupon.discountValue * 100)) });

  const toggle = () =>
    startTransition(async () => {
      const result = applied ? await removeCouponFromCart() : await applyCouponToCart({ code: coupon.code });
      if (result.success) {
        toast.success(t(applied ? "couponRemoved" : "couponApplied"));
        onChange();
      } else {
        toast.error(t("couponFailed"));
      }
    });

  return (
    <li className="flex items-center gap-3 rounded-xl border border-dashed border-(--sf-line) p-2.5">
      <Ticket className="size-4 shrink-0 text-(--sf-brand)" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          <span dir="ltr" className="font-mono">{coupon.code}</span> · {value}
        </p>
        {coupon.minimumPurchase !== null && <p className="text-xs text-(--sf-muted)">{t("minimum", { amount: money(Math.round(coupon.minimumPurchase * 100)) })}</p>}
      </div>
      <Button type="button" size="sm" variant="outline" disabled={pending || (!coupon.usable && !applied)} onClick={toggle}>
        {t(applied ? "remove" : "apply")}
      </Button>
    </li>
  );
}

function GiftChoice({ gift, onChange }: { gift: CartGiftChoice; onChange: () => void }) {
  const t = useTranslations("storefront.cartOffers");
  const { refreshCart } = useCart();
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const choose = (productId: string, variantId: string | undefined) =>
    startTransition(async () => {
      const result = await chooseFreeGift({ ruleId: gift.ruleId, productId, variantId });
      if (result.success) {
        toast.success(t("giftAdded"));
        await refreshCart();
        onChange();
      } else {
        toast.error(t("giftFailed"));
      }
    });

  return (
    <section aria-label={t("giftTitle", { name: gift.ruleName })}>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Gift className="size-4 text-(--sf-brand)" aria-hidden />
        {t("giftTitle", { name: gift.ruleName })}
      </h2>
      <ul className="space-y-2.5">
        {gift.products.map((product) => {
          const chosen = gift.chosenProductId === product.id;
          const variantId = variants[product.id] ?? product.variants[0]?.id;
          return (
            <li key={product.id} className="flex items-center gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-(--sf-shelf)">
                <ImageWithFallback src={product.image ?? ""} alt="" fill sizes="56px" className="object-contain p-1" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium">{product.title}</p>
                {product.variants.length > 1 && (
                  <select
                    aria-label={t("chooseOption")}
                    className="mt-1 h-8 max-w-full rounded-md border border-(--sf-line) bg-transparent px-1.5 text-xs"
                    value={variantId}
                    onChange={(event) => setVariants((current) => ({ ...current, [product.id]: event.target.value }))}
                  >
                    {product.variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <Button type="button" size="sm" variant={chosen ? "secondary" : "outline"} disabled={pending || chosen} onClick={() => choose(product.id, variantId)}>
                {t(chosen ? "giftChosen" : "giftChoose")}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
