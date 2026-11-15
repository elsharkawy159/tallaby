import type { DesignSystem } from "@workspace/store-sections";
import type { NicheChoices } from "@/lib/stores/niche-choices.lib";
import type { SetupFlags } from "../../../_components/setup-checklist.lib";

/** What the welcome page's loader (`welcome.data.ts`) hands the client. */
export type WelcomeData = {
  storeId: string;
  storeName: string;
  readOnly: boolean;
  flags: SetupFlags;
  /** Website › Templates and the design system are open to this seller (store-builder rollout). */
  themesAvailable: boolean;
  aiEnabled: boolean;
  industry: {
    /** The saved industry's id, or null (none, or a category that matches no industry). */
    id: string | null;
    /** The saved category as typed, for a category outside the list. */
    category: { en: string; ar: string };
    /** The saved niche of that industry, or "" (the picker starts from it). */
    savedNiche: string;
    /** The niche the galleries sort by (saved, else guessed), or null; shown in the summary. */
    shownNiche: string | null;
    nicheOptions: NicheChoices;
  };
  brand: {
    logoUrl: string;
    faviconUrl: string;
    defaultLocale: "ar" | "en";
    supportedLocales: string[];
    /** The design-system DRAFT and its version (saveDesignSystem's optimistic check); null without the builder. */
    designSystem: { value: DesignSystem; version: number } | null;
  };
};
