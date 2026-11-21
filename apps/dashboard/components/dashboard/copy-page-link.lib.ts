/**
 * The text the support "copy page link" button copies: the page's sidebar
 * path in the current UI language, each label quoted and joined with " > ",
 * then the URL on the next line.
 *
 *   "المتجر الإلكتروني" > "تعديل الموقع"
 *   https://dashboard.tallaby.com/website/...
 */
export function formatPageLinkText(trail: string[], url: string): string {
  const path = trail.map((label) => `"${label}"`).join(" > ");
  return path ? `${path}\n${url}` : url;
}
