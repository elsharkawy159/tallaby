import { getWishlistItems } from "@/actions/wishlist";
import type { ProductCardProps } from "@/components/product";

interface TransformedProduct extends ProductCardProps {
  wishlistItemId: string;
}

export async function WishlistItemsData() {
  const result = await getWishlistItems();
  const wishlistItems = result.success ? (result.data ?? []) : [];

  const transformedProducts: TransformedProduct[] = wishlistItems.map(
    (item) => {
      const product = item.product;
      let price = product.price;

      // Parse JSON string if needed
      if (typeof price === "string") {
        try {
          price = JSON.parse(price);
        } catch {
          // If parsing fails, treat as number string
          const numPrice = parseFloat(price);
          price = isNaN(numPrice) ? null : numPrice;
        }
      }

      // Handle price transformation
      let priceData: ProductCardProps["price"] = null;
      if (
        typeof price === "object" &&
        price !== null &&
        !Array.isArray(price)
      ) {
        priceData = {
          base: typeof price.base === "number" ? price.base : null,
          list: typeof price.list === "number" ? price.list : null,
          final: typeof price.final === "number" ? price.final : null,
          discountType:
            typeof price.discountType === "string" ? price.discountType : null,
          discountValue:
            typeof price.discountValue === "number"
              ? price.discountValue
              : null,
        };
      } else if (typeof price === "number") {
        priceData = price;
      }

      // Handle images transformation
      let images: ProductCardProps["images"] = [];
      if (Array.isArray(product.images)) {
        images = product.images;
      } else if (product.images) {
        images = [product.images];
      }

      return {
        id: product.id,
        title: product.title,
        slug: product.slug,
        images,
        price: priceData,
        quantity: item.quantity || 1,
        averageRating: product.averageRating ?? null,
        reviewCount: product.reviewCount ?? 0,
        wishlistItemId: item.id,
      };
    }
  );

  return transformedProducts;
}
