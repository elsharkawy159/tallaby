/**
 * The text the support "copy page link" button copies: the page's sidebar
 * path in the current UI language, each label in WhatsApp bold (`*…*`) and
 * joined with an arrow that follows the reading direction (← in Arabic,
 * → in English), then the URL on the next line.
 *
 *   *المتجر الإلكتروني* ← *تعديل الموقع*
 *   https://dashboard.tallaby.com/website/...
 */
export function formatPageLinkText(trail: string[], url: string, locale: string = "ar"): string {
  const arrow = locale === "ar" ? " ← " : " → ";
  const path = trail.map((label) => `*${label}*`).join(arrow);
  return path ? `${path}\n${url}` : url;
}
