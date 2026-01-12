import { getBottomNavigationItems } from "./header.lib";
import { cn } from "@/lib/utils";
import { BottomNavClient } from "./bottom-navigation.client";
import { AuthLink } from "./auth-link";
import { CartCount } from "./cart-count";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { ShoppingCart } from "lucide-react";
import { getTranslations } from "next-intl/server";

export const BottomNavigation = async () => {
  const items = await getBottomNavigationItems();

  // Separate cart item from other items
  const cartItem = items.find((item) => item.href === "/cart");
  const otherItems = items.filter((item) => item.href !== "/cart");

  return (
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      )}
    >
      <div className="container mx-auto">
        <nav className="flex items-center justify-around py-3">
          <BottomNavClient items={otherItems} />

          {/* Cart item with count badge */}
          {cartItem && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className={cn(
                "flex flex-col items-center text-gray-600 hover:text-primary transition-colors relative"
              )}
            >
              <Link href={cartItem.href}>
                <ShoppingCart className="size-4.5" />
                <span className="text-xs">{cartItem.label}</span>
                <Suspense fallback={null}>
                  <CartCount />
                </Suspense>
              </Link>
            </Button>
          )}

          <AuthLink variant="mobile" />
        </nav>
      </div>
    </div>
  );
};
