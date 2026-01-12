"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@workspace/ui/components/sheet";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Minus, Plus, Trash2, Loader2, ShoppingBag } from "lucide-react";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { useLocale } from "next-intl";
import { formatPrice } from "@workspace/lib";
import { cn } from "@/lib/utils";
import React, { useState, useTransition } from "react";
import {
  updateCartItem,
  removeFromCart as removeFromCartAction,
} from "@/actions/cart";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: any[];
  itemCount: number;
  subtotal: number;
}

export function CartSheet({
  open,
  onOpenChange,
  cartItems: initialCartItems,
  itemCount: initialItemCount,
  subtotal: initialSubtotal,
}: CartSheetProps) {
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [itemCount, setItemCount] = useState(initialItemCount);
  const [subtotal, setSubtotal] = useState(initialSubtotal);
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const router = useRouter();
  const locale = useLocale();
  const tToast = useTranslations("toast");

  const updateQuantity = async (itemId: string, quantity: number) => {
    setLoadingItems((prev) => new Set(prev).add(itemId));
    try {
      const result = await updateCartItem(itemId, quantity);
      if (result.success) {
        router.refresh();
        toast.success(tToast("cartUpdated"));
      } else {
        toast.error(result.error || "Failed to update cart");
      }
    } catch (error) {
      toast.error(tToast("failedToUpdateCart"));
    } finally {
      setLoadingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    setLoadingItems((prev) => new Set(prev).add(itemId));
    try {
      const result = await removeFromCartAction(itemId);
      if (result.success) {
        router.refresh();
        toast.success(tToast("itemRemoved"));
      } else {
        toast.error(result.error || "Failed to remove item");
      }
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setLoadingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const isItemLoading = (itemId: string) => loadingItems.has(itemId);
  const isProductLoading = (itemId: string) => loadingItems.has(itemId);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(itemId);
    } else {
      await updateQuantity(itemId, newQuantity);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            Shopping Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <ShoppingBag className="size-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start adding items to your cart
            </p>
            <Button asChild>
              <Link href="/products" onClick={() => onOpenChange(false)}>
                Continue Shopping
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-4 px-4 max-h-[calc(100vh-230px)]">
              <div className="py-0">
                {cartItems.map((item: any, index: number) => {
                  const product = item.product;
                  const unitPrice = Number(item.price);
                  const lineTotal = unitPrice * item.quantity;
                  const image = product?.images?.[0]
                    ? getPublicUrl(product.images[0], "products")
                    : "/png product.png";

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex gap-4 p-4 border-b items-center",
                        index === cartItems.length - 1 && "border-b-0"
                      )}
                    >
                      <Link
                        href={`/products/${product.slug}`}
                        onClick={() => onOpenChange(false)}
                      >
                        <Image
                          src={image}
                          alt={product.title}
                          width={100}
                          height={100}
                          className="object-contain h-20 w-20"
                        />
                      </Link>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={() => onOpenChange(false)}
                            className="flex-1 min-w-0"
                          >
                            <h4 className="font-medium text-sm leading-tight line-clamp-2 hover:text-primary transition-colors">
                              {product.title}
                            </h4>
                            {product.brand?.name && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {product.brand.name}
                              </p>
                            )}
                          </Link>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={() => removeFromCart(item.id)}
                            disabled={isProductLoading(item.id)}
                          >
                            {isProductLoading(item.id) ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-r-none"
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity - 1)
                              }
                              disabled={
                                item.quantity <= 1 || isItemLoading(item.id)
                              }
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="px-3 py-1 min-w-[2.5rem] text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-l-none"
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity + 1)
                              }
                              disabled={
                                item.quantity >= Number.MAX_SAFE_INTEGER ||
                                isItemLoading(item.id)
                              }
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <p
                              className="text-sm font-semibold"
                              dangerouslySetInnerHTML={{
                                __html: formatPrice(lineTotal, locale),
                              }}
                            />
                            {item.quantity > 1 && (
                              <p
                                className="text-xs text-muted-foreground"
                                dangerouslySetInnerHTML={{
                                  __html: formatPrice(unitPrice, locale),
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <SheetFooter className="flex-col gap-4 sm:flex-row sm:justify-between border-t pt-4 mt-4">
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span
                    className="font-semibold"
                    dangerouslySetInnerHTML={{
                      __html: formatPrice(subtotal, locale),
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span
                    className="text-lg font-bold text-primary"
                    dangerouslySetInnerHTML={{
                      __html: formatPrice(subtotal, locale),
                    }}
                  />
                </div>
              </div>
              <div className="w-full space-y-2">
                <Button asChild className="w-full" size="lg">
                  <Link
                    href="/cart/checkout"
                    onClick={() => onOpenChange(false)}
                  >
                    Proceed to Checkout
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/cart" onClick={() => onOpenChange(false)}>
                    View Cart
                  </Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
