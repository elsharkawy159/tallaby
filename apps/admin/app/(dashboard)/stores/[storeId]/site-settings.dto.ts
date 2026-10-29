import type { CurrencyLabel, StoreCurrency } from "@workspace/lib";
import type { DesignSystem } from "@workspace/store-sections";
import type { SocialPlatformKey } from "@workspace/store-sections/social";

/**
 * The store page's Website settings (store details, brand, social, SEO): the
 * values as edited in the browser. Pure, shared by the client and the server
 * actions, which validate everything again with the seller's lib schemas.
 */

/** Store details as edited ("" = empty). Live at once, like Store settings › General. */
export type DetailsValues = {
  name: string;
  description: string;
  storeCategory: string;
  storeCategoryAr: string;
  logoUrl: string;
  faviconUrl: string;
  bannerUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  defaultLocale: "ar" | "en";
  supportedLocales: ("ar" | "en")[];
  currency: StoreCurrency;
  currencyLabel: CurrencyLabel;
};

/** One social platform row, linked or not. */
export type SocialRow = { platform: SocialPlatformKey; value: string; enabled: boolean };

/** stores.seo as edited ("" = empty). Live at once. */
export type SeoValues = {
  titleTemplate: string;
  description: string;
  shareImageUrl: string;
  indexing: boolean;
  googleSiteVerification: string;
};

/** The design-system tokens the Brand tab edits. Saved to the drafts. */
export type DesignValues = Pick<DesignSystem, "colors" | "typography" | "spacing">;

export type SiteSettingsInitial = {
  details: DetailsValues;
  social: SocialRow[];
  seo: SeoValues;
  design: { value: DesignValues; version: number };
};

export type SiteSettingsResult<T = null> = { success: true; message: string; data: T } | { success: false; error: string };

/** Details → the strict `storeGeneralSettingsSchema` patch (empty strings become null / omitted). */
export function toDetailsPatch(v: DetailsValues) {
  const contact: Record<string, string> = {};
  if (v.phone.trim()) contact.phone = v.phone.trim();
  if (v.whatsapp.trim()) contact.whatsapp = v.whatsapp.trim();
  if (v.email.trim()) contact.email = v.email.trim();
  return {
    name: v.name.trim(),
    description: v.description.trim() || null,
    storeCategory: v.storeCategory.trim() || null,
    storeCategoryAr: v.storeCategoryAr.trim() || null,
    logoUrl: v.logoUrl.trim() || null,
    faviconUrl: v.faviconUrl.trim() || null,
    bannerUrl: v.bannerUrl.trim() || null,
    contact,
    defaultLocale: v.defaultLocale,
    supportedLocales: v.supportedLocales,
    currency: v.currency,
    currencyLabel: v.currencyLabel,
  };
}

/** Rows → the payload `updateStoreSocialLinks` validates (empty rows dropped; order = row order). */
export function toSocialPayload(rows: SocialRow[]) {
  return rows
    .filter((row) => row.value.trim())
    .map((row, order) => ({ platform: row.platform, value: row.value.trim(), enabled: row.enabled, order }));
}
