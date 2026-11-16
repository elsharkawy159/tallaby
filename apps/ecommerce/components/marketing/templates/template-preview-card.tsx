import { Link } from "@/i18n/navigation";
import type { PreviewShot } from "@workspace/store-sections/template-preview";
import { TemplateThumb } from "./template-thumb";

/**
 * A tall template card in the style of themes.shopify.com (2026-11-16): the
 * home page shot, panned on hover or keyboard focus (`.tpl-shot-trigger`), then
 * the name and the niche. The whole card is one link to the template page;
 * "Use" and the live demo live there. Used by the /templates gallery and the
 * home page. Strings come in resolved, so it renders on the server or the client.
 */
export function TemplatePreviewCard({
  href,
  name,
  tag,
  linkLabel,
  badge,
  shot,
  liveSrc,
  sizes,
  hidden,
  thumbKey,
}: {
  href: string;
  name: string;
  /** The niche or category under the name. */
  tag: string;
  /** The link's accessible name ("Preview <name>"). */
  linkLabel: string;
  /** A short note at the end of the name row ("Free"), or nothing. */
  badge?: string | null;
  shot: PreviewShot | null;
  liveSrc: string;
  sizes: string;
  hidden?: boolean;
  /** Remounts the preview when the shown edition changes (the gallery's niche tabs). */
  thumbKey?: string;
}) {
  return (
    <article hidden={hidden} className="tpl-shot-trigger group/card min-w-0 [&[hidden]]:hidden">
      <Link
        href={href}
        aria-label={linkLabel}
        className="block rounded-[18px] outline-none hover:no-underline focus-visible:ring-[3px] focus-visible:ring-teal-500 focus-visible:ring-offset-4"
      >
        <TemplateThumb
          key={thumbKey}
          shot={shot}
          liveSrc={liveSrc}
          sizes={sizes}
          // Phones (owner, 2026-11-16): 70% of the screen's height instead of 3:4, so the shot reads big.
          className="rounded-[18px] border border-line bg-[#eef3f4] shadow-soft transition-shadow duration-300 group-hover/card:shadow-raise max-[640px]:aspect-auto max-[640px]:h-[70svh]"
        />
        <div className="flex items-start justify-between gap-3 px-1 pt-4">
          <div className="min-w-0">
            <h3 className="truncate font-latin text-[17px] leading-snug font-bold text-teal-900">{name}</h3>
            <p className="mt-0.5 truncate text-sm text-ink-500">{tag}</p>
          </div>
          {badge ? <span className="flex-none pt-0.5 text-sm font-semibold text-teal-700">{badge}</span> : null}
        </div>
      </Link>
    </article>
  );
}
