/**
 * Niche editions in a template gallery (ROADMAP F-90), the client-safe part:
 * no template data imported, so a client card can use it. Shared by the
 * dashboard's Website › Templates and Admin's change-theme dialog; the
 * template data side is `template-niches.lib.ts`.
 */
import type { NicheCardView } from "../templates.dto";

/**
 * The edition a card shows and installs: the niche tab's when the template
 * has that edition, else none (the template's own content). A niche card of
 * a switched industry always shows its own niche (its edition, or none when
 * the template is already that niche). A niche tab lists only templates with
 * its edition, so every card there shows it; there is no per-card choice
 * (owner, 2026-11-11).
 */
export function cardEdition(template: { editions?: readonly { id: string }[] }, niche: string | null, card?: NicheCardView | null): string | null {
  if (card) return card.edition;
  return niche && (template.editions ?? []).some((edition) => edition.id === niche) ? niche : null;
}

/**
 * The full-page storefront preview on tallaby.com (`/template-preview/<key>`),
 * in `locale` (Arabic has no prefix), with the niche edition shown. The route
 * checks the edition itself and falls back to the template's own content.
 */
export function templatePreviewPageUrl(origin: string, locale: string, key: string, edition: string | null): string {
  const prefix = locale === "en" ? "/en" : "";
  const query = edition ? `?edition=${encodeURIComponent(edition)}` : "";
  return `${origin}${prefix}/template-preview/${encodeURIComponent(key)}${query}`;
}
