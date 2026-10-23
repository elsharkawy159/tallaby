import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AddProduct from "./add-product";
import { getAllCategories } from "@/actions/categories";
import { getAllBrands } from "@/actions/brands";
import { getSellerProfile } from "@/actions/seller";
import { DEFAULT_COMMISSION_RATE } from "@/lib/utils/product-pricing.lib";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { loadSellerTaxonomyOptions } from "../categories-brands/categories-brands.data";
import { loadProductLinkHost } from "./product-link-host.data";
import type { CategoryOption, BrandOption } from "./add-product.schema";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

// Main page component
export default async function AddProductPage() {
  const seller = await requireSeller();
  const [categories, brands, sellerProfile, sellerTaxonomy, linkHost] = await Promise.all([
    getAllCategories(),
    getAllBrands(),
    getSellerProfile(),
    loadSellerTaxonomyOptions(seller.sellerId),
    loadProductLinkHost(seller.sellerId),
  ]);

  const profile = sellerProfile.success ? sellerProfile.data : null;

  return (
    <AddProduct
      categories={(categories.data || []) as CategoryOption[]}
      brands={(brands.data || []) as BrandOption[]}
      sellerTaxonomy={sellerTaxonomy}
      linkHost={linkHost}
      sellerPricing={{
        commissionRate: profile?.commissionRate ?? DEFAULT_COMMISSION_RATE,
        isCommissionExempt: profile?.isCommissionExempt ?? false,
        sellerFreeDelivery: profile?.freeDelivery ?? false,
        feeTrialStartedAt: profile?.feeTrialStartedAt ?? null,
        feeTrialEndsAt: profile?.feeTrialEndsAt ?? null,
      }}
    />
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.addProduct");
  return { title: t("title"), description: t("description") };
}
