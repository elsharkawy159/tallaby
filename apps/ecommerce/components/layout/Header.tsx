import React from "react";
// import { useScrollingNavbar } from "@/hooks/useScrollingNavbar";
import { cn } from "@/lib/utils";
import type { HeaderProps } from "./header.types";
import {
  SearchBar,
  MobileNavigation,
  DesktopNavigation,
  BottomNavigation,
  BecomeSellerButton,
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
      <div className="lg:px-16 md:px-10 px-4 py-3.5">
        {/* Mobile top section */}
        <div className="flex items-center md:hidden justify-between">
          <BecomeSellerButton />
          <LanguageSwitcher />
          <Logo />
          <MobileNavigation />
        </div>

        {/* Mobile search bar */}
        <div className="md:mt-0 mt-4 md:hidden">
          <SearchBar variant="mobile" className="w-full" />
        </div>

        {/* Desktop layout */}
        <DesktopNavigation className="md:mt-0 mt-4" />
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
      <header className={cn("sticky top-0 z-50", className)}>
        <MainHeader />
        {/* <SubBar /> */}
      </header>

      {/* Mobile bottom navigation */}
      <BottomNavigation />
    </>
  );
};

export default Header;
