"use client";

import React from "react";
import { useScrollingNavbar } from "@/hooks/useScrollingNavbar";
import CategoryNav from "./CategoryNav";
import { cn } from "@/lib/utils";
import type { HeaderProps } from "./header.types";
import {
  Logo,
  SearchBar,
  BecomeSellerButton,
  MobileNavigation,
  DesktopNavigation,
  BottomNavigation,
} from "./header.chunks";

const Header = ({ className }: HeaderProps) => {
  const { isVisible } = useScrollingNavbar();

  return (
    <>
      <header
        className={cn(
          "bg-primary shadow-sm sticky top-0 z-50 transition-transform duration-250",
          isVisible ? "transform translate-y-0" : "transform -translate-y-full",
          className
        )}
      >
        {/* Main header */}
        <div className="container py-3.5">
          {/* Mobile top section */}
          <div className="flex items-center md:hidden justify-between">
            <Logo />
            <div className="flex items-center gap-3">
              <BecomeSellerButton />
              <MobileNavigation />
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="md:mt-0 mt-4 md:hidden">
            <SearchBar variant="mobile" className="w-full" />
          </div>

          {/* Desktop layout */}
          <DesktopNavigation className="md:mt-0 mt-4" />
        </div>

        {/* Category Navigation - Hidden on mobile, visible on desktop */}
        <div className="bg-secondary hidden md:block">
          <div className="container py-2">
            <CategoryNav />
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <BottomNavigation />
    </>
  );
};

export default Header;
