"use client";

import { ProductHero } from "./product-hero";
import { ProductDetails } from "./product-details";
import { ProductPageDeepLink, ProductPageProvider, useProductPage } from "./product-page-provider.client";
import type { Product } from "./product-page.types";

interface ProductDisplayProps {
  product: Product;
}

export const ProductDisplay = ({ product }: ProductDisplayProps) => (
  <ProductPageProvider product={product}>
    <ProductDisplayLayout product={product} />
  </ProductPageProvider>
);

/** The marketplace layout: photos beside the details column. Selection lives in `ProductPageProvider`. */
function ProductDisplayLayout({ product }: ProductDisplayProps) {
  const { variantId, variant, selectVariant, inCart, cartQuantity } = useProductPage();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
      <ProductPageDeepLink />
      <ProductHero
        product={product}
        selectedVariantId={variantId}
        selectedVariant={variant}
      />
      {/* Mobile: a sheet that rises over the pinned image. Desktop: plain column. */}
      <div className="relative z-10 -mx-4 -mt-8 rounded-t-[28px] bg-background px-4 pb-6 pt-3 shadow-[0_-16px_32px_-16px_rgba(20,81,99,0.35)] lg:m-0 lg:rounded-none lg:p-0 lg:shadow-none">
        <span
          aria-hidden
          className="mx-auto mb-4 block h-1.5 w-10 rounded-full bg-gray-200 lg:hidden"
        />
        <ProductDetails
          product={product}
          isInCart={inCart}
          cartItemQuantity={cartQuantity}
          selectedVariantId={variantId}
          onVariantChange={selectVariant}
        />
      </div>
    </div>
  );
}
