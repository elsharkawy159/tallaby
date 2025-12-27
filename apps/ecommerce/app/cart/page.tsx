import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { ArrowLeft, Shield } from "lucide-react";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { formatPrice } from "@workspace/lib";
import { getCartItems } from "@/actions/cart";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { ScrollArea, ScrollBar } from "@workspace/ui/components";

export const metadata: Metadata = generateNoIndexMetadata();

export default async function Cart() {
  const cartResult = await getCartItems();
  const locale = await getLocale();
  const cartData = cartResult.success ? cartResult.data : null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <DynamicBreadcrumb />
      <main className="flex-1 container py-8 pb-16">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Shopping Cart
          </h1>
          <p className="text-muted-foreground text-lg">
            {cartData?.itemCount || 0}{" "}
            {cartData?.itemCount === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
          {/* Cart Items Section */}
          <div className="space-y-4">
            {cartData?.items.map((item: any) => {
              const p = item.product;
              const unit = Number(item.price);
              const lineTotal = unit * item.quantity;
              const image = p?.images?.[0]
                ? getPublicUrl(p?.images?.[0], "products")
                : "/png product.png";
              return (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:border-gray-300"
                >
                  <div className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8">
                    {/* Product Image */}
                    <Link
                      href={`/products/${p.slug}`}
                      className="relative w-full sm:w-40 h-40 sm:h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                    >
                      <Image
                        src={image}
                        alt={p.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 160px"
                        className="object-contain p-4"
                        priority
                      />
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                      {/* Title and Meta */}
                      <div className="space-y-2">
                        <Link
                          href={`/products/${p.slug}`}
                          className="block group/link"
                        >
                          <h3 className="text-xl font-semibold text-gray-900 leading-tight transition-colors group-hover/link:text-primary line-clamp-2">
                            {p.title}
                          </h3>
                        </Link>

                        {/* Meta Information */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {p.brand?.name && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium">
                              {p.brand.name}
                            </span>
                          )}
                          {p.seller?.displayName && (
                            <span className="text-gray-600">
                              by {p.seller.displayName}
                            </span>
                          )}
                          {p.sku && (
                            <span className="text-gray-500">SKU: {p.sku}</span>
                          )}
                        </div>
                      </div>

                      {/* Price and Quantity Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mt-auto pt-4 border-t border-gray-100">
                        {/* Unit Price */}
                        <div className="flex items-baseline gap-2">
                          <span
                            className="text-2xl font-bold text-gray-900"
                            dangerouslySetInnerHTML={{
                              __html: formatPrice(unit, locale),
                            }}
                          />
                          <span className="text-sm text-muted-foreground">
                            per item
                          </span>
                        </div>

                        {/* Quantity and Line Total */}
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end gap-2">
                            <QuantitySelector
                              productId={p.id}
                              showRemoveButton={true}
                              cartItemId={item.id}
                              initialQuantity={item.quantity}
                              productStock={p.quantity}
                            />
                            <div className="text-right">
                              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                                Line Total
                              </span>
                              <div
                                className="text-xl font-bold text-gray-900 mt-0.5"
                                dangerouslySetInnerHTML={{
                                  __html: formatPrice(lineTotal, locale),
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Summary Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Order Summary
                </h2>
              </div>

              {/* Items Breakdown */}
              <div className="p-5 pt-3">
                <div className="space-y-0 mb-3">

                  {cartData?.items.map((item: any) => {
                    const p = item.product;
                    const unit = Number(item.price) ?? 0;
                    const lineTotal = unit * item.quantity;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {p.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Qty: {item.quantity}
                            {" × "}
                            <span
                              dangerouslySetInnerHTML={{
                                __html: formatPrice(unit, locale),
                              }}
                            />
                          </p>
                        </div>
                        <div
                          className="text-sm font-semibold text-gray-900 whitespace-nowrap"
                          dangerouslySetInnerHTML={{
                            __html: formatPrice(lineTotal, locale),
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="space-y-4 pt-4 border-t-2 border-gray-200">
                  <div className="flex items-center justify-between text-base">
                    <span className="font-medium text-gray-700">Subtotal</span>
                    <span
                      className="font-semibold text-gray-900"
                      dangerouslySetInnerHTML={{
                        __html: formatPrice(cartData?.subtotal ?? 0, locale),
                      }}
                    />
                  </div>

                  <Separator className="bg-gray-200" />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xl font-bold text-gray-900">
                      Total
                    </span>
                    <span
                      className="text-2xl font-bold text-primary"
                      dangerouslySetInnerHTML={{
                        __html: formatPrice(cartData?.subtotal ?? 0, locale),
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="px-6 pb-6 space-y-4">
                <Link href="/cart/checkout" className="block">
                  <Button
                    className="w-full h-12 text-base font-semibold transition-all duration-200"
                    size="lg"
                    disabled={
                      !cartData?.items.length || cartData.items.length === 0
                    }
                  >
                    Proceed to Checkout
                  </Button>
                </Link>

                <Link href="/products">
                  <Button
                    variant="outline"
                    className="w-full h-11 border-2 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Continue Shopping
                  </Button>
                </Link>

                {/* Security Badge */}
                {/* <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Secure checkout with SSL encryption</span>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
