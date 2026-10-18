/** Error keys live under `storeSettings.errors`. */
export type StoreSettingsErrorKey = "invalidInput" | "readOnly" | "notFound" | "generic";

export type StoreSettingsResult = { success: true } | { success: false; error: StoreSettingsErrorKey };

/** The General form's values as edited in the browser ("" = empty). */
export type StoreGeneralFormValues = {
  name: string;
  description: string;
  storeCategory: string;
  storeCategoryAr: string;
  logoUrl: string;
  bannerUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  defaultLocale: "ar" | "en";
  supportedLocales: ("ar" | "en")[];
};

/** Form values → the strict server schema (empty strings become null / omitted). */
export function toGeneralPatch(v: StoreGeneralFormValues) {
  const contact: Record<string, string> = {};
  if (v.phone.trim()) contact.phone = v.phone.trim();
  if (v.whatsapp.trim()) contact.whatsapp = v.whatsapp.trim();
  if (v.email.trim()) contact.email = v.email.trim();
  return {
    name: v.name.trim(),
    description: v.description.trim() || null,
    storeCategory: v.storeCategory.trim() || null,
    storeCategoryAr: v.storeCategoryAr.trim() || null,
    logoUrl: v.logoUrl || null,
    bannerUrl: v.bannerUrl || null,
    contact,
    defaultLocale: v.defaultLocale,
    supportedLocales: v.supportedLocales,
  };
}
