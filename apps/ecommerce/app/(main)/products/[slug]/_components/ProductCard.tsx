"use client";

import { Card, CardContent } from "@workspace/ui/components/card";
import {
  WishlistButton,
  ProductCardImage,
  ProductCardInfo,
  ProductCardActions,
} from "@/components/product";
import type { ProductCardProps } from "@/components/product";
import { useLocale } from "next-intl";

interface ProductCardWithStatusProps extends ProductCardProps {
  isInCart?: boolean;
  cartItemId?: string;
  cartItemQuantity?: number;
  isInWishlist?: boolean;
  wishlistItemId?: string;
}

const ProductCard = ({
  isInCart = false,
  cartItemId,
  cartItemQuantity = 0,
  isInWishlist = false,
  wishlistItemId,
  ...product
}: ProductCardWithStatusProps) => {
  const productId = product.id || "";
  const locale = useLocale();

  return (
    <Card
      className="group bg-white shadow-sm border-0 p-0 relative w-full h-full overflow-hidden rounded-lg"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <CardContent className="p-2 md:p-2.5">
        {/* Product Image */}
        <div className="relative">
          <ProductCardImage product={product} />

          {/* Wishlist Button */}
        </div>
        <div className="absolute top-2.5 right-2.5">
          <WishlistButton
            productId={productId}
            size="sm"
            variant="ghost"
            showText={false}
            className="rounded-lg bg-white/90 hover:bg-white shadow"
            isInWishlist={isInWishlist}
            wishlistItemId={wishlistItemId}
          />
        </div>

        {/* Product Info */}
        <ProductCardInfo product={product} />
        {/* <ProductReview product={product} /> */}
        {/* Product Actions */}
        <ProductCardActions
          product={product}
          variant="card"
          isInCart={isInCart}
          cartItemId={cartItemId}
          cartItemQuantity={cartItemQuantity}
          isInWishlist={isInWishlist}
          wishlistItemId={wishlistItemId}

        />
      </CardContent>
    </Card>
  );
};

export default ProductCard;


// Product Card Props
// {
//   "id": "980a6373-cff7-4725-a518-55d7f828238f",
//   "title": "Plant Food Organic",
//   "slug": "plant-food-organic-ga-2024-049",
//   "description": "Organic plant food for vegetables, flowers, and herbs",
//   "bulletPoints": null,
//   "brandId": null,
//   "categoryId": "93540827-f5ac-4ff8-aa41-b61950a72ff2",
//   "averageRating": null,
//   "reviewCount": 0,
//   "totalQuestions": 0,
//   "isActive": true,
//   "isPlatformChoice": false,
//   "isMostSelling": false,
//   "taxClass": "standard",
//   "createdAt": "2025-12-26 13:37:05.13242+00",
//   "updatedAt": "2025-12-26 13:38:32.423+00",
//   "images": [
//       "2025-12-26/1766756309464-images.jpg"
//   ],
//   "sellerId": "281d1222-19a0-4354-8d68-000d2a187f12",
//   "sku": "GA-2024-049",
//   "condition": "new",
//   "conditionDescription": null,
//   "quantity": "2",
//   "fulfillmentType": "seller_fulfilled",
//   "handlingTime": "1",
//   "maxOrderQuantity": null,
//   "isFeatured": false,
//   "dimensions": null,
//   "price": {
//       "base": 19,
//       "list": 25.27,
//       "final": 19.46,
//       "discountType": "percent",
//       "discountValue": 23
//   },
//   "seo": null,
//   "brand": null,
//   "category": {
//       "id": "93540827-f5ac-4ff8-aa41-b61950a72ff2",
//       "name": "Electronics",
//       "slug": "electronics",
//       "level": 0,
//       "parentId": null,
//       "shopifyId": "gid://shopify/TaxonomyCategory/el",
//       "updatedAt": null,
//       "createdAt": "2025-08-09T00:33:53.746748+00:00"
//   }
// }