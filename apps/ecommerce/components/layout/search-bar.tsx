"use client";

import React from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useDebounce } from "@/hooks/use-debounce";
import { getProducts } from "@/actions/products";
import { cn } from "@/lib/utils";
import { formatPrice } from "@workspace/lib";
import Image from "next/image";
import { Spinner } from "@workspace/ui/components";
import { ProductCardProps } from "@/components/product";
import { resolvePrice, resolvePrimaryImage } from "@/lib/utils";
import type { SearchBarProps } from "./header.types";

// Helper function to highlight matching text
const highlightText = (text: string, query: string): string => {
  if (!query || !text) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return parts
    .map((part) => {
      // Check if this part matches the query (case-insensitive)
      const regexTest = new RegExp(`^${escapedQuery}$`, "i");
      if (regexTest.test(part)) {
        return `<mark class="bg-yellow-200 font-semibold">${part}</mark>`;
      }
      return part;
    })
    .join("");
};

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
  const router = useRouter();
  const t = useTranslations("search");

  // Fetch search results using useQuery
  const { data: searchResultsData, isLoading: isSearching } = useQuery({
    queryKey: ["search-products", debouncedSearchQuery, locale],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim() || debouncedSearchQuery.length < 1) {
        return { success: true, data: [] };
      }
      return getProducts({
        searchQuery: debouncedSearchQuery.trim(),
        limit: 5,
        locale: locale as "en" | "ar",
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setIsOpen(false);
    router.push(`/products?${new URLSearchParams({ search: query }).toString()}`);
  };

  const searchPlaceholder = placeholder || (variant === "mobile" ? t("searchProducts") : t("searchForProducts"));

  return (
    <div className={cn("relative flex-1", className)} ref={searchRef}>
      <form
        role="search"
        onSubmit={handleSubmit}
        className="flex h-11 overflow-hidden rounded-xl bg-white focus-within:ring-2 focus-within:ring-accent/60"
      >
        <Input
          type="search"
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-3.5 text-sm text-neutral-900 shadow-none placeholder:text-neutral-500 focus-visible:ring-0"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
        />
        <button
          type="submit"
          aria-label={t("searchProducts")}
          className="grid w-13 shrink-0 cursor-pointer place-items-center bg-accent text-white transition-colors hover:bg-[#e89318]"
        >
          {isSearching ? <Spinner className="size-5" /> : <Search className="size-5" />}
        </button>
      </form>
      {/* Search Results Dropdown */}
      {isOpen && searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-106 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">{t("searching")}</div>
          ) : searchResults.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {searchResults.map((product) => {
                const price = resolvePrice(product as ProductCardProps);

                const productImage = resolvePrimaryImage(
                  product.images as string[] | undefined
                );

                return (
                  <li key={String(product.id)}>
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
                          <p
                            className="text-sm font-medium text-gray-900 truncate"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(
                                product.title || "",
                                searchQuery
                              ),
                            }}
                          />
                          <p className="text-xs text-gray-500 truncate">
                            {(product.category as Record<string, unknown> | undefined)?.name as string || t("noCategory")}
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
                    href={`/products?search=${encodeURIComponent(searchQuery)}`}
                    onClick={() => {
                      setSearchQuery("");
                      setIsOpen(false);
                    }}
                    className="block p-3 text-center text-sm font-medium text-primary hover:bg-gray-50"
                  >
                    {t("viewAllResults")}
                  </Link>
                </li>
              )}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              {t("noProductsFound")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
