import { aiConfigured } from "@workspace/ai";
import { db, eq, storeDesignSystems } from "@workspace/db";
import { effectiveStoreNiche, industryOfCategory, nicheForIndustry, parseStoreNiche } from "@workspace/lib/stores/niche";
import type { StoreRow } from "@workspace/lib/stores/server";
import { designSystemSchema } from "@workspace/store-sections";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { findIndustry, STORE_INDUSTRIES } from "@/lib/stores/industries.lib";
import { nicheChoices } from "@/lib/stores/niche-choices.lib";
import { getSetupPromptRow } from "../../../_components/home.queries";
import type { WelcomeData } from "./welcome.types";

/**
 * Read-only loader of the welcome page, for a store `loadStorePage` already
 * checked (rule 5: it belongs to the session seller). Never `getStoreForEditor`,
 * which writes the site scaffold. One round of queries; nothing cached (rule 8).
 * P2/P3 add shipping, payments, the order lock and the store link here.
 */
export async function loadWelcomeData(store: StoreRow, locale: string): Promise<WelcomeData | null> {
  const themesAvailable = storeBuilderEnabled(store.sellerId);
  const [promptRow, designRows] = await Promise.all([
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
  ]);
  if (!promptRow) return null;

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
  };
}
