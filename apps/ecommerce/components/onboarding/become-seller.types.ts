// Server action result interface
export interface SellerApplicationResult {
  success: boolean;
  /** Translation key under `onboarding` (e.g. "submitErrors.alreadySeller"). */
  messageKey: string;
  /** Form path -> error code, rendered through `onboarding.errors.<code>`. */
  errors?: Record<string, string>;
}

// Business type options (labels come from `onboarding.businessType_<value>`)
export const BUSINESS_TYPE_OPTIONS = [
  { value: "individual" },
  { value: "company" },
  { value: "partnership" },
  { value: "corporation" },
] as const;
