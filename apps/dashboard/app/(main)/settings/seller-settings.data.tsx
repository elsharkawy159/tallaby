import { Separator } from "@workspace/ui/components/separator";
import { storeUrl } from "@workspace/lib/storefront";
import { fetchSellerSettings } from "./seller-settings.server";
import type { SellerSettingsInitialData } from "./seller-settings.types";
import { SellerSettingsForm } from "./seller-settings.client";
import { StoreLinkSection } from "./store-link.client";
import { CustomDomainSection } from "./custom-domain.client";
import { getCustomDomain } from "@/actions/custom-domain";

export async function SellerSettingsData() {
  const [{ profile, documents, error }, customDomainRes] = await Promise.all([
    fetchSellerSettings(),
    getCustomDomain(),
  ]);
  const customDomain = customDomainRes.success ? customDomainRes.domain : null;
  if (error || !profile) {
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
      linkSection={
        <>
          <StoreLinkSection
            initialSubdomain={profile.subdomain}
            customDomain={liveDomain}
          />
          <Separator className="my-1" />
          <CustomDomainSection initial={customDomain} />
        </>
      }
    />
  )
}
