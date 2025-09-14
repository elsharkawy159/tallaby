"use client";

import React from "react";
import Link from "next/link";
import { Search, ShoppingCart, Heart, User, Menu } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { useAuthDialog } from "@/hooks/use-auth-dialog";
import { useAuth } from "@/providers/auth-provider";
import CategoryNav from "./CategoryNav";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";
import type {
  LogoProps,
  SearchBarProps,
  MobileNavigationProps,
  DesktopNavigationProps,
  UserAuthProps,
  BottomNavigationProps,
} from "./header.types";
import {
  navigationItems,
  bottomNavigationItems,
  getSearchPlaceholder,
  getLogoText,
  getBecomeSellerUrl,
} from "./header.lib";
import { useCart } from "@/providers/cart-provider";
import { useWishlist } from "@/providers/wishlist-provider";

export const Logo = ({ className }: LogoProps) => {
  return (
    <Link href="/" className={className}>
      <span className="text-4xl font-bold text-white">{getLogoText()}</span>
    </Link>
  );
};

export const SearchBar = ({
  placeholder,
  className,
  variant = "desktop",
}: SearchBarProps) => {
  const searchPlaceholder = placeholder || getSearchPlaceholder(variant);

  return (
    <div className={cn("relative", className)}>
      <Input
        type="text"
        placeholder={searchPlaceholder}
        className="pl-11 rounded-full"
      />
      <Search className="size-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
    </div>
  );
};

export const BecomeSellerButton = ({ className }: { className?: string }) => {
  return (
    <Button asChild className={cn("text-sm", className)} size="sm">
      <Link href={getBecomeSellerUrl()}>Become a Partner</Link>
    </Button>
  );
};

export const UserAuth = ({ variant = "desktop", className }: UserAuthProps) => {
  const { open: openAuthDialog } = useAuthDialog();
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div
        className={cn(
          "text-white opacity-50",
          variant === "mobile" &&
            "flex flex-col items-center text-gray-400 opacity-50",
          className
        )}
      >
        <Button variant="ghost" size="icon" className="text-white">
          <User
            className={cn(
              "size-6 animate-pulse",
              variant === "mobile" && "size-5"
            )}
          />
        </Button>
        {variant === "mobile" && (
          <span className="text-xs mt-1">Loading...</span>
        )}
      </div>
    );
  }

  if (user) {
    return (
      <div
        className={cn(
          variant === "mobile" && "flex flex-col items-center",
          className
        )}
      >
        <UserMenu variant={variant} />
        {variant === "mobile" && (
          <span className="text-xs mt-1 text-gray-600">Profile</span>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "text-white hover:text-gray-200 hover:bg-transparent cursor-pointer transition-colors",
        variant === "mobile" &&
          "flex flex-col items-center text-gray-600 hover:text-primary transition-colors",
        className
      )}
      onClick={() => openAuthDialog("signin")}
      title="Sign in to your account"
    >
      <User className={cn("size-6", variant === "mobile" && "size-5")} />
      {variant === "mobile" && <span className="text-xs mt-1">Sign In</span>}
    </Button>
  );
};

export const CartLink = ({ className }: { className?: string }) => {
  const { itemCount } = useCart();
  return (
    <Link
      href="/cart"
      className={cn("relative text-white hover:text-gray-200", className)}
    >
      <ShoppingCart className="size-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-4.5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  );
};

export const WishlistLink = ({ className }: { className?: string }) => {
  const { itemCount } = useWishlist();
  return (
    <Link
      href="/wishlist"
      className={cn("relative text-white hover:text-gray-200", className)}
    >
      <Heart className="size-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-4.5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  );
};

export const MobileNavigation = ({ className }: MobileNavigationProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white">
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-6 px-4">
          <nav className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-500">
                Categories
              </h3>
              <div className="flex flex-col space-y-2">
                <CategoryNav />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-500">
                Quick Links
              </h3>
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-2 text-gray-700 hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const DesktopNavigation = ({ className }: DesktopNavigationProps) => {
  return (
    <div
      className={cn(
        "hidden md:flex items-center justify-between gap-8",
        className
      )}
    >
      <Logo />

      <div className="flex-1">
        <SearchBar variant="desktop" />
      </div>

      <div className="flex items-center gap-6">
        <UserAuth variant="desktop" />
        <CartLink />
        <WishlistLink />
        <BecomeSellerButton />
      </div>
    </div>
  );
};

export const BottomNavigation = ({ className }: BottomNavigationProps) => {
  const { open: openAuthDialog } = useAuthDialog();
  const { user, isLoading } = useAuth();

  return (
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50",
        className
      )}
    >
      <div className="container mx-auto">
        <nav className="grid grid-cols-4 py-3">
          {bottomNavigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center text-gray-600 hover:text-primary"
              >
                {IconComponent && <IconComponent className="size-5" />}
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}

          {isLoading ? (
            <div className="flex flex-col items-center text-gray-400 opacity-50">
              <User className="size-5 animate-pulse" />
              <span className="text-xs mt-1">Loading...</span>
            </div>
          ) : user ? (
            <div className="flex flex-col items-center">
              <UserMenu variant="mobile" />
              <span className="text-xs mt-1 text-gray-600">Profile</span>
            </div>
          ) : (
            <button
              onClick={() => openAuthDialog("signin")}
              className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors"
              title="Sign in to your account"
            >
              <User className="size-5" />
              <span className="text-xs mt-1">Sign In</span>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
};
