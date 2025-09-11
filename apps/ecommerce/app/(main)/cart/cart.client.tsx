"use client";

import { useMemo, useOptimistic, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Minus, Plus, X, ArrowLeft } from "lucide-react";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { removeFromCart, updateCartItem } from "@/actions/cart";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";

type CartResponse = {
  success: boolean;
  data?: {
    cart: any;
    items: any[];
    subtotal: number;
    itemCount: number;
  } | null;
  error?: string;
};

export default function CartClient({
  initialData,
}: {red
  initialData: CartResponse;
}) {
  const [isPending, startTransition] = useTransition();

  const [optimisticItems, setOptimisticItems] = useOptimistic(
    initialData.data?.items ?? [],
    (prev: any[], action: { type: string; id: string; quantity?: number }) => {
      switch (action.type) {
        case "update":
          return prev.map((it) =>
            it.id === action.id ? { ...it, quantity: action.quantity } : it
          );
        case "remove":
          return prev.filter((it) => it.id !== action.id);
        default:
          return prev;
      }
    }
  );

  const totals = useMemo(() => {
    const subtotal = optimisticItems.reduce(
      (sum, it: any) => sum + Number(it.price) * it.quantity,
      0
    );
    const itemCount = optimisticItems.reduce(
      (sum, it: any) => sum + it.quantity,
      0
    );
    return { subtotal, itemCount };
  }, [optimisticItems]);

  const handleDecrease = (item: any) => {
    if (item.quantity <= 1) return;
    const nextQty = Math.max(1, item.quantity - 1);
    setOptimisticItems({ type: "update", id: item.id, quantity: nextQty });
    startTransition(async () => {
      const res = await updateCartItem(item.id, nextQty);
      if (!res?.success) {
        // revert on failure
        setOptimisticItems({
          type: "update",
          id: item.id,
          quantity: item.quantity,
        });
      }
    });
  };

  const handleIncrease = (item: any) => {
    const nextQty = item.quantity + 1;
    setOptimisticItems({ type: "update", id: item.id, quantity: nextQty });
    startTransition(async () => {
      const res = await updateCartItem(item.id, nextQty);
      if (!res?.success) {
        setOptimisticItems({
          type: "update",
          id: item.id,
          quantity: item.quantity,
        });
      }
    });
  };

  const handleRemove = (item: any) => {
    setOptimisticItems({ type: "remove", id: item.id });
    startTransition(async () => {
      const res = await removeFromCart(item.id);
      if (!res?.success) {
        // On failure, refetch on next navigation; for now no revert context
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
        <DynamicBreadcrumb />
      <main className="flex-1 container mx-auto py-1">

        <h1 className="text-3xl font-bold mb-8">
          Shopping Cart ({totals.itemCount} items)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {optimisticItems.map((item: any) => {
              const p = item.product;
              const unit = Number(item.price);
              const lineTotal = unit * item.quantity;
              const image = p?.images?.[0] ? getPublicUrl(p?.images?.[0], "products") : "/png product.png";
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row bg-white gap-4 p-6 shadow-sm rounded-lg"
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
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <Link
                          href={`/products/${p.slug}`}
                          className="font-medium text-lg"
                        >
                          {p.title}
                        </Link>
                        <div className="text-sm text-gray-600">
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
                      <button
                        className="text-gray-400 hover:text-red-500 p-1"
                        onClick={() => handleRemove(item)}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg">
                          {unit.toFixed(2)}
                          {initialData.data?.cart?.currency
                            ? ` ${initialData.data.cart.currency}`
                            : "$"}
                        </span>
                        {p.price?.list &&
                        p.price?.final &&
                        p.price.final < p.price.list ? (
                          <span className="text-sm text-gray-500 line-through">
                            {Number(p.price.list).toFixed(2)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border rounded-md">
                          <button
                            className="p-2 hover:bg-gray-100"
                            onClick={() => handleDecrease(item)}
                            disabled={item.quantity <= 1 || isPending}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-2 min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            className="p-2 hover:bg-gray-100"
                            onClick={() => handleIncrease(item)}
                            disabled={isPending}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="font-medium">
                          {lineTotal.toFixed(2)}
                          {initialData.data?.cart?.currency
                            ? ` ${initialData.data.cart.currency}`
                            : "$"}
                        </span>
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
                  {optimisticItems.map((item) => {
                    const p = item.product
                    const unit = p.price?.final ?? 0
                    const lineTotal = unit * item.quantity
                    return (
                      <tr key={item.id} className="border-b last:border-b-0">
                        <td className="py-2 truncate max-w-30">{p.title}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">
                          {unit.toFixed(2)}
                          {initialData.data?.cart?.currency
                            ? ` ${initialData.data.cart.currency}`
                            : '$'}
                        </td>
                        <td className="py-2 text-right">
                          {lineTotal.toFixed(2)}
                          {initialData.data?.cart?.currency
                            ? ` ${initialData.data.cart.currency}`
                            : '$'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal</span>
                  <span>
                    {totals.subtotal.toFixed(2)}
                    {initialData.data?.cart?.currency
                      ? ` ${initialData.data.cart.currency}`
                      : '$'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">
                    {totals.subtotal.toFixed(2)}
                    {initialData.data?.cart?.currency
                      ? ` ${initialData.data.cart.currency}`
                      : "$"}
                  </span>
                </div>
              </div>
            </div>
            <Link href="/checkout" className="block">
              <Button
                className="w-full"
                size="lg"
                disabled={optimisticItems.length === 0 || isPending}
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
              <p className="text-center text-sm text-gray-600 mt-4">🔒 Secure checkout with SSL encryption</p>
          </div>
        </div>
      </main>
    </div>
  );
}
