"use client";

import AddProduct from "../../add/add-product";
import type {
  AddProductFormData,
  BrandOption,
  CategoryOption,
} from "../../add/add-product.schema";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import type { SellerTaxonomyOption } from "../../categories-brands/categories-brands.dto";

interface EditProductProps {
  productId: string;
  defaultValues: AddProductFormData;
  categories: CategoryOption[];
  brands: BrandOption[];
  sellerPricing: SellerPricingSettings;
  /** The seller's own lists for "My category" / "My brand". */
  sellerTaxonomy: { categories: SellerTaxonomyOption[]; brands: SellerTaxonomyOption[] };
}

/** The add-product form in edit mode, so both pages look and behave the same. */
export function EditProduct({
  productId,
  defaultValues,
  categories,
  brands,
  sellerPricing,
  sellerTaxonomy,
}: EditProductProps) {
  return (
    <AddProduct
      categories={categories}
      brands={brands}
      sellerPricing={sellerPricing}
      sellerTaxonomy={sellerTaxonomy}
      edit={{ productId, defaultValues }}
    />
  );
}
