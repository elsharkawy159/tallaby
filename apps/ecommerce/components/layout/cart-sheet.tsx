"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/providers/cart-provider";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Trash2, ShoppingCart, Plus, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { formatPrice } from "@workspace/lib";
import Link from "next/link";

interface CartSheetProps {
  className?: string;
}

export default function CartSheet({ className }: CartSheetProps) {
  const {
    cartData,
    itemCount,
    subtotal,
    cartItems,
    updateQuantity,
    removeFromCart,
    isItemLoading,
  } = useCart();

  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();

  // Show cart sheet when there are items
  useEffect(() => {
    setIsVisible(cartItems.length > 0);
  }, [cartItems.length]);

  if (!isVisible) return null;

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(itemId);
    } else {
      await updateQuantity(itemId, newQuantity);
    }
  };

  return (
    <>
      {pathname == "/products" && (
        <div
          className={cn(
            "fixed right-0 top-0 h-full w-[130px] bg-background border-l border-border shadow-lg z-50 md:flex hidden flex-col",
            className
          )}
        >
          {/* Header */}
          <div className="p-3 border-b border-border bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-xs font-medium">Cart</span>
              </div>
              <Badge variant="secondary" className="text-xs h-5 px-1">
                {itemCount}
              </Badge>
            </div>
          </div>

          {/* Cart Items */}
          <ScrollArea className="flex-1 h-96">
            <div className="p-2 space-y-2">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-lg p-2 space-y-2"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-muted rounded-md overflow-hidden">
                    {item.product.images && item.product.images[0] ? (
                      <Image
                        src={getPublicUrl(item.product.images[0], "products")}
                        alt={item.product.title}
                        width={120}
                        height={120}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-1">
                    <h4
                      className="text-xs font-medium leading-tight overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                      title={item.product.title}
                    >
                      {item.product.title}
                    </h4>
                    <p
                      className="text-xs text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: formatPrice(
                          typeof item.price === "string"
                            ? parseFloat(item.price)
                            : item.price,
                          locale
                        ),
                      }}
                    />
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {item.quantity === 1 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.id)}
                          disabled={isItemLoading(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          disabled={isItemLoading(item.id)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      )}
                      <span className="text-xs font-medium min-w-[20px] text-center">
                        {isItemLoading(item.id) ? (
                          <Loader2 className="size-3 animate-spin mx-auto" />
                        ) : (
                          item.quantity
                        )}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        disabled={isItemLoading(item.id)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center flex-col justify-between text-sm">
              <span className="font-medium">Total</span>
              <span
                className="font-bold"
                dangerouslySetInnerHTML={{
                  __html: formatPrice(subtotal, locale),
                }}
              />
            </div>
            <Button size="sm" className="w-full text-xs h-8">
              <Link href="/cart">View Cart</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
