import { getTranslations } from "next-intl/server";
import { aiConfigured } from "@workspace/ai";
import { db, eq, storeDesignSystems } from "@workspace/db";
import { parseStoreCurrency } from "@workspace/lib";
import { placeLabel } from "@workspace/lib/places";
import { gatewaySupportsCurrency, parseStorePayments } from "@workspace/lib/payments/store-methods";
import { STORE_GATEWAY_PROVIDERS } from "@workspace/lib/payments/store-gateways";
import { getStoreGatewayOverview } from "@workspace/lib/payments/store-gateways/server";
import { getStoreShipping } from "@workspace/lib/stores/server";
import { effectiveStoreNiche, industryOfCategory, nicheForIndustry, parseStoreNiche } from "@workspace/lib/stores/niche";
import type { StoreRow } from "@workspace/lib/stores/server";
import { designSystemSchema } from "@workspace/store-sections";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { findIndustry, STORE_INDUSTRIES } from "@/lib/stores/industries.lib";
import { nicheChoices } from "@/lib/stores/niche-choices.lib";
import { getSetupPromptRow } from "../../../_components/home.queries";
import { welcomeShippingDefault } from "./welcome.lib";
import type { WelcomeData } from "./welcome.types";

/**
 * Read-only loader of the welcome page, for a store `loadStorePage` already
 * checked (rule 5: it belongs to the session seller). Never `getStoreForEditor`,
 * which writes the site scaffold. One round of queries; nothing cached (rule 8).
 * P3 adds the order lock and the store link here.
 */
export async function loadWelcomeData(store: StoreRow, locale: string): Promise<WelcomeData | null> {
  const themesAvailable = storeBuilderEnabled(store.sellerId);
  const [promptRow, designRows, shipping, gateways, tAr, tEn] = await Promise.all([
    getSetupPromptRow(store.sellerId, store.id),
    themesAvailable
      ? db
          .select({
            colors: storeDesignSystems.colors,
            typography: storeDesignSystems.typography,
            spacing: storeDesignSystems.spacing,
            motion: storeDesignSystems.motion,
            version: storeDesignSystems.version,
          })
          .from(storeDesignSystems)
          .where(eq(storeDesignSystems.storeId, store.id))
          .limit(1)
      : Promise.resolve([]),
    getStoreShipping(store.sellerId, store.id),
    getStoreGatewayOverview(store.sellerId, store.id),
    // Zone names are saved in both languages, as the shipping page builds them.
    getTranslations({ locale: "ar" }),
    getTranslations({ locale: "en" }),
  ]);
  if (!promptRow || !shipping) return null;

  const money = parseStoreCurrency(store.settings);
  const suggested = welcomeShippingDefault(money.currency);
  const zoneNames =
    suggested.kind === "egypt_flat"
      ? { nameAr: tAr("storeShipping.templates.egyptFlat.zoneName"), nameEn: tEn("storeShipping.templates.egyptFlat.zoneName") }
      : suggested.kind === "country"
        ? {
            nameAr: tAr("storeWelcome.steps.shipping.countryZoneName", { country: placeLabel(suggested.country, "ar") }),
            nameEn: tEn("storeWelcome.steps.shipping.countryZoneName", { country: placeLabel(suggested.country, "en") }),
          }
        : null;
  const zoneLabel = suggested.kind === "none" ? null : (locale.startsWith("ar") ? zoneNames?.nameAr : zoneNames?.nameEn) ?? null;

  const category = { en: store.storeCategory ?? "", ar: store.storeCategoryAr ?? "" };
  const industry = findIndustry(category);
  const industryId = industryOfCategory(category);

  // As Website › Design reads it: a null motion column means "defaults" (the key is left out).
  const row = designRows[0];
  const parsed = row
    ? designSystemSchema.safeParse({
        colors: row.colors,
        typography: row.typography,
        spacing: row.spacing,
        ...(row.motion != null && { motion: row.motion }),
      })
    : null;
  const designSystem = row && parsed?.success ? { value: parsed.data, version: row.version } : null;

  const locales = store.supportedLocales.filter((l): l is "ar" | "en" => l === "ar" || l === "en");

  return {
    storeId: store.id,
    storeName: store.name,
    readOnly: store.status !== "active",
    flags: promptRow.flags,
    themesAvailable,
    aiEnabled: aiConfigured(),
    industry: {
      id: industry?.id ?? null,
      category,
      savedNiche: nicheForIndustry(parseStoreNiche(store.settings), industryId) ?? "",
      shownNiche: effectiveStoreNiche(store, industry?.id),
      nicheOptions: nicheChoices(
        STORE_INDUSTRIES.map((option) => option.id),
        locale,
      ),
    },
    brand: {
      logoUrl: store.logoUrl ?? "",
      faviconUrl: store.faviconUrl ?? "",
      defaultLocale: store.defaultLocale === "en" ? "en" : "ar",
      supportedLocales: locales.length ? locales : [store.defaultLocale === "en" ? "en" : "ar"],
      designSystem,
    },
    delivery: {
      money,
      shipping: {
        settings: shipping.settings,
        zones: shipping.zones,
        suggested,
        zoneNames,
        country: suggested.kind === "egypt_flat" ? "EG" : suggested.kind === "country" ? suggested.country : null,
        zoneLabel,
      },
      payments: {
        methods: parseStorePayments((store.settings as Record<string, unknown> | null)?.payments),
        gateway: gateways?.connected?.provider ?? null,
        gatewayProviders: STORE_GATEWAY_PROVIDERS.filter((provider) => gatewaySupportsCurrency(provider, money.currency)),
      },
    },
  };
}
