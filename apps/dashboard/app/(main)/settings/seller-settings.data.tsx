import { fetchSellerSettings } from "./seller-settings.server";
import type { SellerSettingsInitialData } from "./seller-settings.types";
import { SellerSettingsForm } from "./seller-settings.client";

export async function SellerSettingsData() {
  const { profile, documents, error } = await fetchSellerSettings();
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
  return <SellerSettingsForm initialData={initial} />
}
