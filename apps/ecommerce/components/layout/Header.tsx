"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Heart, User, Menu, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
// import { useWishlist } from "@/hooks/useWishlist";
import { useScrollingNavbar } from "@/hooks/useScrollingNavbar";
import CategoryNav from "./CategoryNav";
import { cn } from "@/lib/utils";
// import { useCart } from "@/hooks/useCart";
import { useAuth } from "@workspace/auth/hooks/use-auth";
import { AuthDialog } from "@workspace/auth/components/auth-dialog";
const Header = () => {
  // const { cartItems } = useCart();
  // const { wishlistItems } = useWishlist();
  const { isVisible } = useScrollingNavbar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { user } = useAuth();

  // const cartItemsCount = cartItems.reduce(
  //   (total, item) => total + item.quantity,
  //   0
  // );

  return (
    <>
      <header
        className={cn(
          "bg-primary shadow-sm sticky top-0 z-50 transition-transform duration-300",
          isVisible ? "transform translate-y-0" : "transform -translate-y-full"
        )}
      >
        {/* Main header */}
        <div className="container mx-auto py-3.5">
          {/* Top section - Logo and Become a Partner */}
          <div className="flex items-center md:hidden justify-between">
            {/* Logo */}
            <Link href="/">
              <span className="text-4xl font-bold text-white">Bahja</span>
            </Link>

            {/* Become a Partner button - hidden on mobile */}
            <Button className="text:sm">Become a Partner</Button>
          </div>

          {/* Search bar - full width on mobile, hidden on desktop */}
          <div className="md:mt-0 mt-4 md:hidden">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search products..."
                className="w-full pl-11 rounded-full"
              />
              <Search className="size-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden md:flex items-center justify-between gap-8 md:mt-0 mt-4">
            <Link href="/">
              <span className="text-4xl font-bold text-white">Bahja</span>
            </Link>
            {/* Search bar */}
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for products, brands, categories..."
                  className="pl-11 rounded-full"
                />
                <Search className="size-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-6">
              {user ? (
                <Link
                  href="/profile"
                  className="text-white hover:text-gray-200"
                >
                  <User className="size-6" />
                </Link>
              ) : (
                <button
                  className="text-white hover:text-gray-200 hover:bg-transparent cursor-pointer"
                  onClick={() => setIsAuthDialogOpen(true)}
                >
                  <User className="size-6" />
                </button>
              )}

              <Link
                href="/cart"
                className="relative text-white hover:text-gray-200"
              >
                <ShoppingCart className="size-6" />
              </Link>

              <Link
                href="/wishlist"
                className="relative text-white hover:text-gray-200"
              >
                <Heart className="size-6" />
              </Link>

              <Button>Become a Partner</Button>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="bg-secondary md:block hidden">
          <div className="container mx-auto  py-2">
            <CategoryNav />
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="container mx-auto  py-4">
              <nav className="space-y-2">
                <Link
                  href="/categories"
                  className="block py-2 text-gray-700 hover:text-primary"
                >
                  All Categories
                </Link>
                <Link
                  href="/products"
                  className="block py-2 text-gray-700 hover:text-primary"
                >
                  All Products
                </Link>
                <Link
                  href="/stores"
                  className="block py-2 text-gray-700 hover:text-primary"
                >
                  Stores
                </Link>
                <Link
                  href="/about"
                  className="block py-2 text-gray-700 hover:text-primary"
                >
                  About
                </Link>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="container mx-auto">
          <nav className="grid grid-cols-4 py-4">
            <Link
              href="/shopping"
              className="flex flex-col items-center text-gray-600 hover:text-primary"
            >
              <ShoppingCart className="size-5" />
              <span className="text-xs mt-1">Shop</span>
            </Link>

            <Link
              href="/cart"
              className="flex flex-col items-center text-gray-600 hover:text-primary"
            >
              <ShoppingCart className="size-5" />
              <span className="text-xs mt-1">Cart</span>
            </Link>
            <Link
              href="/wishlist"
              className="flex flex-col items-center text-gray-600 hover:text-primary"
            >
              <Heart className="size-5" />
              <span className="text-xs mt-1">Wishlist</span>
            </Link>
            <Link
              href="/profile"
              className="flex flex-col items-center text-gray-600 hover:text-primary"
            >
              <User className="size-5" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </>
  );
};

export default Header;
