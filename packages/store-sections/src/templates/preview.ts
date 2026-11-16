/**
 * Gallery card screenshots of a template's home page (owner, 2026-11-12):
 * the page drawn with its niche pack at 1280 px wide, one shot per language,
 * stored at 600 px wide in tallaby.com's public folder
 * (`apps/ecommerce/public/template-previews/<key>.<locale>.webp`), plus the
 * same page on a phone (400 px wide, owner 2026-11-15:
 * `<key>.<locale>.mobile.webp`), shown on small screens
 * (`TEMPLATE_PREVIEW_MOBILE_MEDIA`), plus the same desktop shot stored
 * 1200 px wide (2026-11-16: `<key>.<locale>.lg.webp`, `large`) for
 * tallaby.com's wide cards, 2x screens and template page. The shots are taken by
 * `packages/store-sections/scripts/template-shots.mjs`, which writes their
 * sizes to `preview-shots.generated.ts`; a template that declares
 * `preview: templatePreview(…)` gets the generated sizes when it has them,
 * and a template with a generated entry but no declaration gets it from the
 * catalog (`shotPreview`). tallaby.com serves the files; the dashboard and
 * Admin load them from the tallaby.com origin (`templatePreviewUrl`). Pure,
 * no React and no catalog import, so client components can use it
 * (`@workspace/store-sections/template-preview`).
 */
import { PREVIEW_SHOTS } from "./preview-shots.generated";
import type { TemplatePreview, TemplatePreviewShot, TemplatePreviewShots } from "./types";

/** The public folder the shots live in (tallaby.com's `public/`). */
export const TEMPLATE_PREVIEW_DIR = "/template-previews";

/** The width the desktop shots are stored at (the page was drawn at 1280). */
export const TEMPLATE_PREVIEW_WIDTH = 600;

/**
 * Where a card shows the phone shot: the screens where the galleries show one
 * card per row (tallaby.com's gallery below 641 px, the dashboard's
 * `minmax(270px, 1fr)` grid on a phone).
 */
export const TEMPLATE_PREVIEW_MOBILE_MEDIA = "(max-width: 640px)";

/** A generated entry as a template's `preview`. */
function generatedPreview(key: string, entry: TemplatePreviewShots): TemplatePreview {
  const shot = (locale: "ar" | "en"): TemplatePreviewShot => {
    const { desktop, mobile, large } = entry[locale];
    return {
      src: `${TEMPLATE_PREVIEW_DIR}/${key}.${locale}.webp`,
      width: desktop.width,
      height: desktop.height,
      ...(mobile ? { mobile: { src: `${TEMPLATE_PREVIEW_DIR}/${key}.${locale}.mobile.webp`, width: mobile.width, height: mobile.height } } : {}),
      ...(large ? { large: { src: `${TEMPLATE_PREVIEW_DIR}/${key}.${locale}.lg.webp`, width: large.width, height: large.height } } : {}),
    };
  };
  return { edition: entry.edition, ar: shot("ar"), en: shot("en") };
}

/**
 * A template's `preview`: its shots drawn with `edition` (null: its own
 * content). The generated sizes (`preview-shots.generated.ts`) win when they
 * were shot with the same edition; else `heights`, the stored height of each
 * language's desktop shot at 600 px wide, with no phone shot.
 */
export function templatePreview(
  key: string,
  edition: string | null,
  heights: { ar: number; en: number },
  shots: Readonly<Record<string, TemplatePreviewShots>> = PREVIEW_SHOTS,
): TemplatePreview {
  const entry = shots[key];
  if (entry && entry.edition === edition) return generatedPreview(key, entry);
  const shot = (locale: "ar" | "en"): TemplatePreviewShot => ({ src: `${TEMPLATE_PREVIEW_DIR}/${key}.${locale}.webp`, width: TEMPLATE_PREVIEW_WIDTH, height: heights[locale] });
  return { edition, ar: shot("ar"), en: shot("en") };
}

/**
 * The preview the catalog gives a template: the one it declares, else its
 * generated entry (a template whose niche became ready after its definition
 * was written), else none.
 */
export function shotPreview(
  key: string,
  declared: TemplatePreview | undefined,
  shots: Readonly<Record<string, TemplatePreviewShots>> = PREVIEW_SHOTS,
): TemplatePreview | undefined {
  if (declared) return declared;
  const entry = shots[key];
  return entry ? generatedPreview(key, entry) : undefined;
}

/** A card's shot with the edition it shows. */
export type PreviewShot = TemplatePreviewShot & { edition: string | null };

/**
 * The shot a card shows: the card's language, only when the card draws the
 * same edition as the shot (`edition` undefined: any, the card then links
 * with the shot's edition). Null: draw the card as before. Its `mobile`, when
 * set, is the phone shot of the same page.
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
