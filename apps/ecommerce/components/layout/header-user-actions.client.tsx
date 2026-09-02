"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@workspace/ui/components/button";
import { Heart, ShoppingCart } from "lucide-react";
import { AuthLink } from "./auth-link";
import { CartCountClient } from "./cart-count.client";
import { WishlistCount } from "./wishlist-count";
import { NotificationButton } from "./notification-button";
import { BecomeSellerButton } from "./header.chunks";
import { cn } from "@/lib/utils";

export function HeaderUserActions() {
  return (
    <div className="flex items-center gap-4">
      <AuthLink variant="desktop" />
      <NotificationButton />

      <Button
        asChild
        size="icon"
        variant="ghost"
        className={cn(
          "relative flex flex-col items-center md:text-white text-gray-600 hover:text-gray-200"
        )}
      >
        <Link href="/cart">
          <ShoppingCart className={cn("md:size-6 size-5")} />
          <CartCountClient />
        </Link>
      </Button>

      <Button asChild size="icon" variant="ghost">
        <Link
          href="/profile/wishlist"
          className={cn("relative text-white hover:text-gray-200")}
        >
          <Heart className="size-6" />
          <WishlistCount />
        </Link>
      </Button>

      <BecomeSellerButton />
    </div>
  );
}
