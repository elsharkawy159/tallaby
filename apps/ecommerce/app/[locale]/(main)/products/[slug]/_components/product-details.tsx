"use client";

import { Truck, RotateCcw, Globe, DollarSign } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { ProductActions } from "./ProductActions";
import type { Product } from "./product-page.types";
import { formatPrice, formatPricePlain } from "@workspace/lib";
import { useLocale, useTranslations } from "next-intl";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { useState, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { getVariantImageUrls } from "@/lib/variant-images";
import { getDefaultProductVariantId } from "@/lib/product-variants";
import { getVariantDisplayFields } from "@/lib/variant-localized";
import { splitBulletPoint } from "@/lib/bullet-points";
import type { ProductLocale } from "@/lib/product-translations";
import { SellerInfo } from "./SellerInfo";
import { Star } from "lucide-react";
import { DiscountCountdown } from "./discount-countdown";

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
  const { price, listPrice, stock } = useMemo(() => {
    if (selectedVariant) {
      const variantPrice = Number(selectedVariant.price ?? 0);
      const variantStock = Number(selectedVariant.stock ?? 0);
      const isDefaultVariant = selectedVariant.isDefault === true;
      const baseListPrice = (product.price as any)?.list
        ? Number((product.price as any).list)
        : null;

      return {
        price: variantPrice,
        listPrice:
          isDefaultVariant && baseListPrice && baseListPrice > variantPrice
            ? baseListPrice
            : null,
        stock: variantStock,
      };
    }

    const basePrice = Number(
      (product.price as any)?.final ??
        (product.price as any)?.current ??
        (product.price as any)?.list ??
        0,
    );
    const baseListPrice = (product.price as any)?.list
      ? Number((product.price as any).list)
      : null;
    const baseStock = product.quantity ? Number(product.quantity) : 0;

    return {
      price: basePrice,
      listPrice: baseListPrice,
      stock: baseStock,
    };
  }, [selectedVariant, product]);

  const hasVariants =
    product.productVariants && product.productVariants.length > 0;

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

  return (
    <div className="space-y-6 w-full">
      {/* Product Title */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
          {product.title}
        </h1>

        {/* Price */}
        <div className="mb-4">
          <span
            className="text-3xl lg:text-4xl font-bold text-primary"
            dangerouslySetInnerHTML={{
              __html: formatPrice(price, locale, "lg"),
            }}
          />
          {listPrice && listPrice > price && (
            <span className="mx-3 text-sm text-gray-500">
              {t("insteadOf")}{" "}
              <span className="font-medium text-red-400 line-through">
                {listPrice}
              </span>
            </span>
          )}
        </div>

        {/* Discount Countdown */}
        {listPrice && listPrice > price && <DiscountCountdown />}

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
            <div className="grid lg:grid-cols-2 grid-cols-1 gap-2">
              {product.productVariants?.map((variant) => {
                const display = getVariantDisplayFields(variant, locale);
                const isSelected = selectedVariantId === variant.id;
                const variantStock = Number(variant.stock ?? 0);
                const isAvailable = variantStock > 0;
                const isDefaultVariant = variant.isDefault === true;
                const optionParts: string[] = [];
                if (display.option1) optionParts.push(display.option1);
                if (display.option2) optionParts.push(display.option2);
                if (display.option3) optionParts.push(display.option3);
                const variantDescription = optionParts.join(" • ");
                const variantThumbnail = getVariantImageUrls(variant)[0];

                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    disabled={!isAvailable}
                    className={`p-2.5 border-2 cursor-pointer rounded-lg text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : isAvailable
                          ? "border-gray-300 hover:border-gray-400 bg-white"
                          : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2 justify-between">
                      {variantThumbnail && (
                        <Image
                          src={getPublicUrl(variantThumbnail, "products")}
                          alt={`${variant.title} image`}
                          width={100}
                          height={100}
                          className="w-10"
                        />
                      )}
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            isSelected ? "text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {display.title || variant.title}
                        </p>
                        {isDefaultVariant && (
                          <p className="text-[10px] text-primary font-medium">
                            Default
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p
                          className={`text-sm font-semibold ${
                            isSelected ? "text-gray-900" : "text-gray-700"
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: formatPrice(
                              Number(variant.price ?? 0),
                              locale,
                              "sm",
                            ),
                          }}
                        />
                        <p
                          className={`text-xs mt-1 ${
                            isAvailable ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {isAvailable
                            ? t("inStockCount", { count: variantStock })
                            : t("outOfStock")}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
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
        <div className="md:mb-6 md:relative fixed md:bg-transparent md:border-0 bg-white md:p-0 px-4 py-2.5 border border-gray-200 md:bottom-0 bottom-15 md:z-auto z-50 left-0 right-0">
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
            className="flex gap-4 items-center"
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
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm mb-1">
                {hasFreeDelivery
                  ? t("freeDeliveryOnProduct")
                  : t("freeShipping")}
              </p>
              <p className="text-xs text-gray-600">
                {hasFreeDelivery
                  ? t("freeDeliveryOnProductDescription")
                  : t("ordersOverAmount", {
                      amount: freeShippingThresholdLabel,
                    })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <RotateCcw className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm mb-1">
                {t("veryEasyToReturn")}
              </p>
              <p className="text-xs text-gray-600">{t("justPhoneNumber")}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Globe className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm mb-1">
                {t("nationwideDelivery")}
              </p>
              <p className="text-xs text-gray-600">
                {t("fastDeliveryNationwide")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm mb-1">
                {t("refundsPolicy")}
              </p>
              <p className="text-xs text-gray-600">{t("thirtyDaysReturn")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
