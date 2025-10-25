"use client";

import React from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  MapPin,
  ChevronDown,
} from "lucide-react";
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
} from "./header.lib";
import { useCart } from "@/providers/cart-provider";
import { useWishlist } from "@/providers/wishlist-provider";
import { useAddress } from "@/providers/address-provider";
import { AddressSelectorDialog } from "@/components/shared/address-dialog";

export const SearchBar = ({
  placeholder,
  className,
  variant = "desktop",
}: SearchBarProps) => {
  const searchPlaceholder = placeholder || getSearchPlaceholder(variant);

  return (
    <div className={cn("relative flex-1", className)}>
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
  const { user } = useAuth();

  // Hide button if user is already a seller
  if (user?.user_metadata?.is_seller === true) {
    return null;
  }

  return (
    <Button asChild className={cn("text-sm", className)} size="sm">
      <Link href={"/become-seller"}>Become a Partner</Link>
    </Button>
  );
};

export const UserAuth = ({ variant = "desktop", className }: UserAuthProps) => {
  const { open: openAuthDialog } = useAuthDialog();
  const { user, seller, logout, isLoading, isSigningOut } = useAuth();
  
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
      <UserMenu
        variant={variant}
        user={user}
        seller={seller}
        logout={logout}
        isSigningOut={isSigningOut}
      />
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
    <Button asChild size="icon" variant="ghost">
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
    </Button>
  );
};

export const WishlistLink = ({ className }: { className?: string }) => {
  const { itemCount } = useWishlist();
  return (
    <Button asChild size="icon" variant="ghost">
      <Link
        href="/profile/wishlist"
        className={cn("relative text-white hover:text-gray-200", className)}
      >
        <Heart className="size-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-4.5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </Link>
    </Button>
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

export const DeliveryLocationSelector = ({
  className,
}: {
  className?: string;
}) => {
  const { user } = useAuth();
  const { defaultAddress, addresses, isLoading } = useAddress();

  // If not logged in, show guest message
  if (!user) {
    return null;
  }

  // If loading addresses
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-white", className)}>
        <MapPin className="h-5 w-5 flex-shrink-0 animate-pulse" />
        <div className="flex flex-col items-start text-left">
          <span className="text-xs font-normal">Loading...</span>
          <span className="text-sm font-semibold">Please wait</span>
        </div>
      </div>
    );
  }

  // Use defaultAddress from provider or fallback to first address
  const currentAddress = defaultAddress || addresses[0];

  // If no address, prompt to add one
  if (!currentAddress) {
    return (
      <AddressSelectorDialog
        trigger={
          <button
            className={cn(
              "flex items-center gap-2 text-white hover:text-gray-200 transition-colors cursor-pointer",
              className
            )}
          >
            <MapPin className="h-5 w-5 flex-shrink-0" />
            <div className="flex flex-col items-start text-left">
              <span className="text-xs font-normal">
                Hello, {user.user_metadata?.full_name?.split(" ")[0] || "there"}
              </span>
              <span className="text-sm font-semibold flex items-center gap-1">
                Add delivery address
                <ChevronDown className="h-3 w-3" />
              </span>
            </div>
          </button>
        }
      />
    );
  }

  // Show delivery location with address
  return (
    <AddressSelectorDialog
      trigger={
        <button
          className={cn(
            "flex items-center gap-2 text-white hover:text-gray-200 transition-colors cursor-pointer",
            className
          )}
        >
          <MapPin className="h-5 w-5 flex-shrink-0" />
          <div className="flex flex-col items-start text-left">
            <span className="text-xs font-normal">
              Deliver to{" "}
              {currentAddress.fullName.split(" ")[0] ||
                user.user_metadata?.full_name?.split(" ")[0] ||
                "you"}
            </span>
            <span className="text-sm font-semibold flex items-center gap-1 truncate max-w-[150px]">
              {currentAddress.city || currentAddress.state || "Your location"}
              <ChevronDown className="h-3 w-3 flex-shrink-0" />
            </span>
          </div>
        </button>
      }
    />
  );
};

export const DesktopNavigation = ({ className }: DesktopNavigationProps) => {
  return (
    <div
      className={cn(
        "hidden md:flex items-center justify-between gap-4 lg:gap-5",
        className
      )}
    >
      <Logo />

      <DeliveryLocationSelector className="hidden lg:flex" />

      <SearchBar variant="desktop" />
      <LanguageSwitcher />

      <UserAuth variant="desktop" />
      <CartLink />
      <WishlistLink />
      <BecomeSellerButton />
    </div>
  );
};

import { usePathname } from "next/navigation";
import { Logo } from "../logo";
import { LanguageSwitcher } from "./language-switcher";

export const BottomNavigation = ({ className }: BottomNavigationProps) => {
  const { open: openAuthDialog } = useAuthDialog();
  const { user, seller, logout, isLoading, isSigningOut } = useAuth();
  const pathname = usePathname();

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
            // Determine if this tab is active
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center text-gray-600 hover:text-primary transition-colors",
                  isActive && "text-primary font-semibold"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {IconComponent && (
                  <IconComponent
                    className={cn("size-5", isActive && "text-primary")}
                  />
                )}
                <span
                  className={cn("text-xs mt-1", isActive && "text-primary")}
                >
                  {item.label}
                </span>
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
              <UserMenu
                variant="mobile"
                user={user}
                seller={seller}
                logout={logout}
                isSigningOut={isSigningOut}
              />
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
