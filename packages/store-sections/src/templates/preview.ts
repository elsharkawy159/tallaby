/**
 * Gallery card screenshots of a template's home page (owner, 2026-11-12):
 * the page drawn with its niche pack at 1280 px wide, one shot per language,
 * stored at 600 px wide in tallaby.com's public folder
 * (`apps/ecommerce/public/template-previews/<key>.<locale>.webp`). Each
 * template declares its own in its definition (`preview: templatePreview(…)`).
 * tallaby.com serves the files; the dashboard and Admin load them from the
 * tallaby.com origin (`templatePreviewUrl`). Pure, no React and no catalog
 * import, so client components can use it (`@workspace/store-sections/template-preview`).
 */
import type { TemplatePreview, TemplatePreviewShot } from "./types";

/** The public folder the shots live in (tallaby.com's `public/`). */
export const TEMPLATE_PREVIEW_DIR = "/template-previews";

/** The width the shots are stored at (the page was drawn at 1280). */
export const TEMPLATE_PREVIEW_WIDTH = 600;

/**
 * A template's `preview`: its shots drawn with `edition` (null: its own
 * content), `heights` the stored height of each language's shot at 600 px wide.
 */
export function templatePreview(key: string, edition: string | null, heights: { ar: number; en: number }): TemplatePreview {
  const shot = (locale: "ar" | "en"): TemplatePreviewShot => ({ src: `${TEMPLATE_PREVIEW_DIR}/${key}.${locale}.webp`, width: TEMPLATE_PREVIEW_WIDTH, height: heights[locale] });
  return { edition, ar: shot("ar"), en: shot("en") };
}

/** A card's shot with the edition it shows. */
export type PreviewShot = TemplatePreviewShot & { edition: string | null };

/**
 * The shot a card shows: the card's language, only when the card draws the
 * same edition as the shot (`edition` undefined: any, the card then links
 * with the shot's edition). Null: draw the card as before.
 */
export function previewShot(preview: TemplatePreview | null | undefined, locale: string, edition?: string | null): PreviewShot | null {
  if (!preview) return null;
  if (edition !== undefined && edition !== preview.edition) return null;
  return { ...(locale === "en" ? preview.en : preview.ar), edition: preview.edition };
}

/** A shot's URL from another app: `origin` (tallaby.com) + its public path. A full URL stays as it is. */
export function templatePreviewUrl(src: string, origin: string): string {
  return /^https?:\/\//.test(src) ? src : `${origin.replace(/\/+$/, "")}${src}`;
}

