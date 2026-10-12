import { fetchSellerSettings } from "./seller-settings.server";
import type { SellerSettingsInitialData } from "./seller-settings.types";
import { SellerSettingsForm } from "./seller-settings.client";
import { StoreLinkCard } from "./store-link.client";
import { CustomDomainCard } from "./custom-domain.client";
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
    <>
      <div className="space-y-4 px-4 pt-4 sm:px-6 sm:pt-6">
        <StoreLinkCard
          initialSubdomain={profile.subdomain}
          customDomain={customDomain?.status === "active" ? customDomain.domain : null}
        />
        <CustomDomainCard initial={customDomain} />
      </div>
      <SellerSettingsForm initialData={initial} />
    </>
  )
}
