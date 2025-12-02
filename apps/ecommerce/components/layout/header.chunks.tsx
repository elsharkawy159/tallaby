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
import { useQuery } from "@tanstack/react-query";
import { useAuthDialog } from "@/hooks/use-auth-dialog";
import { useAuth } from "@/providers/auth-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { getProducts } from "@/actions/products";
import CategoryNav from "./CategoryNav";
import { UserMenu } from "./user-menu";
import { cn, resolvePrice, resolvePrimaryImage } from "@/lib/utils";
import type {
  SearchBarProps,
  MobileNavigationProps,
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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const locale = useLocale();

  // Fetch search results using useQuery
  const { data: searchResultsData, isLoading: isSearching } = useQuery({
    queryKey: ["search-products", debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim() || debouncedSearchQuery.length < 2) {
        return { success: true, data: [] };
      }
      return getProducts({
        searchQuery: debouncedSearchQuery.trim(),
        isActive: true,
        limit: 5,
      });
    },
    enabled: debouncedSearchQuery.length >= 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Extract search results
  const searchResults = searchResultsData?.success
    ? (searchResultsData.data || []).slice(0, 5)
    : [];

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Open dropdown when there are results
  React.useEffect(() => {
    if (searchResults.length > 0 && searchQuery) {
      setIsOpen(true);
    }
  }, [searchResults.length, searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setIsOpen(true);
    }
  };

  const searchPlaceholder = placeholder || getSearchPlaceholder(variant);

  return (
    <div className={cn("relative flex-1 max-w-2xl", className)} ref={searchRef}>
      <Input
        type="text"
        placeholder={searchPlaceholder}
        className="pl-11 rounded-full"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
      />
      {isSearching ? (
        <Spinner className="text-gray-500 size-5 absolute left-4 top-1/2 transform -translate-y-1/2" />
      ) : (
        <Search className="size-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
      )}
      {/* Search Results Dropdown */}
      {isOpen && searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : searchResults.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {searchResults.map((product) => {
                const price = resolvePrice(product as ProductCardProps);

                const productImage = resolvePrimaryImage(
                  product.images as string[] | undefined
                );

                return (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={() => {
                        setSearchQuery("");
                        setIsOpen(false);
                      }}
                      className="block p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={productImage}
                          width={48}
                          height={48}
                          alt={product.title || "Product"}
                          className="w-12 h-12 object-contain rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {product.category?.name || "No category"}
                          </p>
                        </div>
                        <span
                          className="md:text-lg text-sm font-semibold"
                          dangerouslySetInnerHTML={{
                            __html: formatPrice(price, locale),
                          }}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
              {searchResults.length >= 5 && (
                <li>
                  <Link
                    // href={`/search?q=${encodeURIComponent(searchQuery)}`}
                    href={`/products?searchQuery=${encodeURIComponent(searchQuery)}`}
                    onClick={() => {
                      setSearchQuery("");
                      setIsOpen(false);
                    }}
                    className="block p-3 text-center text-sm font-medium text-primary hover:bg-gray-50"
                  >
                    View all results
                  </Link>
                </li>
              )}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              No products found
            </div>
          )}
        </div>
      )}
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
        {variant === "mobile" && <span className="text-xs">Loading...</span>}
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
      {variant === "mobile" && <span className="text-xs">Sign In</span>}
    </Button>
  );
};

export const CartLink = ({ className }: { className?: string }) => {
  const { itemCount } = useCart();
  return (
    <Button asChild size="icon" variant="ghost">
      <Link
        href="/cart"
        className={cn(
          "relative flex flex-col items-center md:text-white text-gray-600 hover:text-gray-200",
          className
        )}
      >
        <ShoppingCart className="md:size-6 size-5" />
        {itemCount > 0 && (
          <span className="absolute md:-top-1 -top-2 md:-right-1 -right-2 bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
        <span className="text-xs md:hidden">Cart</span>
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
          <nav className="space-y-2">
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
                  className="block text-gray-700 hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <LanguageSwitcher />
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
            <MapPin className="md:size-5 size-4 flex-shrink-0" />
            <div className="flex flex-col items-start text-left">
              <div className="text-xs font-normal">
                Deliver to{" "}
                <span className="capitalize">
                  {user.user_metadata?.full_name?.split(" ")[0] ||
                    user.email?.split("@")[0] ||
                    "User"}
                </span>
              </div>
              <span className="md:text-sm text-xs font-semibold flex items-center gap-1">
                Add delivery address
                <ChevronDown className="size-3" />
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

import { usePathname } from "next/navigation";
import { Logo } from "../logo";
import { LanguageSwitcher } from "./language-switcher";
import Image from "next/image";
import { useLocale } from "next-intl";
import { formatPrice } from "@workspace/lib";
import { ProductCardProps } from "../product";
import { Spinner } from "@workspace/ui/components";

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
        <nav className="flex items-center justify-between py-4 px-4">
          {bottomNavigationItems.map((item) => {
            const IconComponent = item.icon;
            // Determine if this tab is active
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Button
                asChild
                key={item.href}
                variant="ghost"
                size="icon"
                className={cn(
                  "flex flex-col items-center text-gray-600 hover:text-primary transition-colors",
                  isActive && "text-primary font-semibold"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Link key={item.href} href={item.href}>
                  {IconComponent && (
                    <IconComponent
                      className={cn("size-5", isActive && "text-primary")}
                    />
                  )}
                  <span className={cn("text-xs", isActive && "text-primary")}>
                    {item.label}
                  </span>
                </Link>
              </Button>
            );
          })}
          <CartLink />
          {isLoading ? (
            <Button
              variant="ghost"
              size="icon"
              className="flex flex-col items-center"
            >
              <User className="size-5 animate-pulse" />
              <span className="text-xs mt-0">Loading...</span>
            </Button>
          ) : user ? (
            <UserMenu
              variant="mobile"
              user={user}
              seller={seller}
              logout={logout}
              isSigningOut={isSigningOut}
            />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openAuthDialog("signin")}
              className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors"
              title="Sign in to your account"
            >
              <User className="size-5" />
              <span className="text-xs">Sign In</span>
            </Button>
          )}
        </nav>
      </div>
    </div>
  );
};
