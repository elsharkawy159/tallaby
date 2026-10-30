import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { aiConfigured } from "@workspace/ai";
import { getProduct } from "@/actions/products";
import { getAllCategories } from "@/actions/categories";
import { EditProduct } from "./edit-product";
import { buildEditDefaultValues } from "./edit-product.lib";
import { getSellerProfile } from "@/actions/seller";
import { DEFAULT_COMMISSION_RATE } from "@/lib/utils/product-pricing.lib";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { loadSellerTaxonomyOptions } from "../../categories-brands/categories-brands.data";
import { loadProductLinkHost } from "../../add/product-link-host.data";
import { loadProductStoreLinks } from "../../_components/product-store-links.data";
import { loadProductViewStats } from "../../_components/product-views.data";
import { loadProductSocialProof } from "../../social-proof/social-proof.data";
import type { EditProductStatus } from "./edit-product-actions.client";
import type { CategoryOption } from "../../add/add-product.schema";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.editProduct");
  return { title: t("title"), description: t("description") };
}

type EditProductPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { productId } = await params;
  const { sellerId } = await requireSeller();
  const [productResult, categoriesRes, sellerProfile, sellerTaxonomy, linkHost, socialProof] =
    await Promise.all([
      getProduct(productId),
      getAllCategories(),
      getSellerProfile(),
      loadSellerTaxonomyOptions(sellerId),
      loadProductLinkHost(sellerId),
      loadProductSocialProof(sellerId, productId),
    ]);

  if (!productResult.success || !productResult.data) {
    notFound();
  }

  const product = productResult.data;
  // In Trash (0123, F-35): it is restored from there before it can be edited.
  if ((product as { deletedAt?: string | null }).deletedAt) redirect("/products/trash");
  const categories = (categoriesRes.data || []) as CategoryOption[];
  const seller = sellerProfile.success ? sellerProfile.data : null;
  const sellerPricing = {
    commissionRate: seller?.commissionRate ?? DEFAULT_COMMISSION_RATE,
    isCommissionExempt: seller?.isCommissionExempt ?? false,
    sellerFreeDelivery: seller?.freeDelivery ?? false,
    feeTrialStartedAt: seller?.feeTrialStartedAt ?? null,
    feeTrialEndsAt: seller?.feeTrialEndsAt ?? null,
  };
  const defaultValues = {
    ...buildEditDefaultValues(product as Parameters<typeof buildEditDefaultValues>[0], sellerPricing),
    showLiveViews: socialProof.showLiveViews,
    showLowStockBadge: socialProof.showLowStockBadge,
    lowStockThreshold: socialProof.lowStockThreshold,
    sellerReviews: socialProof.reviews,
  };

  // Not awaited: the views stat streams into the header (F-15b); never rejects.
  const viewStats = loadProductViewStats([productId]);
  const slug = defaultValues.localized?.en?.slug?.trim() || null;
  const storeLinks = await loadProductStoreLinks([{ id: productId, slug }]);

  return (
    <EditProduct
      productId={productId}
      status={(product.status ?? "draft") as EditProductStatus}
      previewUrl={storeLinks.get(productId) ?? null}
      defaultValues={defaultValues}
      categories={categories}
      sellerPricing={sellerPricing}
      sellerTaxonomy={sellerTaxonomy}
      linkHost={linkHost}
      aiEnabled={aiConfigured()}
      viewStats={viewStats}
    />
  );
}
