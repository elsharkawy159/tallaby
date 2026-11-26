import type { PriceChangeView } from "./price-rounding-apply.lib";

/** Error keys under `storePriceRounding.apply.errors.*`. */
export type PriceRoundingApplyError = "ruleOff" | "tooMany" | "readOnly" | "notFound" | "rateLimited" | "generic";

export type PriceRoundingPreviewRow = {
  id: string;
  title: string;
  image: string | null;
  /** The product's own price, or null when only variants change. */
  change: PriceChangeView | null;
  variants: { id: string; title: string; change: PriceChangeView }[];
};

export type PriceRoundingPreviewResult =
  | {
      success: true;
      /** Products whose own price changes, and variants whose price changes. */
      productCount: number;
      variantCount: number;
      /** At most STORE_PRICE_ROUNDING_PREVIEW_ROWS products; `more` is how many are left out. */
      rows: PriceRoundingPreviewRow[];
      more: number;
    }
  | { success: false; error: PriceRoundingApplyError };

export type PriceRoundingApplyResult =
  | { success: true; productCount: number; variantCount: number }
  | { success: false; error: PriceRoundingApplyError };
