import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { aiConfigured } from "@workspace/ai";
import AddProduct from "./add-product";
import { getAllCategories } from "@/actions/categories";
import { getSellerProfile } from "@/actions/seller";
import { getBillingState } from "@workspace/lib/billing/server";
import { DEFAULT_COMMISSION_RATE } from "@/lib/utils/product-pricing.lib";
import { loadProductStorePage } from "@/lib/products/product-store.server";
import { loadSellerTaxonomyOptions } from "../categories-brands/categories-brands.data";
import { loadProductLinkHost } from "./product-link-host.data";
import type { CategoryOption } from "./add-product.schema";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

// Main page component
export default async function AddProductPage({ params }: { params: Promise<{ storeId: string }> }) {
  // The URL store, checked against the session (F-87c); the form saves into it.
  const { seller } = await loadProductStorePage((await params).storeId);
  const [categories, sellerProfile, sellerTaxonomy, linkHost, billing] = await Promise.all([
    getAllCategories(),
    getSellerProfile(),
    loadSellerTaxonomyOptions(seller.sellerId),
    loadProductLinkHost(seller.sellerId),
    getBillingState(),
  ]);

  const profile = sellerProfile.success ? sellerProfile.data : null;

  return (
    <AddProduct
      categories={(categories.data || []) as CategoryOption[]}
      sellerTaxonomy={sellerTaxonomy}
      linkHost={linkHost}
      aiEnabled={aiConfigured()}
      sellerPricing={{
        commissionRate: profile?.commissionRate ?? DEFAULT_COMMISSION_RATE,
        isCommissionExempt: profile?.isCommissionExempt ?? false,
        sellerFreeDelivery: profile?.freeDelivery ?? false,
        feeTrialStartedAt: profile?.feeTrialStartedAt ?? null,
        feeTrialEndsAt: profile?.feeTrialEndsAt ?? null,
        feeBilling: { usdLive: billing.usdLive, marketRate: billing.marketRate },
        plan: profile?.plan ?? null,
        planExpiresAt: profile?.planExpiresAt ?? null,
        planGraceUntil: profile?.planGraceUntil ?? null,
      }}
    />
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.addProduct");
  return { title: t("title"), description: t("description") };
}
