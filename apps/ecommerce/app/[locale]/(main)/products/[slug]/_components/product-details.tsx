"use client";

import { Truck, RotateCcw, Globe, Banknote, Check } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { ProductActions } from "./ProductActions";
import { HideBottomNavOnScroll } from "@/components/layout/hide-bottom-nav-on-scroll.client";
import type { Product } from "./product-page.types";
import {
  formatPrice,
  formatPricePlain,
  getPriceFinal,
  getPriceList,
  parsePriceJson,
} from "@workspace/lib";
import { useLocale, useTranslations } from "next-intl";
import { FREE_SHIPPING_ENABLED, FREE_SHIPPING_THRESHOLD, RETURN_WINDOW_DAYS } from "@/lib/constants";
import { useState, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { getVariantImageUrls } from "@/lib/variant-images";
import { getDefaultProductVariantId } from "@/lib/product-variants";
import { getVariantDisplayFields } from "@/lib/variant-localized";
import { getVariantColor, withAlpha } from "@/lib/variant-colors";
import { splitBulletPoint } from "@/lib/bullet-points";
import type { ProductLocale } from "@/lib/product-translations";
import { SellerInfo } from "./SellerInfo";
import { Star } from "lucide-react";
import { DiscountCountdown } from "./discount-countdown";
import { DiscountPercentBadge } from "@/components/product";
import { getDiscountPercent } from "@/lib/utils";
import { MetaViewContent } from "@/components/meta/meta-view-content.client";

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
  const { price, listPrice, stock, discountEndsAt } = useMemo(() => {
    if (selectedVariant) {
      const parsed = parsePriceJson(selectedVariant.price);
      const variantPrice = parsed.final;
      const variantStock = Number(selectedVariant.stock ?? 0);
      const variantList = parsed.list;
      const productList = getPriceList(product.price);
      const hasOwnDiscount = variantList != null && variantList > variantPrice;
      const listCandidate = hasOwnDiscount
        ? variantList
        : productList != null && productList > variantPrice
          ? productList
          : null;
      const isDefaultVariant = selectedVariant.isDefault === true;
      const productDiscountEndsAt =
        (product.price as any)?.discountEndsAt ?? null;

      return {
        price: variantPrice,
        listPrice: listCandidate,
        stock: variantStock,
        // The default variant mirrors the main product's discount, so its
        // expiry lives in `product.price`; other variants carry their own.
        // A variant with no own discount that is shown against the product's
        // list price is showing the product's discount, so it gets that expiry.
        discountEndsAt: isDefaultVariant
          ? productDiscountEndsAt
          : ((selectedVariant as any)?.discountEndsAt ??
            (!hasOwnDiscount && listCandidate != null
              ? productDiscountEndsAt
              : null)),
      };
    }

    const parsed = parsePriceJson(product.price);
    const baseStock = product.quantity ? Number(product.quantity) : 0;

    return {
      price: parsed.final,
      listPrice:
        parsed.list != null && parsed.list > parsed.final ? parsed.list : null,
      stock: baseStock,
      discountEndsAt: (product.price as any)?.discountEndsAt ?? null,
    };
  }, [selectedVariant, product]);

  const discountExpiryDate = useMemo(() => {
    if (!discountEndsAt) return null;
    const parsed = new Date(discountEndsAt);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
      return null;
    }
    return parsed;
  }, [discountEndsAt]);

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

  // In-stock variants first; the sort is stable, so the original order is
  // kept within each group.
  const sortedVariants = useMemo(
    () =>
      [...(product.productVariants ?? [])].sort(
        (a, b) =>
          Number(Number(b.stock ?? 0) > 0) - Number(Number(a.stock ?? 0) > 0),
      ),
    [product.productVariants],
  );

  const variantOptionLabel = useMemo(() => {
    if (!product.productVariants?.length) return t("selectVariant");

    const optionNames = new Set<string>();
    for (const variant of product.productVariants) {
      const display = getVariantDisplayFields(variant, locale);
      for (const option of [
        display.option1,
        display.option2,
        display.option3,
      ]) {
        if (!option) continue;
        const match = option.match(/^(.+?):\s*(.+)$/);
        if (match?.[1]) optionNames.add(match[1].trim());
      }
    }

    if (optionNames.size === 0) return t("selectVariant");

    return t("selectOption", {
      option: Array.from(optionNames).join(" / "),
    });
  }, [product.productVariants, t]);
  const hasStock = product.status === "active" && stock > 0;
  const isPhysicalProduct = product.productType !== "digital";
  const hasFreeDelivery =
    isPhysicalProduct &&
    (product.freeDelivery === true || product.seller?.freeDelivery === true);
  const freeShippingThresholdLabel = formatPricePlain(
    FREE_SHIPPING_THRESHOLD,
    locale,
  );

  const renderVariantButton = (
    variant: NonNullable<Product["productVariants"]>[number],
  ) => {
    const display = getVariantDisplayFields(variant, locale);
    const isSelected = selectedVariantId === variant.id;
    const variantStock = Number(variant.stock ?? 0);
    const isAvailable = variantStock > 0;
    const isDefaultVariant = variant.isDefault === true;
    const optionParts: string[] = [];
    if (display.option1) optionParts.push(display.option1);
    if (display.option2) optionParts.push(display.option2);
    if (display.option3) optionParts.push(display.option3);
    const variantLabel = display.title || variant.title;
    const variantDescription = optionParts.join(" • ");
    const variantThumbnail = getVariantImageUrls(variant)[0];
    // Color variants get outlined in their own color instead of
    // the generic primary border.
    const colorHex = isAvailable
      ? (getVariantColor(variant, locale)?.hex ?? null)
      : null;
    // The inset hairline keeps pale colors (white, beige) readable
    // as an outline against the white card.
    const colorStyle = colorHex
      ? isSelected
        ? {
            borderColor: colorHex,
            boxShadow: `0 0 0 3px ${withAlpha(colorHex, 0.3)}, inset 0 0 0 1px rgba(0,0,0,0.08)`,
          }
        : {
            borderColor: withAlpha(colorHex, 0.55),
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
          }
      : undefined;

    return (
      <button
        key={variant.id}
        onClick={() => setSelectedVariantId(variant.id)}
        disabled={!isAvailable}
        title={variantDescription || variantLabel}
        aria-pressed={isSelected}
        aria-label={
          isAvailable
            ? variantLabel
            : `${variantLabel} (${t("outOfStock")})`
        }
        style={colorStyle}
        className={`group relative flex h-28 w-28 flex-col items-stretch overflow-hidden rounded-2xl border-2 text-left transition-all duration-200 ease-out ${
          isSelected
            ? colorHex
              ? "bg-white shadow-lg"
              : "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/25"
            : isAvailable
              ? colorHex
                ? "bg-white hover:-translate-y-0.5"
                : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
              : "cursor-not-allowed border-gray-100 bg-gray-50"
        }`}
      >
        {/* Visual: thumbnail image or a soft gradient placeholder */}
        <div className="relative flex-1 overflow-hidden">
          {variantThumbnail ? (
            <Image
              src={getPublicUrl(variantThumbnail, "products")}
              alt={variantLabel}
              fill
              sizes="96px"
              className={`object-contain transition-transform duration-300 ${
                isAvailable
                  ? "group-hover:scale-105"
                  : "opacity-40 grayscale"
              }`}
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${
                isSelected
                  ? "from-primary/15 to-primary/5"
                  : "from-gray-50 to-gray-100"
              }`}
            >
              <span
                className={`text-2xl font-bold ${
                  isSelected ? "text-primary/60" : "text-gray-300"
                }`}
              >
                {variantLabel.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Default badge */}
          {isDefaultVariant && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold leading-none text-white shadow-sm">
              {t("defaultVariant")}
            </span>
          )}

          {/* Selected checkmark */}
          {isSelected && (
            <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          )}

          {/* Out of stock: dim overlay + diagonal strike */}
          {!isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/10">
              <span className="h-px w-[140%] -rotate-[22deg] bg-gray-400/80" />
            </div>
          )}
        </div>

        {/* Label strip */}
        <div
          className={`shrink-0 border-t rtl:text-right px-1.5 py-1.5 ${
            isSelected
              ? "border-primary/20 bg-primary/5"
              : "border-gray-100 bg-white"
          }`}
        >
          <p
            className={`truncate text-[11px] font-semibold leading-tight ${
              isSelected ? "text-primary" : "text-gray-900"
            }`}
          >
            {variantLabel}
          </p>
          {isAvailable ? (
            <p
              className="truncate text-[10px] font-medium leading-tight text-gray-500"
              dangerouslySetInnerHTML={{
                __html: formatPrice(
                  getPriceFinal(variant.price),
                  locale,
                  "sm",
                ),
              }}
            />
          ) : (
            <p className="truncate text-[10px] font-medium leading-tight text-red-500">
              {t("outOfStock")}
            </p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="w-full space-y-5 md:space-y-6">
      <MetaViewContent productId={product.id} value={price} />
      {/* Product Title */}
      <div>
        <h1 className="mb-3 text-xl font-bold leading-snug text-gray-900 md:mb-4 md:text-2xl lg:text-3xl">
          {product.title}
        </h1>

        {/* Price */}
        <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-2 md:mb-4 md:gap-x-3">
          <span
            className="text-2xl font-bold text-primary md:text-3xl lg:text-4xl"
            dangerouslySetInnerHTML={{
              __html: formatPrice(price, locale, "lg"),
            }}
          />
          {listPrice && listPrice > price && (
            <span className="text-sm text-gray-500">
              <span className="hidden sm:inline">{t("insteadOf")} </span>
              <span
                className="font-medium text-red-400 line-through"
                dangerouslySetInnerHTML={{
                  __html: formatPrice(listPrice, locale, "sm"),
                }}
              />
            </span>
          )}
          {discountPercent != null && (
            <DiscountPercentBadge
              percent={discountPercent}
              className="shrink-0 text-xs md:px-2.5 md:py-1 md:text-sm"
            />
          )}
        </div>

        {/* Discount Countdown — only when the seller set a discount expiry */}
        {listPrice && listPrice > price && discountExpiryDate && (
          <DiscountCountdown endDate={discountExpiryDate} />
        )}

        {hasFreeDelivery && (
          <Badge
            variant="secondary"
            className="mb-4 bg-green-100 text-green-700 hover:bg-green-100 gap-1"
          >
            <Truck className="h-3 w-3" />
            {t("freeDeliveryOnProduct")}
          </Badge>
        )}

        {/* Rating and Stock */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {(product.averageRating ?? 0) > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.averageRating || 0)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {product.averageRating?.toFixed(1) || "0.0"}
              </span>
              <Link href="#reviews" className="text-sm text-gray-600 underline">
                {product.reviewCount === 1
                  ? t("reviewsCountOne", { count: product.reviewCount || 0 })
                  : t("reviewsCount", { count: product.reviewCount || 0 })}
              </Link>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                hasStock ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm font-medium text-gray-900">
              {hasStock
                ? t("inStockAvailable", { count: stock })
                : t("outOfStock")}
            </span>
          </div>
        </div>

        {/* Variant Selection */}
        {hasVariants && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              {variantOptionLabel}
            </label>
            {/* Mobile: free-drag carousel */}
            <Carousel
              opts={{
                align: "start",
                dragFree: true,
                direction: locale === "ar" ? "rtl" : "ltr",
              }}
              className="md:hidden"
            >
              <CarouselContent className="-ms-3 py-2">
                {sortedVariants.map((variant) => (
                  <CarouselItem key={variant.id} className="basis-auto ps-3">
                    {renderVariantButton(variant)}
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* Desktop: wrapping grid */}
            <div className="hidden flex-wrap gap-3 md:flex">
              {sortedVariants.map(renderVariantButton)}
            </div>
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

        {product.seller && (
          <SellerInfo
            name={product.seller.displayName}
            rating={product.seller.storeRating}
            reviewCount={product.seller.totalRatings}
          />
        )}

        {/* Quantity and Add to Cart */}
        <HideBottomNavOnScroll />
        <div className="fixed right-0 bottom-[79px] left-0 z-50 transition-[bottom] duration-300 ease-out [html[data-bottom-nav=hidden]_&]:bottom-0 border-t border-gray-200 bg-white px-3 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:relative md:bottom-0 md:z-auto md:mb-6 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
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
          className="w-full space-y-2"
        >
          <AccordionItem
            value="description"
            className="border-b border-gray-200"
          >
            <AccordionTrigger className="text-base font-medium text-gray-900 py-4">
              {t("description")}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-gray-700 pb-4 whitespace-pre-wrap">
              {product.description}
            </AccordionContent>
          </AccordionItem>

          {Array.isArray(product.bulletPoints) &&
            product.bulletPoints.length > 0 && (
              <AccordionItem
                value="attributes"
                className="border-b border-gray-200"
              >
                <AccordionTrigger className="text-base font-medium text-gray-900 py-4">
                  {t("attributes")}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-700 pb-4">
                  <ul className="list-disc list-inside space-y-2">
                    {product.bulletPoints.map(
                      (point: string, index: number) => {
                        const parts = splitBulletPoint(point);
                        return (
                          <li key={index}>
                            {parts ? (
                              <>
                                <span className="font-medium text-gray-900">
                                  {parts.label}:
                                </span>{" "}
                                {parts.value}
                              </>
                            ) : (
                              point
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
              tone: "bg-sky-50 text-sky-600 ring-sky-100",
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
              tone: "bg-emerald-50 text-emerald-600 ring-emerald-100",
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
                    tone: "bg-violet-50 text-violet-600 ring-violet-100",
                    title: t("nationwideDelivery"),
                    description: t("fastDeliveryNationwide"),
                  },
                ]),
            {
              key: "refunds",
              icon: Banknote,
              tone: "bg-amber-50 text-amber-600 ring-amber-100",
              title: t("refundsPolicy"),
              description: t("returnWindow", { days: String(RETURN_WINDOW_DAYS) }),
            },
          ];

          return (
            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-200">
              <ul className="grid grid-cols-1 gap-px sm:grid-cols-2">
                {perks.map(({ key, icon: Icon, tone, title, description }, index) => (
                  <li
                    key={key}
                    className={`flex items-center gap-3 bg-white p-4 transition-colors hover:bg-gray-50 ${
                      perks.length % 2 === 1 && index === perks.length - 1
                        ? "sm:col-span-2"
                        : ""
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${tone}`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
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
            </div>
          );
        })()}
      </div>
    </div>
  );
};
