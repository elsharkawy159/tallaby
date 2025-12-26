import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { getWishlistItems } from "@/actions/wishlist";
import type { WishlistItem } from "@/types/wishlist";
import { WishlistItems } from "./wishlist-items";

export const metadata: Metadata = generateNoIndexMetadata();

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function WishlistPage() {
  const result = await getWishlistItems();
  const wishlistItems = result.success ? (result.data ?? []) : [];

  return <WishlistItems wishlistItems={wishlistItems} />;
}
