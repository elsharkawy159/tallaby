import { Suspense } from "react";
import type { Metadata } from "next";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Heart } from "lucide-react";
import { WishlistData } from "./_components/wishlist-data";
import { WishlistSkeleton } from "./_components/wishlist-skeleton";
import { WishlistProvider } from "@/providers/wishlist-provider";
import { generateNoIndexMetadata } from "@/lib/metadata";
import { useTranslations } from "next-intl";

export const metadata: Metadata = generateNoIndexMetadata();

// Force dynamic rendering - no caching for wishlist
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const Wishlist = () => {
  const t = useTranslations("wishlist");

  return (
    // WishlistProvider was never mounted anywhere in the app — useWishlist()
    // (used by _components/wishlist-items.tsx) threw at runtime on this
    // page. Scoped here rather than globally (unlike the cart provider,
    // which is mounted at the app root) since only this page needs it.
    <WishlistProvider>
      <div className="min-h-screen flex flex-col">
        <DynamicBreadcrumb />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">{t("myWishlist")}</h1>
            <Heart className="h-8 w-8 text-red-500 fill-current" />
          </div>

          <Suspense fallback={<WishlistSkeleton />}>
            <WishlistData />
          </Suspense>
        </main>
      </div>
    </WishlistProvider>
  );
};

export default Wishlist;
