"use client";

import AddProduct from "../../add/add-product";
import type {
  AddProductFormData,
  CategoryOption,
} from "../../add/add-product.schema";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import type { SellerTaxonomyOption } from "../../categories-brands/categories-brands.dto";
import type { ProductViewStats } from "@/lib/analytics/product-views.lib";
import { ProductViewsBadge } from "../../_components/product-views.client";
import { EditProductActions, type EditProductStatus } from "./edit-product-actions.client";
import { StockHistoryLink } from "../../inventory/stock-history-link.client";

interface EditProductProps {
  productId: string;
  status: EditProductStatus;
  /** The product page on the seller's store; null when no store shows it. */
  previewUrl: string | null;
  defaultValues: AddProductFormData;
  categories: CategoryOption[];
  sellerPricing: SellerPricingSettings;
  /** The seller's own category list. */
  sellerTaxonomy: { categories: SellerTaxonomyOption[] };
  linkHost: string | null;
  /** Shows the AI box that edits the product on request. */
  aiEnabled: boolean;
  /** Views and views → orders of this product (F-15b), streamed; resolves null without GA4. */
  viewStats?: Promise<ProductViewStats>;
}

/** The add-product form in edit mode, so both pages look and behave the same. */
export function EditProduct({
  productId,
  status,
  previewUrl,
  defaultValues,
  categories,
  sellerPricing,
  sellerTaxonomy,
  linkHost,
  aiEnabled,
  viewStats,
}: EditProductProps) {
  return (
    <AddProduct
      categories={categories}
      sellerPricing={sellerPricing}
      sellerTaxonomy={sellerTaxonomy}
      linkHost={linkHost}
      aiEnabled={aiEnabled}
      edit={{ productId, defaultValues }}
      headerActions={
        <>
          {viewStats ? <ProductViewsBadge stats={viewStats} productId={productId} /> : null}
          <StockHistoryLink productId={productId} />
          <EditProductActions productId={productId} status={status} previewUrl={previewUrl} />
        </>
      }
    />
  );
}
