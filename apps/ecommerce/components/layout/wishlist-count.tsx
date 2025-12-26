import { getWishlistItems } from "@/actions/wishlist";

export const WishlistCount = async ({ className }: { className?: string }) => {
  const wishlistResult = await getWishlistItems();
  const itemCount = wishlistResult.success
    ? (wishlistResult.data?.length ?? 0)
    : 0;
  if (itemCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-4.5 flex items-center justify-center">
      {itemCount}
    </span>
  );
};
