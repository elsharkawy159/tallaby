"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Home,
  Compass,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
// import { useWishlist } from "@/hooks/useWishlist";
import { useScrollingNavbar } from "@/hooks/useScrollingNavbar";
import CategoryNav from "./CategoryNav";
import { cn } from "@/lib/utils";
// import { useCart } from "@/hooks/useCart";
import { useAuth } from "@workspace/auth/hooks/use-auth";
import { AuthDialog } from "@workspace/auth/components/auth-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";

const Header = () => {
  // const { cartItems } = useCart();
  // const { wishlistItems } = useWishlist();
  const { isVisible } = useScrollingNavbar();
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

            <div className="flex items-center gap-3">
              {/* Become a Partner button - hidden on mobile */}
              <Button className="text-sm" size="sm">
                Become a Partner
              </Button>
              {/* Mobile menu - Replace with Sheet */}
              <div>
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
                        </div>
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
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
      </header>

      {/* Mobile bottom navigation - Updated */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="container mx-auto">
          <nav className="grid grid-cols-4 py-3">
            <Link
              href="/"
              className="flex flex-col items-center text-gray-600 hover:text-primary"
            >
              <Home className="size-5" />
              <span className="text-xs mt-1">Home</span>
            </Link>

            <Link
              href="/explore"
              className="flex flex-col items-center text-gray-600 hover:text-primary"
            >
              <Compass className="size-5" />
              <span className="text-xs mt-1">Explore</span>
            </Link>

            <Link
              href="/cart"
              className="flex flex-col items-center text-gray-600 hover:text-primary"
            >
              <ShoppingCart className="size-5" />
              <span className="text-xs mt-1">Cart</span>
            </Link>

            {user ? (
              <Link
                href="/profile"
                className="flex flex-col items-center text-gray-600 hover:text-primary"
              >
                <User className="size-5" />
                <span className="text-xs mt-1">Profile</span>
              </Link>
            ) : (
              <button
                onClick={() => setIsAuthDialogOpen(true)}
                className="flex flex-col items-center text-gray-600 hover:text-primary"
              >
                <User className="size-5" />
                <span className="text-xs mt-1">Sign In</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </>
  );
};

export default Header;
