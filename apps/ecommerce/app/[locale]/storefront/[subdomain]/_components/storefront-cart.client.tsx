"use client";

import { ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatPricePlain } from "@workspace/lib";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Link } from "@/i18n/navigation";
import { QuantitySelector } from "@/components/product";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { resolvePrimaryImage } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";

/**
 * This storefront's cart: the cart actions are scoped by host, so on a store
 * subdomain `useCart` only ever sees this seller's cart.
 */
export function StorefrontCart({
  storeName,
  onNavigate,
}: {
  storeName: string;
  /** Called when a link inside is followed, so a sheet can close itself. */
  onNavigate?: () => void;
}) {
  const t = useTranslations("storefront");
  const locale = useLocale();
  const { cartItems, loading } = useCart();
  const items = cartItems.filter((item) => !item.savedForLater);
  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

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
        <Button asChild className="mt-6 h-11 rounded-full px-6">
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
          const stock = (item.product as { quantity?: number | string }).quantity;
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
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <QuantitySelector
                    size="sm"
                    cartItemId={item.id}
                    initialQuantity={item.quantity}
                    productStock={stock}
                  />
                  <span className="text-sm font-semibold tabular-nums">
                    {formatPricePlain(Number(item.price) * item.quantity, locale)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-3 border-t border-(--sf-line) pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-(--sf-muted)">
            {t("subtotal")} <span className="text-sm">({t("itemCount", { count })})</span>
          </span>
          <span className="text-xl font-bold tabular-nums">
            {formatPricePlain(subtotal, locale)}
          </span>
        </div>
        <p className="text-xs text-(--sf-muted)">{t("shippingNote")}</p>
        <Button asChild className="h-12 w-full rounded-full text-base font-semibold">
          <Link href="/cart/checkout" onClick={onNavigate}>
            {t("checkout")}
          </Link>
        </Button>
        <p className="text-center text-xs text-(--sf-muted)">
          {t("cartScopeNote", { store: storeName })}
        </p>
      </div>
    </div>
  );
}
