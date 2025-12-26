import React from "react";
// import { useScrollingNavbar } from "@/hooks/useScrollingNavbar";
import { cn } from "@/lib/utils";
import type { HeaderProps } from "./header.types";
import {
  SearchBar,
  BottomNavigation,
  BecomeSellerButton,
  DeliveryLocationSelector,
  UserAuth,
  Cart,
  WishlistLink,
} from "./header.chunks";
import { Logo } from "../logo";
import CategoryNav from "./CategoryNav";
import { LanguageSwitcher } from "./language-switcher";
import { createClient } from "@/supabase/server";
import { getSellerProfile } from "@/actions/seller";
import { getCartItems } from "@/actions/cart";
import { getWishlistItems } from "@/actions/wishlist";
import { getAddresses } from "@/actions/customer";
import type { User } from "@supabase/supabase-js";

// Main Header Component - with scroll visibility logic
const MainHeader = ({
  user,
  seller,
  cartItemCount,
  wishlistItemCount,
  defaultAddress,
  addresses,
  cartResult,
}: {
  user: User | null;
  seller: any;
  cartItemCount: number;
  wishlistItemCount: number;
  defaultAddress: any;
  addresses: any[];
  cartResult: any;
}) => {
  // const { isVisible } = useScrollingNavbar();

  return (
    <div
      className={cn(
        "bg-primary shadow-xs h-full w-full"
        // isVisible ? "transform translate-y-0" : "transform -translate-y-full"
      )}
    >
      <div className="py-2.5 container">
        {/* Mobile top section */}
        <div className="flex items-center md:hidden justify-between">
          <Logo />
          <BecomeSellerButton user={user} />
          {/* <MobileNavigation /> */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <DeliveryLocationSelector
              user={user}
              defaultAddress={defaultAddress}
              addresses={addresses}
              isLoading={false}
            />
          </div>
        </div>

        <div className="md:mt-0 mt-3 md:hidden">
          <SearchBar variant="mobile" className="w-full" />
        </div>
        {/* Mobile search bar */}

        {/* Desktop layout */}
        <div
          className={cn(
            "hidden md:flex items-center justify-between gap-4 lg:gap-5 md:mt-0 mt-4"
          )}
        >
          <div className="flex items-center gap-4">
            <Logo />
            <DeliveryLocationSelector
              className="hidden lg:flex"
              user={user}
              defaultAddress={defaultAddress}
              addresses={addresses}
              isLoading={false}
            />
            <LanguageSwitcher />
          </div>

          <SearchBar variant="desktop" />

          <div className="flex items-center gap-4">
            <UserAuth variant="desktop" user={user} seller={seller} />
            <Cart
              itemCount={cartItemCount}
              cartData={cartResult.success ? cartResult.data : null}
            />
            <WishlistLink itemCount={wishlistItemCount} />
            <BecomeSellerButton user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

// SubBar Component - always visible category navigation
const SubBar = () => {
  return (
    <div className="bg-secondary hidden md:block">
      <div className="container py-2">
        <CategoryNav />
      </div>
    </div>
  );
};

const Header = async ({ className }: HeaderProps) => {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  let seller = null;
  if (user?.user_metadata?.is_seller === true) {
    const sellerResult = await getSellerProfile(user.id);
    if (sellerResult.success && sellerResult.data) {
      seller = sellerResult.data;
    }
  }

  // Fetch cart and wishlist data server-side
  const cartResult = await getCartItems();
  const cartItemCount = cartResult.success
    ? (cartResult.data?.itemCount ?? 0)
    : 0;

  const wishlistResult = await getWishlistItems();
  const wishlistItemCount = wishlistResult.success
    ? (wishlistResult.data?.length ?? 0)
    : 0;

  // Fetch addresses server-side
  const addressesResult = await getAddresses();
  const addresses = addressesResult.success ? (addressesResult.data ?? []) : [];
  const defaultAddress = addresses.find((addr: any) => addr.isDefault) ?? null;

  return (
    <>
      <header className={cn("sticky top-0 z-50", className)}>
        <MainHeader
          user={user}
          seller={seller}
          cartItemCount={cartItemCount}
          wishlistItemCount={wishlistItemCount}
          defaultAddress={defaultAddress}
          addresses={addresses}
          cartResult={cartResult}
        />
        {/* <SubBar /> */}
      </header>

      {/* Mobile bottom navigation */}
      <BottomNavigation
        user={user}
        seller={seller}
        cartItemCount={cartItemCount}
        wishlistItemCount={wishlistItemCount}
      />
    </>
  );
};

export default Header;
