import { Suspense } from "react";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Heart } from "lucide-react";
import { WishlistData } from "./_components/wishlist-data";
import { WishlistSkeleton } from "./_components/wishlist-skeleton";

// Force dynamic rendering - no caching for wishlist
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const Wishlist = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <Heart className="h-8 w-8 text-red-500 fill-current" />
        </div>

        <Suspense fallback={<WishlistSkeleton />}>
          <WishlistData />
        </Suspense>
      </main>
    </div>
  );
};

export default Wishlist;
