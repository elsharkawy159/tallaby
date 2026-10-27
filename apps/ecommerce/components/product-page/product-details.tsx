"use client";

import { useCurrencyLabel } from "@/lib/currency-label.client";
import { Truck, RotateCcw, Globe, Banknote } from "lucide-react";
import { ProductActions } from "./ProductActions";
import { HideBottomNavOnScroll } from "@/components/layout/hide-bottom-nav-on-scroll.client";
import type { Product } from "./product-page.types";
import { formatPricePlain } from "@workspace/lib";
import { useLocale, useTranslations } from "next-intl";
import { FREE_SHIPPING_ENABLED, FREE_SHIPPING_THRESHOLD, RETURN_WINDOW_DAYS } from "@/lib/constants";
import { useState, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components";
import { Link } from "@/i18n/navigation";
import { getDefaultProductVariantId } from "@/lib/product-variants";
import { splitBulletPoint } from "@/lib/bullet-points";
import type { ProductLocale } from "@/lib/product-translations";
import { SellerInfo } from "./SellerInfo";
import { Star } from "lucide-react";
import { PriceTicket } from "./price-ticket";
import { getDiscountPercent } from "@/lib/utils";
import { MetaViewContent } from "@/components/meta/meta-view-content.client";
import { LOW_STOCK_THRESHOLD, discountExpiryDate as offerExpiryDate, productPricing, stickyBuyBarClass } from "./product-page.lib";
import { ProductStockBadge } from "./product-stock-badge";
import { VariantPicker } from "./variant-picker";
import { LiveViews } from "./live-views.client";


interface ProductDetailsProps {
  product: Product;
  isInCart?: boolean;
  cartItemQuantity?: number;
  selectedVariantId?: string | null;
  onVariantChange?: (variantId: string | null) => void;
}

export const ProductDetails = ({
  product,
  isInCart,
  cartItemQuantity,
  selectedVariantId: externalSelectedVariantId,
  onVariantChange,
}: ProductDetailsProps) => {
  const locale = useLocale() as ProductLocale;
  const currencyLabel = useCurrencyLabel();
  const t = useTranslations("product");

  // Use internal state if props are not provided (backwards compatibility)
  const [internalSelectedVariantId, setInternalSelectedVariantId] = useState<
    string | null
  >(getDefaultProductVariantId(product.productVariants));

  const selectedVariantId =
    externalSelectedVariantId ?? internalSelectedVariantId;
  const setSelectedVariantId = onVariantChange ?? setInternalSelectedVariantId;

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId || !product.productVariants) return null;
    return (
      product.productVariants.find((v) => v.id === selectedVariantId) ?? null
    );
  }, [selectedVariantId, product.productVariants]);

  // Calculate price and stock based on selected variant or base product
  const { price, listPrice, stock, discountEndsAt } = useMemo(
    () => productPricing(product, selectedVariant),
    [selectedVariant, product],
  );

  const discountExpiryDate = useMemo(
    () => offerExpiryDate(discountEndsAt),
    [discountEndsAt],
  );

  const discountPercent = useMemo(
    () =>
      getDiscountPercent(
        listPrice,
        price,
        selectedVariant?.price ?? product.price,
      ),
    [listPrice, price, selectedVariant?.price, product.price],
  );

  const hasVariants =
    product.productVariants && product.productVariants.length > 0;

  const hasStock = product.status === "active" && stock > 0;
  const isLowStock = hasStock && stock <= LOW_STOCK_THRESHOLD;
  const isPhysicalProduct = product.productType !== "digital";
  const hasFreeDelivery =
    isPhysicalProduct &&
    (product.freeDelivery === true || product.seller?.freeDelivery === true);
  const freeShippingThresholdLabel = formatPricePlain(
    FREE_SHIPPING_THRESHOLD,
    locale,
    currencyLabel,
  );

  return (
    <div className="w-full">
      <MetaViewContent productId={product.id} value={price} />
      <div>
        {/* Seller and stock: small context above the title */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {product.seller ? (
            <SellerInfo
              name={product.seller.displayName}
              rating={product.seller.storeRating}
              reviewCount={product.seller.totalRatings}
            />
          ) : (
            <span />
          )}
          <ProductStockBadge hasStock={hasStock} isLowStock={isLowStock} stock={stock} />
        </div>

        <h1 className="mt-3 text-balance text-2xl font-bold leading-snug text-gray-900 lg:text-[2rem] lg:leading-tight">
          {product.title}
        </h1>

        {(product.averageRating ?? 0) > 0 && (
          <div className="mt-2.5 flex items-center gap-2 text-sm">
            <div className="flex items-center" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.averageRating || 0)
                      ? "fill-current text-accent"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="font-semibold text-gray-900">
              {product.averageRating?.toFixed(1) || "0.0"}
            </span>
            <Link href="#reviews" className="text-gray-500 underline underline-offset-2">
              {product.reviewCount === 1
                ? t("reviewsCountOne", { count: product.reviewCount || 0 })
                : t("reviewsCount", { count: product.reviewCount || 0 })}
            </Link>
          </div>
        )}

        <div className="mt-5">
          <PriceTicket
            price={price}
            listPrice={listPrice}
            discountPercent={discountPercent}
            discountExpiryDate={discountExpiryDate}
            hasFreeDelivery={hasFreeDelivery}
            locale={locale}
          />
        </div>

        {product.showLiveViews && <LiveViews productId={product.id} className="mt-3 text-gray-700" />}

        {/* Variant Selection */}
        {hasVariants && (
          <div className="mt-6">
            <VariantPicker
              product={product}
              selectedVariantId={selectedVariantId}
              selectedVariant={selectedVariant}
              onSelect={setSelectedVariantId}
            />
          </div>
        )}

        {/* Legacy Color Selection (fallback) */}
        {!hasVariants &&
          Array.isArray((product as any).colors) &&
          (product as any).colors.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Color
              </label>
              <div className="flex gap-3">
                {(product as any).colors.map((color: any) => (
                  <button
                    key={color.name}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-all"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    aria-label={`Select color ${color.name}`}
                  />
                ))}
              </div>
            </div>
          )}

        {/* Legacy Size Selection (fallback) */}
        {!hasVariants &&
          Array.isArray((product as any).sizes) &&
          (product as any).sizes.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-900">
                  Size
                </label>
                <Link
                  href="#sizing-chart"
                  className="text-sm text-blue-600 hover:underline"
                >
                  See sizing chart
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {(product as any).sizes.map((size: any) => (
                  <button
                    key={size}
                    className="px-4 py-2 border-2 border-gray-300 hover:border-gray-400 rounded transition-all text-sm font-medium bg-white text-gray-900"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* Quantity and Add to Cart */}
        <HideBottomNavOnScroll />
        <div className={stickyBuyBarClass("md:mb-2 md:mt-6")}>
          <ProductActions
            product={{
              ...product,
              quantity: stock.toString(),
              price: {
                final: price,
                list: listPrice ?? price,
              } as any,
            }}
            selectedVariantId={selectedVariantId}
            isInCart={isInCart}
            cartItemQuantity={cartItemQuantity}
          />
        </div>

        {/* Collapsible Sections */}
        <Accordion
          type="multiple"
          defaultValue={["description", "attributes"]}
          className="mt-6 w-full border-t border-gray-100"
        >
          <AccordionItem
            value="description"
            className="border-b border-gray-100"
          >
            <AccordionTrigger className="py-4 text-base font-semibold text-gray-900 hover:no-underline">
              {t("description")}
            </AccordionTrigger>
            {/* Sanitised on the server (mergeProductWithTranslation). */}
            <AccordionContent className="pb-5 text-sm leading-relaxed text-gray-700">
              {product.descriptionHtml ? (
                <div
                  className="rich-text-content"
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
              ) : (
                <p className="whitespace-pre-wrap">{product.description}</p>
              )}
            </AccordionContent>
          </AccordionItem>

          {Array.isArray(product.bulletPoints) &&
            product.bulletPoints.length > 0 && (
              <AccordionItem
                value="attributes"
                className="border-b border-gray-100"
              >
                <AccordionTrigger className="py-4 text-base font-semibold text-gray-900 hover:no-underline">
                  {t("attributes")}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm">
                  {/* Label/value spec sheet; lines without a label span both columns. */}
                  <ul className="overflow-hidden rounded-xl ring-1 ring-gray-100">
                    {product.bulletPoints.map(
                      (point: string, index: number) => {
                        const parts = splitBulletPoint(point);
                        return (
                          <li
                            key={index}
                            className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-3.5 py-2.5 odd:bg-gray-50"
                          >
                            {parts ? (
                              <>
                                <span className="text-gray-500">{parts.label}</span>
                                <span className="font-medium text-gray-900">
                                  {parts.value}
                                </span>
                              </>
                            ) : (
                              <span className="col-span-2 text-gray-900">{point}</span>
                            )}
                          </li>
                        );
                      },
                    )}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
        </Accordion>

        {/* Shipping and Returns Information */}
        {(() => {
          const showsNationwideFirst = !hasFreeDelivery && !FREE_SHIPPING_ENABLED;
          const perks = [
            {
              key: "delivery",
              icon: Truck,
              title: hasFreeDelivery
                ? t("freeDeliveryOnProduct")
                : FREE_SHIPPING_ENABLED
                  ? t("freeShipping")
                  : t("nationwideDelivery"),
              description: hasFreeDelivery
                ? t("freeDeliveryOnProductDescription")
                : FREE_SHIPPING_ENABLED
                  ? t("ordersOverAmount", { amount: freeShippingThresholdLabel })
                  : t("fastDeliveryNationwide"),
            },
            {
              key: "returns",
              icon: RotateCcw,
              title: t("veryEasyToReturn"),
              description: t("justPhoneNumber"),
            },
            // Skip when the delivery card above already says the same thing.
            ...(showsNationwideFirst
              ? []
              : [
                  {
                    key: "nationwide",
                    icon: Globe,
                    title: t("nationwideDelivery"),
                    description: t("fastDeliveryNationwide"),
                  },
                ]),
            {
              key: "refunds",
              icon: Banknote,
              title: t("refundsPolicy"),
              description: t("returnWindow", { days: String(RETURN_WINDOW_DAYS) }),
            },
          ];

          return (
            <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 rounded-2xl bg-gray-50 p-4 sm:grid-cols-2 md:p-5">
              {perks.map(({ key, icon: Icon, title, description }) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm ring-1 ring-gray-100">
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0 text-start">
                    <p className="text-sm font-semibold leading-snug text-gray-900">
                      {title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          );
        })()}
      </div>
    </div>
  );
};
