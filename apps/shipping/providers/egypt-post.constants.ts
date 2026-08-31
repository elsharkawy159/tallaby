/**
 * Wassalha Egypt Post merchant identity, printed onto every exported
 * assignment sheet. Env-overridable so a future second merchant account (or
 * a staging pickup location) doesn't require a code change.
 */
export const EGYPT_POST_MERCHANT_CODE = process.env.EGYPT_POST_MERCHANT_CODE ?? "1017575";
export const EGYPT_POST_MERCHANT_NAME = process.env.EGYPT_POST_MERCHANT_NAME ?? "Tallaby";
export const EGYPT_POST_WAREHOUSE_NAME =
  process.env.EGYPT_POST_WAREHOUSE_NAME ?? "المطريه القاهره";

/** Batch-wide defaults offered in the assign dialog when Egypt Post is selected. */
export const EGYPT_POST_DEFAULT_WEIGHT_KG = 1;
export const EGYPT_POST_DEFAULT_VOLUME = "Small" as const;
