import AddProduct from "./add-product";
import { getAllCategories } from "@/actions/categories";
import { getAllBrands } from "@/actions/brands";
import { getSellerProfile } from "@/actions/seller";
import { DEFAULT_COMMISSION_RATE } from "@/lib/utils/product-pricing.lib";
import type { CategoryOption, BrandOption } from "./add-product.schema";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

// Main page component
export default async function AddProductPage() {
  const [categories, brands, sellerProfile] = await Promise.all([
    getAllCategories(),
    getAllBrands(),
    getSellerProfile(),
  ]);

  const seller = sellerProfile.success ? sellerProfile.data : null;

  return (
    <AddProduct
      categories={(categories.data || []) as CategoryOption[]}
      brands={(brands.data || []) as BrandOption[]}
      sellerPricing={{
        commissionRate: seller?.commissionRate ?? DEFAULT_COMMISSION_RATE,
        isCommissionExempt: seller?.isCommissionExempt ?? false,
      }}
    />
  );
}

// Metadata for the page
export const metadata = {
  title: "Add New Product | Dashboard",
  description: "Create a new product listing for your store",
};
