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
      let rawPrice: unknown = product.price;

      // Parse JSON string if needed
      if (typeof rawPrice === "string") {
        try {
          rawPrice = JSON.parse(rawPrice);
        } catch {
          const numPrice = parseFloat(rawPrice as string);
          rawPrice = isNaN(numPrice) ? null : numPrice;
        }
      }

      // Handle price transformation
      let priceData: ProductCardProps["price"] = null;
      if (
        typeof rawPrice === "object" &&
        rawPrice !== null &&
        !Array.isArray(rawPrice)
      ) {
        const p = rawPrice as Record<string, unknown>;
        priceData = {
          base: typeof p.base === "number" ? p.base : null,
          list: typeof p.list === "number" ? p.list : null,
          final: typeof p.final === "number" ? p.final : null,
          discountType:
            typeof p.discountType === "string" ? p.discountType : null,
          discountValue:
            typeof p.discountValue === "number"
              ? p.discountValue
              : null,
        };
      } else if (typeof rawPrice === "number") {
        priceData = rawPrice;
      }

      // Handle images transformation
      let images: ProductCardProps["images"] = [];
      if (Array.isArray(product.images)) {
        images = product.images;
      } else if (product.images) {
        images = [product.images];
      }

      // Access localized fields from MergedProduct
      const mergedProduct = product as Record<string, unknown>;

      return {
        id: product.id,
        title: (mergedProduct.title as string) ?? "",
        slug: (mergedProduct.slug as string) ?? "",
        images,
        price: priceData,
        quantity: (item as Record<string, unknown>).quantity as number || 1,
        averageRating: product.averageRating ?? null,
        reviewCount: product.reviewCount ?? 0,
        wishlistItemId: item.id,
      };
    }
  );

  return transformedProducts;
}
