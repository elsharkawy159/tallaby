import { cn } from "@/lib/utils";
import type { HeaderProps } from "./header.types";
import { BottomNavigation } from "./bottom-navigation";
import { Logo } from "../logo";
import { LanguageSwitcher } from "./language-switcher";
import { SearchBar } from "./search-bar";
import { AuthLink } from "./auth-link";
import { CartCount } from "./cart-count";
import { WishlistCount } from "./wishlist-count";
import { NotificationButton } from "./notification-button";
// import { DeliveryLocation } from "./delivery-location";
import { BecomeSellerButton } from "./header.chunks";
import { createClient } from "@/supabase/server";
import { Suspense } from "react";
import { Button, Spinner } from "@workspace/ui/components";
import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";

// Main Header Component
const MainHeader = async () => {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  return (
    <div className={cn("bg-primary shadow-xs h-full w-full")}>
      <div className="py-2.5 container">
        {/* Mobile top section */}
        <div className="flex items-center md:hidden justify-between">
          <Logo />
          <BecomeSellerButton user={user} />
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {/* <DeliveryLocation user={user} /> */}
          </div>
        </div>

        <div className="md:mt-0 mt-3 md:hidden">
          <SearchBar variant="mobile" className="w-full" />
        </div>

        {/* Desktop layout */}
        <div
          className={cn(
            "hidden md:flex items-center justify-between gap-4 lg:gap-5 md:mt-0 mt-4"
          )}
        >
          <div className="flex items-center gap-4">
            <Logo />
            {/* <DeliveryLocation className="hidden lg:flex" user={user} /> */}
            {/* <LanguageSwitcher /> */}
          </div>

          <SearchBar variant="desktop" />

          <div className="flex items-center gap-4">
            <AuthLink variant="desktop" />

            {/* Notifications */}
            {user && <NotificationButton />}

            {/* Cart */}
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
                <Suspense>
                  <CartCount />
                </Suspense>
              </Link>
            </Button>

            {/* Wishlist */}
            <Button asChild size="icon" variant="ghost">
              <Link
                href="/profile/wishlist"
                className={cn("relative text-white hover:text-gray-200")}
              >
                <Heart className="size-6" />
                <Suspense>
                  <WishlistCount />
                </Suspense>
              </Link>
            </Button>
            <BecomeSellerButton user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = async ({ className }: HeaderProps) => {
  return (
    <>
      <header className={cn("sticky top-0 z-50", className)}>
        <MainHeader />
      </header>

      {/* Mobile bottom navigation */}
      <BottomNavigation />
    </>
  );
};

export default Header;
