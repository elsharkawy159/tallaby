"use client";

import { useEffect, useState } from "react";
import { CrossSellOffers } from "@/components/storefront/cross-sell-offers.client";
import { CartOffers } from "@/components/storefront/cart-offers.client";
import { getCartOffers, type CartOffersView } from "@/actions/cart-offers";
import { Trash2 } from "lucide-react";
import { useCurrencyLabel } from "@/lib/currency-label.client";
import { ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatPriceMarked } from "@workspace/lib";
import { PriceText } from "@/components/storefront/price-text";
import { checkMinOrder, itemsSubtotalPiastres, type StoreMinOrder } from "@workspace/lib/stores/min-order";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Link } from "@/i18n/navigation";
import { QuantitySelector } from "@/components/product";
import { cartItemMinimum } from "@/lib/cart-min-order.lib";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { cn, resolvePrimaryImage } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";
import { STORE_SOLID_BUTTON } from "./store-buttons.lib";

/**
 * This storefront's cart: the cart actions are scoped by host, so on a store
 * subdomain `useCart` only ever sees this seller's cart.
 */
export function StorefrontCart({
  storeName,
  minOrder = null,
  onNavigate,
}: {
  storeName: string;
  /** The store's minimum order (F-13b); below it checkout is disabled with "add X more". */
  minOrder?: StoreMinOrder | null;
  /** Called when a link inside is followed, so a sheet can close itself. */
  onNavigate?: () => void;
}) {
  const t = useTranslations("storefront");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const currencyLabel = useCurrencyLabel();
  const { cartItems, loading, refreshCart, removeFromCart } = useCart();
  const items = cartItems.filter((item) => !item.savedForLater);
  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  // The store's minimum order (F-13b): items subtotal before shipping and coupons, in piastres.
  const minOrderCheck = checkMinOrder(minOrder, itemsSubtotalPiastres(items));
  // The offers on these lines (F-07, F-32), priced on the server like the order.
  const [offers, setOffers] = useState<CartOffersView>({ lines: {}, totalPiastres: 0, coupons: [], appliedCouponCode: null, gifts: [], nextGift: null, removedGifts: false });
  const [offersRevision, setOffersRevision] = useState(0);
  const offersKey = items.map((item) => `${item.id}:${item.quantity}`).join(",");
  useEffect(() => {
    if (!offersKey) return;
    let stale = false;
    getCartOffers().then((view) => {
      if (stale) return;
      setOffers(view);
      // A gift line this cart no longer earns was just taken out on the server.
      if (view.removedGifts) void refreshCart();
    });
    return () => {
      stale = true;
    };
  }, [offersKey, offersRevision, refreshCart]);

  if (loading) {
    return (
      <div className="space-y-4 p-1" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-20 rounded-xl" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-14 text-center">
        <span className="mb-4 grid size-16 place-items-center rounded-full bg-(--sf-shelf) text-(--sf-brand)">
          <ShoppingBag className="size-7" aria-hidden />
        </span>
        <p className="text-lg font-semibold">{t("cartEmpty")}</p>
        <p className="mt-1 max-w-xs text-sm text-(--sf-muted)">
          {t("cartEmptyHint", { store: storeName })}
        </p>
        <Button asChild className={cn("mt-6 h-11 rounded-full px-6", STORE_SOLID_BUTTON)}>
          <Link href="/" onClick={onNavigate}>
            {t("browseProducts")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="-mx-1 flex-1 divide-y divide-(--sf-line) overflow-y-auto px-1">
        {items.map((item) => {
          const variantTitle = (item.variant as { title?: string } | null)?.title;
          // No cap on an unlimited product (0138, F-51).
          const cartProduct = item.product as { quantity?: number | string; trackStock?: boolean | null };
          const stock = cartProduct.trackStock === false ? undefined : cartProduct.quantity;
          return (
            <li key={item.id} className="flex gap-3 py-4">
              <Link
                href={`/products/${item.product.slug}`}
                onClick={onNavigate}
                className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-(--sf-shelf)"
              >
                <ImageWithFallback
                  src={resolvePrimaryImage(item.product.images)}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-contain p-1.5 mix-blend-multiply"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link
                  href={`/products/${item.product.slug}`}
                  onClick={onNavigate}
                  className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
                >
                  {item.product.title}
                </Link>
                {variantTitle && (
                  <p className="text-xs text-(--sf-muted)">
                    {t("variant", { name: variantTitle })}
                  </p>
                )}
                {cartItemMinimum(item) != null && (
                  <p className="text-xs text-(--sf-muted)">{tCommon("minOrderLine", { count: cartItemMinimum(item)! })}</p>
                )}
                {offers.lines[item.id] && (
                  <p className="text-xs font-medium text-(--sf-brand)">
                    <PriceText locale={locale}>{t(
                      offers.lines[item.id]!.kind === "automatic_discount"
                        ? "automaticSaving"
                        : offers.lines[item.id]!.kind === "quantity_offer"
                          ? "quantityOfferSaving"
                          : "bundleOfferSaving",
                      {
                        name: offers.lines[item.id]!.label ?? "",
                        amount: formatPriceMarked(offers.lines[item.id]!.discountPiastres / 100, locale, currencyLabel),
                      },
                    )}</PriceText>
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  {item.giftRuleId ? (
                    <button
                      type="button"
                      aria-label={t("removeGift")}
                      className="grid size-9 place-items-center rounded-full text-(--sf-muted) hover:text-(--sf-ink)"
                      onClick={() => void removeFromCart(item.id)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  ) : (
                    <QuantitySelector
                      size="sm"
                      cartItemId={item.id}
                      initialQuantity={item.quantity}
                      productStock={stock}
                    />
                  )}
                  <span className="text-sm font-semibold tabular-nums">
                    {item.giftRuleId
                      ? t("freeGift")
                      : <PriceText locale={locale}>{formatPriceMarked(Number(item.price) * item.quantity, locale, currencyLabel)}</PriceText>}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <CartOffers view={offers} onChange={() => setOffersRevision((n) => n + 1)} />
      <CrossSellOffers
        compact
        mainProductIds={items.map((item) => item.productId)}
        excludeProductIds={items.map((item) => item.productId)}
      />

      <div className="space-y-3 border-t border-(--sf-line) pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-(--sf-muted)">
            {t("subtotal")} <span className="text-sm">({t("itemCount", { count })})</span>
          </span>
          <span className="text-xl font-bold tabular-nums">
            <PriceText locale={locale}>{formatPriceMarked(subtotal, locale, currencyLabel)}</PriceText>
          </span>
        </div>
        {offers.totalPiastres > 0 && (
          <div className="flex items-baseline justify-between text-sm font-medium text-(--sf-brand)">
            <span>{t("offersTotal")}</span>
            <span className="tabular-nums">-<PriceText locale={locale}>{formatPriceMarked(offers.totalPiastres / 100, locale, currencyLabel)}</PriceText></span>
          </div>
        )}
        <p className="text-xs text-(--sf-muted)">{t("shippingNote")}</p>
        {minOrderCheck.ok ? (
          <Button asChild className={cn("h-12 w-full rounded-full text-base font-semibold", STORE_SOLID_BUTTON)}>
            <Link href="/cart/checkout" onClick={onNavigate}>
              {t("checkout")}
            </Link>
          </Button>
        ) : (
          <>
            <p role="status" className="text-sm font-medium text-orange-600">
              <PriceText locale={locale}>{t("minOrderAddMore", {
                amount: formatPriceMarked(minOrderCheck.shortPiastres / 100, locale, currencyLabel),
                minimum: formatPriceMarked(minOrderCheck.minimumPiastres / 100, locale, currencyLabel),
              })}</PriceText>
            </p>
            <Button type="button" disabled className={cn("h-12 w-full rounded-full text-base font-semibold", STORE_SOLID_BUTTON)}>
              {t("checkout")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
