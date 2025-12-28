import { Suspense } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { bottomNavigationItems } from "./header.lib";
import { cn } from "@/lib/utils";
import { BottomNavClient } from "./bottom-navigation.client";
import { CartCount } from "./cart-count";
import { AuthLink } from "./auth-link";
import { Button } from "@workspace/ui/components/button";

export const BottomNavigation = async () => {
  return (
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      )}
    >
      <div className="container mx-auto">
        <nav className="flex items-center justify-between py-4 px-4">
          <BottomNavClient items={bottomNavigationItems} />

          {/* Cart Button */}
          <Button
            asChild
            size="icon"
            variant="ghost"
            className={cn(
              "relative flex flex-col items-center text-gray-600 hover:text-primary transition-colors"
            )}
          >
            <Link href="/cart">
              <ShoppingCart className="size-5" />
              <span className="text-xs">Cart</span>
              <Suspense>
                <CartCount />
              </Suspense>
            </Link>
          </Button>

          <AuthLink />
        </nav>
      </div>
    </div>
  );
};
