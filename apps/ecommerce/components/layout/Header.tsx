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
  CartLink,
  WishlistLink,
} from "./header.chunks";
import { Logo } from "../logo";
import CategoryNav from "./CategoryNav";
import { LanguageSwitcher } from "./language-switcher";

// Main Header Component - with scroll visibility logic
const MainHeader = () => {
  // const { isVisible } = useScrollingNavbar();

  return (
    <div
      className={cn(
        "bg-primary shadow-xs"
        // isVisible ? "transform translate-y-0" : "transform -translate-y-full"
      )}
    >
      <div className="py-2.5 container">
        {/* Mobile top section */}
        <div className="flex items-center md:hidden justify-between">
          <Logo />
          <BecomeSellerButton />
          {/* <MobileNavigation /> */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <DeliveryLocationSelector />
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
            <DeliveryLocationSelector className="hidden lg:flex" />
            <LanguageSwitcher />
          </div>

          <SearchBar variant="desktop" />

          <div className="flex items-center gap-4">
            <UserAuth variant="desktop" />
            <CartLink />
            <WishlistLink />
            <BecomeSellerButton />
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

const Header = ({ className }: HeaderProps) => {
  return (
    <>
      <header className={cn("z-50", className)}>
        <MainHeader />
        {/* <SubBar /> */}
      </header>

      {/* Mobile bottom navigation */}
      <BottomNavigation />
    </>
  );
};

export default Header;
