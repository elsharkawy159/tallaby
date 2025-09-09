import { getWishlistItems } from "@/actions/wishlist";
import { WishlistItems } from "./wishlist-items";

export const WishlistData = async () => {
  const result = await getWishlistItems();

  if (!result.success) {
    return (
      <div className="text-center py-16">
        <div className="text-red-500 mb-4">
          <svg
            className="h-16 w-16 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-600 mb-2">
          Unable to load wishlist
        </h2>
        <p className="text-gray-500 mb-8">
          {result.error || "Something went wrong while loading your wishlist"}
        </p>
      </div>
    );
  }

  const wishlistItems = result.data || [];

  return <WishlistItems items={wishlistItems as any} />;
};
