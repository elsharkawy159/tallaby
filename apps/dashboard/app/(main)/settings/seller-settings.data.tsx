import { Separator } from "@workspace/ui/components/separator";
import { storeUrl } from "@workspace/lib/storefront";
import { fetchSellerSettings } from "./seller-settings.server";
import type { SellerSettingsInitialData } from "./seller-settings.types";
import { SellerSettingsForm } from "./seller-settings.client";
import { StoreLinkSection } from "./store-link.client";
import { CustomDomainSection } from "./custom-domain.client";
import { getCustomDomain } from "@/actions/custom-domain";
import { getSellerAccountView } from "@workspace/lib/sellers/server";
import { getPrimaryStore } from "@workspace/lib/stores/server";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { DomainPageLink } from "./domain-page-link";

export async function SellerSettingsData() {
  const seller = await requireSeller();
  const [{ profile, documents, error }, account, primaryStore] = await Promise.all([
    fetchSellerSettings(),
    getSellerAccountView(seller.sellerId),
    getPrimaryStore(seller.sellerId),
  ]);
  // The primary store's domain; every store's lives on Website › Domain & SEO (P4-14).
  const customDomainRes = primaryStore ? await getCustomDomain(primaryStore.id) : null;
  const customDomain = customDomainRes?.success ? customDomainRes.domain : null;
  if (error || !profile || !account) {
    throw new Error(error || "Failed to load seller settings");
  }
  const liveDomain = customDomain?.status === "active" ? customDomain.domain : null;
  const initial: SellerSettingsInitialData = {
    profile: {
      id: profile.id,
      businessName: profile.businessName,
      displayName: profile.displayName,
      description: profile.description,
      logoUrl: profile.logoUrl,
      bannerUrl: profile.bannerUrl,
      supportEmail: profile.supportEmail,
      supportPhone: profile.supportPhone,
      returnPolicy: profile.returnPolicy,
      shippingPolicy: profile.shippingPolicy,
    },
    documents: (documents ?? []).map((doc) => ({
      id: doc.id,
      sellerId: doc.sellerId,
      documentType: doc.documentType,
      fileUrl: doc.fileUrl,
      expiryDate: doc.expiryDate,
      status: doc.status,
      uploadedAt: doc.uploadedAt,
    })),
  }
  return (
    <SellerSettingsForm
      initialData={initial}
      storeHref={storeUrl(profile.subdomain, liveDomain)}
      account={account}
      primaryStoreId={primaryStore?.id ?? null}
      linkSection={
        primaryStore ? (
          <>
            <StoreLinkSection
              storeId={primaryStore.id}
              initialSubdomain={primaryStore.subdomain}
              customDomain={liveDomain}
              siteStatus={primaryStore.siteStatus}
            />
            <Separator className="my-1" />
            <CustomDomainSection storeId={primaryStore.id} initial={customDomain} />
            <DomainPageLink storeId={primaryStore.id} />
          </>
        ) : null
      }
    />
  )
}
