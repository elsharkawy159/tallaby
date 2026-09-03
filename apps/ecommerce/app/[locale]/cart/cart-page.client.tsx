"use client";

import { useLayoutEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { formatPrice } from "@workspace/lib";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { formatVariantTitle } from "@/lib/variant-utils";
import { useCart } from "@/providers/cart-provider";
import { CartItemRemoveButton } from "./_components/cart-item-remove-button";
import type { CartSummary } from "@/types/cart";
import posthog from "posthog-js";

interface CartPageClientProps {
  initialCartData: CartSummary | null;
}

export function CartPageClient({ initialCartData }: CartPageClientProps) {
  const queryClient = useQueryClient();
  const { cartItems, itemCount, subtotal } = useCart();
  const locale = useLocale();
  const t = useTranslations("cart");

  useLayoutEffect(() => {
    if (initialCartData) {
      queryClient.setQueryData(["cart"], initialCartData);
    }
  }, [initialCartData, queryClient]);

  return (
    <>
      <div className="mb-6 md:mb-10">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight mb-1 md:mb-2">
          {t("shoppingCart")}
        </h1>
        <p className="text-xs md:text-lg text-muted-foreground">
          {t("itemsInCart", { count: itemCount })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 md:gap-8 lg:gap-12">
        <div className="space-y-3 md:space-y-4">
          {cartItems.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <p className="text-lg font-semibold text-gray-900">
                {t("emptyCart")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("addItemsToCart")}
              </p>
              <Link href="/products" className="inline-block mt-6">
                <Button>{t("continueShopping")}</Button>
              </Link>
            </div>
          ) : (
            cartItems.map((item) => {
              const p = item.product;
              const unit = Number(item.price);
              const lineTotal = unit * item.quantity;
              const image = p?.images?.[0]
                ? getPublicUrl(p?.images?.[0], "products")
                : "/png product.png";
              const variant = item.variant as any;
              const variantTitle = variant ? formatVariantTitle(variant) : null;

              return (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-xl md:rounded-2xl border border-gray-200 transition-all duration-300 hover:border-gray-300"
                >
                  <div className="absolute -top-1 -right-1 z-10">
                    <CartItemRemoveButton cartItemId={item.id} />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-6 p-3 md:p-6 lg:p-8">
                    <Link
                      href={`/products/${p.slug}`}
                      className="relative w-full sm:w-24 md:w-38 h-24 md:h-38 bg-gradient-to-br overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-105"
                    >
                      <Image
                        src={
                          variant?.imageUrl
                            ? getPublicUrl(variant.imageUrl, "products")
                            : image
                        }
                        alt={p.title}
                        fill
                        sizes="(max-width: 640px) 96px, (max-width: 768px) 96px, 160px"
                        className="object-contain"
                        priority
                      />
                    </Link>

                    <div className="flex-1 flex flex-col gap-2 md:gap-4 min-w-0">
                      <div className="flex items-center justify-between lg:gap-10 gap-4">
                        <div className="space-y-1 md:space-y-2">
                          <Link
                            href={`/products/${p.slug}`}
                            className="block group/link"
                          >
                            <h3 className="text-sm md:text-lg font-semibold text-gray-900 leading-tight transition-colors group-hover/link:text-primary line-clamp-2">
                              {p.title}
                            </h3>
                            {variantTitle && (
                              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                {variantTitle}
                              </p>
                            )}
                          </Link>

                          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
                            {p.brand?.name && (
                              <span className="inline-flex items-center px-2 md:px-2.5 py-0.5 md:py-1 rounded-md bg-gray-100 text-gray-700 font-medium text-xs">
                                {p.brand.name}
                              </span>
                            )}
                            {p.seller?.displayName && (
                              <span className="text-gray-600">
                                {t("by")} {p.seller.displayName}
                              </span>
                            )}
                          </div>
                        </div>
                        <QuantitySelector
                          showRemoveButton={true}
                          cartItemId={item.id}
                          initialQuantity={item.quantity}
                          productStock={
                            variant ? (variant.stock ?? p.quantity) : p.quantity
                          }
                        />
                      </div>

                      <div className="flex flex-row items-end justify-between gap-3 md:gap-6 mt-auto pt-0.5 md:pt-4 border-t border-gray-100">
                        <div className="gap-1 md:gap-2">
                          <span className="text-xs block text-muted-foreground uppercase tracking-wide">
                            {t("perItem")}
                          </span>
                          <span
                            className="text-base md:text-xl font-bold text-gray-900"
                            dangerouslySetInnerHTML={{
                              __html: formatPrice(unit, locale),
                            }}
                          />
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">
                            {t("lineTotal")}
                          </span>
                          <div
                            className="text-base md:text-xl font-bold text-gray-900"
                            dangerouslySetInnerHTML={{
                              __html: formatPrice(lineTotal, locale),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="lg:sticky lg:top-8 h-fit">
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
              <h2 className="text-sm md:text-xl font-bold text-gray-900">
                {t("orderSummary")}
              </h2>
            </div>

            <div className="p-3 md:p-5 pt-2 md:pt-3">
              <div className="space-y-0 mb-2 md:mb-3">
                {cartItems.map((item) => {
                  const p = item.product;
                  const unit = Number(item.price) ?? 0;
                  const lineTotal = unit * item.quantity;
                  const variant = item.variant as any;
                  const variantTitle = variant
                    ? formatVariantTitle(variant)
                    : null;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-2 md:gap-4 py-2 md:py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                          {p.title}
                        </p>
                        {variantTitle && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {variantTitle}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t("quantity")}: {item.quantity}
                          {" × "}
                          <span
                            dangerouslySetInnerHTML={{
                              __html: formatPrice(unit, locale),
                            }}
                          />
                        </p>
                      </div>
                      <div
                        className="text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap"
                        dangerouslySetInnerHTML={{
                          __html: formatPrice(lineTotal, locale),
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t-2 border-gray-200">
                <div className="flex items-center justify-between text-sm md:text-base">
                  <span className="font-medium text-gray-700">
                    {t("subtotal")}
                  </span>
                  <span
                    className="font-semibold text-gray-900"
                    dangerouslySetInnerHTML={{
                      __html: formatPrice(subtotal, locale),
                    }}
                  />
                </div>

                <Separator className="bg-gray-200" />

                <div className="flex items-center justify-between pt-1 md:pt-2">
                  <span className="text-base md:text-xl font-bold text-gray-900">
                    {t("total")}
                  </span>
                  <span
                    className="text-lg md:text-2xl font-bold text-primary"
                    dangerouslySetInnerHTML={{
                      __html: formatPrice(subtotal, locale),
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-3 md:space-y-4">
              <Link
                href="/cart/checkout"
                className="block"
                onClick={() =>
                  posthog.capture("checkout_started", {
                    item_count: itemCount,
                    cart_total: subtotal,
                  })
                }
              >
                <Button
                  className="w-full h-10 md:h-12 text-xs md:text-base font-semibold transition-all duration-200"
                  size="lg"
                  disabled={cartItems.length === 0}
                >
                  {t("proceedToCheckout")}
                </Button>
              </Link>

              <Link href="/products">
                <Button
                  variant="outline"
                  className="w-full h-9 md:h-11 text-xs md:text-sm border-2 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  {t("continueShopping")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
