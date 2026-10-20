import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { WishlistItems } from "./wishlist-items";
import { WishlistItemsData } from "./wishlist-items.data";
import { WishlistItemsSkeleton } from "./wishlist-items.skeleton";

export const metadata: Metadata = generateNoIndexMetadata();

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function WishlistPage() {
  return (
    <Suspense fallback={<WishlistItemsSkeleton />}>
      <WishlistItemsWrapper />
    </Suspense>
  );
}

async function WishlistItemsWrapper() {
  const products = await WishlistItemsData();
  return <WishlistItems products={products} />;
}
