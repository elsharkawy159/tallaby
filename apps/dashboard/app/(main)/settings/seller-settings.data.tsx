import { fetchSellerSettings } from "./seller-settings.server";
import type { SellerSettingsInitialData } from "./seller-settings.types";
import { SellerSettingsForm } from "./seller-settings.client";

export async function SellerSettingsData() {
  const { profile, documents, error } = await fetchSellerSettings();
  if (error || !profile) {
    throw new Error(error || "Failed to load seller settings");
  }
  const initial: SellerSettingsInitialData = {
    profile: profile as any,
    documents: (documents ?? []) as any,
  };
  return <SellerSettingsForm initialData={initial} />;
}
