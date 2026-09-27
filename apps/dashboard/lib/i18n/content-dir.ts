/**
 * Product content is authored per language (EN/AR tabs) independently of the
 * dashboard UI language, so its inputs pin their own direction. `!` beats the
 * shared Input's `rtl:text-right`.
 */
export function contentDirClass(contentLocale: "en" | "ar") {
  return contentLocale === "ar"
    ? "[direction:rtl] !text-right"
    : "[direction:ltr] !text-left";
}
