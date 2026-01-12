"use client";

import {
  Star,
  Truck,
  RotateCcw,
  Globe,
  DollarSign,
  Heart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { ProductActions } from "./ProductActions";
import type { Product } from "./product-page.types";
import { formatPrice } from "@workspace/lib";
import { useLocale, useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components";
import Link from "next/link";
import Image from "next/image";
import { getPublicUrl } from "@workspace/ui/lib/utils";

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
  const locale = useLocale();
  const t = useTranslations("product");

  // Use internal state if props are not provided (backwards compatibility)
  const [internalSelectedVariantId, setInternalSelectedVariantId] = useState<
    string | null
  >(
    product.productVariants && product.productVariants.length > 0
      ? (product.productVariants[0]?.id ?? null)
      : null
  );

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
      return {
        price: variantPrice,
        listPrice: null,
        stock: variantStock,
      };
    }

    const basePrice = Number(
      (product.price as any)?.final ??
        (product.price as any)?.current ??
        (product.price as any)?.list ??
        0
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
  const hasStock = product.isActive && stock > 0;

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
            className="text-3xl lg:text-4xl font-semibold text-primary"
            dangerouslySetInnerHTML={{
              __html: formatPrice(price, locale, "lg"),
            }}
          />
          {listPrice && listPrice > price && (
            <span className="ml-3 font-medium text-red-400 line-through">
              {listPrice}
            </span>
          )}
        </div>

        {/* Rating and Stock */}
        <div className="flex items-center gap-4 mb-6">
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
              {t("selectVariant")}
            </label>
            <div className="grid lg:grid-cols-2 grid-cols-1 gap-2">
              {product.productVariants?.map((variant) => {
                const isSelected = selectedVariantId === variant.id;
                const variantStock = Number(variant.stock ?? 0);
                const isAvailable = variantStock > 0;
                // Build variant description from options
                const optionParts: string[] = [];
                if (variant.option1) optionParts.push(variant.option1);
                if (variant.option2) optionParts.push(variant.option2);
                if (variant.option3) optionParts.push(variant.option3);
                const variantDescription = optionParts.join(" • ");

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
                      {variant.imageUrl && (
                        <Image
                          src={getPublicUrl(variant.imageUrl, "products")}
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
                          {variant.title}
                        </p>
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
                              "sm"
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

        {/* Quantity and Add to Cart */}
        <div className="mb-6">
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
            <AccordionContent className="text-sm text-gray-700 pb-4">
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
                      (point: string, index: number) => (
                        <li key={index}>{point}</li>
                      )
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
                {t("freeShipping")}
              </p>
              <p className="text-xs text-gray-600">{t("ordersOverAmount")}</p>
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
