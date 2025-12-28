import type { Locale } from "./brands.types";

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
];

export const DEFAULT_LOCALE: Locale = "en";

export const BRAND_FORM_DEFAULTS = {
  name: "",
  nameAr: "",
  slug: "",
  slugAr: "",
  logoUrl: "",
  description: "",
  descriptionAr: "",
  website: "",
  isVerified: false,
  isOfficial: false,
  locale: DEFAULT_LOCALE,
};
