/** Moved to @workspace/store-editor (shared with the admin app); re-exported for the dashboard. */
import { STORE_INDUSTRIES } from "@workspace/store-editor/lib/industries.lib";

export * from "@workspace/store-editor/lib/industries.lib";

/** The "Other" choice on the signup form: the seller types the industry. */
export const OTHER_INDUSTRY_ID = "other";

/**
 * The short industry list on the signup form (owner, 2026-10-27). The full
 * STORE_INDUSTRIES stays for store settings, the editor and template matching.
 */
const SIGNUP_INDUSTRY_IDS = [
  "fashion",
  "shoes-bags",
  "electronics",
  "mobile-accessories",
  "beauty",
  "home",
  "food",
  "kids",
  "jewelry",
  "handmade",
];

export const SIGNUP_INDUSTRIES = STORE_INDUSTRIES.filter((i) => SIGNUP_INDUSTRY_IDS.includes(i.id));
