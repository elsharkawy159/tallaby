"use client";

import AddProduct from "../../add/add-product";
import type {
  AddProductFormData,
  BrandOption,
  CategoryOption,
} from "../../add/add-product.schema";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import type { SellerTaxonomyOption } from "../../categories-brands/categories-brands.dto";
import { EditProductActions, type EditProductStatus } from "./edit-product-actions.client";

interface EditProductProps {
  productId: string;
  status: EditProductStatus;
  /** The product page on the seller's store; null when no store shows it. */
  previewUrl: string | null;
  defaultValues: AddProductFormData;
  categories: CategoryOption[];
  brands: BrandOption[];
  sellerPricing: SellerPricingSettings;
  /** The seller's own lists for "My category" / "My brand". */
  sellerTaxonomy: { categories: SellerTaxonomyOption[]; brands: SellerTaxonomyOption[] };
  linkHost: string | null;
}

/** The add-product form in edit mode, so both pages look and behave the same. */
export function EditProduct({
  productId,
  status,
  previewUrl,
  defaultValues,
  categories,
  brands,
  sellerPricing,
  sellerTaxonomy,
  linkHost,
}: EditProductProps) {
  return (
    <AddProduct
      categories={categories}
      brands={brands}
      sellerPricing={sellerPricing}
      sellerTaxonomy={sellerTaxonomy}
      linkHost={linkHost}
      edit={{ productId, defaultValues }}
      headerActions={<EditProductActions productId={productId} status={status} previewUrl={previewUrl} />}
    />
  );
}
