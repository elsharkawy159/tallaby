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

const Header = () => {
  // const { cartItems } = useCart();
  // const { wishlistItems } = useWishlist();
  const { isVisible } = useScrollingNavbar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // const cartItemsCount = cartItems.reduce(
  //   (total, item) => total + item.quantity,
  //   0
  // );

  return (
    <header
      className={cn(
        "bg-primary shadow-sm sticky top-0 z-50 transition-transform duration-300",
        isVisible ? "transform translate-y-0" : "transform -translate-y-full"
      )}
    >
      {/* Main header */}
      <div className="container mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/">
            <span className="text-4xl font-bold text-white">Logo</span>
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 ml-6">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search for products, brands, categories..."
                className="pl-11"
              />

              <Search className="size-5 absolute left-4 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-x-4 2xl:gap-x-8">
            <Link href="/profile">
              <User className="size-6 text-white" />
            </Link>

            <Link href="/cart" className="relative">
              <ShoppingCart className="size-6 text-white" />
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs size-4 rounded-full flex items-center justify-center">
                2
              </span>
            </Link>
            <Link href="/wishlist" className="relative">
              <Heart className="size-6 text-white" />
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs size-4 rounded-full flex items-center justify-center">
                5
              </span>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
          <Button>Become a Partner</Button>
        </div>

        {/* Mobile search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search products..."
              className="w-full pl-4 pr-12 py-3"
            />
            <Button
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-[#89A8B1]">
        <div className="container mx-auto px-4 py-2">
          <CategoryNav />
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-4">
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
  );
};

export default Header;
