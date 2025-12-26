import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Minus, Plus, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { formatPrice } from "@workspace/lib";
import { getCartItems } from "@/actions/cart";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { QuantitySelector } from "@/components/product/quantity-selector";

export const metadata: Metadata = generateNoIndexMetadata();

export default async function Cart() {
  const cartResult = await getCartItems();
  const locale = await getLocale();
  const cartData = cartResult.success ? cartResult.data : null;

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb />
      <main className="flex-1 container pb-12">
        <h1 className="text-3xl font-bold mb-8">
          Shopping Cart ({cartData?.itemCount} items)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
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
                  className="flex flex-col relative sm:flex-row bg-white gap-4 p-6 shadow-sm rounded-lg"
                >
                  <Link
                    href={`/products/${p.slug}`}
                    className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden relative"
                  >
                    <Image
                      src={image}
                      alt={p.title}
                      fill
                      sizes="50vw"
                      className="object-contain bg-white"
                    />
                  </Link>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <Link
                          href={`/products/${p.slug}`}
                          className="font-medium text-lg"
                        >
                          {p.title}
                        </Link>
                        <div className="text-xs text-gray-600">
                          {p.brand?.name ? (
                            <span>Brand: {p.brand.name}</span>
                          ) : null}
                          {p.seller?.displayName ? (
                            <>
                              {p.brand?.name ? (
                                <span className="mx-1">·</span>
                              ) : null}
                              <span>Seller: {p.seller.displayName}</span>
                            </>
                          ) : null}
                          {p.sku ? (
                            <span className="ml-1"> · SKU: {p.sku}</span>
                          ) : null}
                        </div>
                      </div>
                      {/* <Button
                    size="icon"
                    variant="ghost"
                    className="text-gray-400 absolute top-2 right-2 hover:text-red-500 p-1"
                    onClick={() => removeFromCart(item.id)}
                    disabled={isProductLoading(item.id)}
                  >
                    {isProductLoading(item.id) ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Trash2 className="size-5" />
                    )}
                  </Button> */}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <span
                          className="font-bold text-lg"
                          dangerouslySetInnerHTML={{
                            __html: formatPrice(unit, locale),
                          }}
                        />
                        {/* Price comparison logic can be added here if needed */}
                      </div>
                      <div className="flex items-center flex-col gap-4">
                        <QuantitySelector
                          productId={p.id}
                          showRemoveButton={true}
                          cartItemId={item.id}
                          initialQuantity={item.quantity}
                          productStock={p.quantity}
                        />
                        <span
                          className="font-medium"
                          dangerouslySetInnerHTML={{
                            __html: formatPrice(lineTotal, locale),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Unit</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cartData?.items.map((item: any) => {
                    const p = item.product;
                    const unit = Number(item.price) ?? 0;
                    const lineTotal = unit * item.quantity;
                    return (
                      <tr key={item.id} className="border-b last:border-b-0">
                        <td className="py-2 truncate max-w-30">{p.title}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td
                          className="py-2 text-right"
                          dangerouslySetInnerHTML={{
                            __html: formatPrice(unit, locale),
                          }}
                        />
                        <td
                          className="py-2 text-right"
                          dangerouslySetInnerHTML={{
                            __html: formatPrice(lineTotal, locale),
                          }}
                        />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal</span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: formatPrice(cartData?.subtotal ?? 0, locale),
                    }}
                  />
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span
                    className="text-primary"
                    dangerouslySetInnerHTML={{
                      __html: formatPrice(cartData?.subtotal ?? 0, locale),
                    }}
                  />
                </div>
              </div>
            </div>
            <Link href="/cart/checkout" className="block">
              <Button
                className="w-full"
                size="lg"
                disabled={cartData?.items.length === 0}
              >
                Proceed to Checkout
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
            <p className="text-center text-sm text-gray-600 mt-4">
              🔒 Secure checkout with SSL encryption
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
