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
import { useLocale } from "next-intl";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components";
import Link from "next/link";

interface ProductDetailsProps {
  product: Product;
  isInCart?: boolean;
  cartItemQuantity?: number;
}

export const ProductDetails = ({
  product,
  isInCart,
  cartItemQuantity,
}: ProductDetailsProps) => {
  const locale = useLocale();
  const [selectedColor, setSelectedColor] = useState(
    (product as any).colors?.[0]?.name || ""
  );
  const [selectedSize, setSelectedSize] = useState(
    (product as any).sizes?.[0] || ""
  );

  const price = Number(
    (product.price as any)?.final ??
      (product.price as any)?.current ??
      (product.price as any)?.list ??
      0
  );
  const listPrice = (product.price as any)?.list
    ? Number((product.price as any).list)
    : null;

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
              {product.reviewCount || 0} reviews
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium text-gray-900">
              {product.isActive ? "In stock" : "Out of stock"}
            </span>
          </div>
        </div>

        {/* Color Selection */}
        {Array.isArray((product as any).colors) &&
          (product as any).colors.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Color
              </label>
              <div className="flex gap-3">
                {(product as any).colors.map((color: any) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColor === color.name
                        ? "border-gray-900 scale-110"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    aria-label={`Select color ${color.name}`}
                  />
                ))}
              </div>
            </div>
          )}

        {/* Size Selection */}
        {Array.isArray((product as any).sizes) &&
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
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border-2 rounded transition-all text-sm font-medium ${
                      selectedSize === size
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300 hover:border-gray-400 bg-white text-gray-900"
                    }`}
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
            product={product}
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
              Description
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
                  Attributes
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
                Free shipping
              </p>
              <p className="text-xs text-gray-600">On orders over $50.00</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <RotateCcw className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm mb-1">
                Very easy to return
              </p>
              <p className="text-xs text-gray-600">Just phone number</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Globe className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm mb-1">
                Nationwide Delivery
              </p>
              <p className="text-xs text-gray-600">Fast delivery nationwide</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm mb-1">
                Refunds policy
              </p>
              <p className="text-xs text-gray-600">
                30 days return for any reason
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
