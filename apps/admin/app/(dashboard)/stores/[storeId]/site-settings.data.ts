import { db, eq, storeDesignSystems } from "@workspace/db";
import { parseStoreCurrency } from "@workspace/lib";
import { parseStoreSeo, readStoreSocialLinks } from "@workspace/lib/stores";
import { getStore } from "@workspace/lib/stores/server";
import { designSystemSchema } from "@workspace/store-sections";
import { SOCIAL_PLATFORM_KEYS } from "@workspace/store-sections/social";
import type { SiteSettingsInitial, SocialRow } from "./site-settings.dto";

/**
 * The Website settings form's starting values. `sellerId` comes from the
 * store row the page already read from the database (getStoreForAdmin), never
 * from the client; null when the store is gone.
 */
export async function loadSiteSettings(sellerId: string, storeId: string): Promise<SiteSettingsInitial | null> {
  const [store, [design]] = await Promise.all([
    getStore(sellerId, storeId),
    db
      .select({
        colors: storeDesignSystems.colors,
        typography: storeDesignSystems.typography,
        spacing: storeDesignSystems.spacing,
        version: storeDesignSystems.version,
      })
      .from(storeDesignSystems)
      .where(eq(storeDesignSystems.storeId, storeId))
      .limit(1),
  ]);
  if (!store) return null;

  const contact = (store.contact ?? {}) as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  const locales = store.supportedLocales.filter((l): l is "ar" | "en" => l === "ar" || l === "en");
  const currency = parseStoreCurrency(store.settings);

  // Every platform gets a row: linked ones first in their saved order, then the rest.
  const linked = readStoreSocialLinks(store.contact);
  const social: SocialRow[] = [
    ...linked.map((link) => ({ platform: link.platform, value: link.value, enabled: link.enabled })),
    ...SOCIAL_PLATFORM_KEYS.filter((key) => !linked.some((link) => link.platform === key)).map((platform) => ({
      platform,
      value: "",
      enabled: true,
    })),
  ];

  const seo = parseStoreSeo(store.seo);
  const parsed = designSystemSchema.safeParse(design ?? {});
  const ds = parsed.success ? parsed.data : { colors: {}, typography: {}, spacing: {} };

  return {
    details: {
      name: store.name,
      description: store.description ?? "",
      storeCategory: store.storeCategory ?? "",
      storeCategoryAr: store.storeCategoryAr ?? "",
      logoUrl: store.logoUrl ?? "",
      faviconUrl: store.faviconUrl ?? "",
      bannerUrl: store.bannerUrl ?? "",
      phone: text(contact.phone),
      whatsapp: text(contact.whatsapp),
      email: text(contact.email),
      defaultLocale: store.defaultLocale === "en" ? "en" : "ar",
      supportedLocales: locales.length ? locales : ["ar", "en"],
      currency: currency.currency,
      currencyLabel: currency.label,
    },
    social,
    seo: {
      titleTemplate: seo.titleTemplate ?? "",
      description: seo.description ?? "",
      shareImageUrl: seo.shareImageUrl ?? "",
      indexing: seo.indexing,
      googleSiteVerification: seo.googleSiteVerification ?? "",
    },
    design: { value: { colors: ds.colors, typography: ds.typography, spacing: ds.spacing }, version: design?.version ?? 0 },
  };
}
