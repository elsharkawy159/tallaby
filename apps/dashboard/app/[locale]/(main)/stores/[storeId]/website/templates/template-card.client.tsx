"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check, Eye, LayoutTemplate, Lock, RotateCcw, Sparkles } from "lucide-react";
import { TemplateShot } from "@workspace/ui/components/template-shot";
import { TEMPLATE_PREVIEW_MOBILE_MEDIA, previewShot, templatePreviewUrl } from "@workspace/store-sections/template-preview";
import { RemoteImage } from "@/components/media/remote-image";
import { SellerButton, Tag } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { TemplateLiveThumbnail } from "./template-preview.client";
import type { TemplateCardView } from "./templates.dto";
import { TEMPLATE_PREVIEW_ORIGIN, templatePreviewTabUrl } from "./templates.lib";

/**
 * One gallery tile (Claude Design 1c "Gallery tile"): the preview fills the
 * tile, Use / Preview buttons sit below it, always visible (owner,
 * 2026-11-07). A tap on the tile opens the preview dialog. Moved from
 * templates.client.tsx; the parent
 * owns the confirm and preview dialogs.
 */
export function TemplateCard({
  storeId,
  template,
  current,
  edition,
  nicheTag,
  categoryName,
  fontClassName,
  disabled,
  onPreview,
  onUse,
}: {
  storeId: string;
  template: TemplateCardView;
  /** The store's current template. */
  current: boolean;
  /** The niche edition this card shows and installs, or null for the template's own content. */
  edition: string | null;
  /** The edition's name as a tag ("" for none). */
  nicheTag: string;
  categoryName: string;
  fontClassName: string;
  /** Read-only store or an action running; a premium template is always disabled. */
  disabled: boolean;
  onPreview: () => void;
  onUse: () => void;
}) {
  const t = useTranslations("websiteTemplates");
  const tw = useTranslations("sellerWebsite.templates");
  const locale = useLocale() === "en" ? "en" : "ar";
  const name = template.name[locale] || template.name.ar || template.name.en || "";
  // Its home page screenshot, served by tallaby.com, when it shows this card's edition (owner, 2026-11-12): a tall card that scrolls the page on hover.
  const shot = previewShot(template.preview, locale, edition);

  return (
    <li className="tpl-shot-trigger group flex min-w-0 flex-col gap-3">
      <div className={cn("relative overflow-hidden rounded-2xl border border-(--s-line) bg-(--s-surface) shadow-(--s-shadow-card) transition-shadow duration-200 group-hover:shadow-(--s-shadow-hover)", current && "outline-2 outline-offset-2 outline-(--s-primary)")}>
        <button type="button" className="block w-full cursor-pointer text-start" onClick={onPreview} aria-label={t("preview.open", { name })}>
          {shot ? (
            <TemplateShot
              src={templatePreviewUrl(shot.src, TEMPLATE_PREVIEW_ORIGIN)}
              width={shot.width}
              height={shot.height}
              mobile={shot.mobile && { ...shot.mobile, src: templatePreviewUrl(shot.mobile.src, TEMPLATE_PREVIEW_ORIGIN) }}
              mobileMedia={TEMPLATE_PREVIEW_MOBILE_MEDIA}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 92vw"
              className="bg-(--s-fill)"
            />
          ) : template.thumbnailUrl ? (
            <span className="relative block aspect-[3/4] w-full">
              <RemoteImage src={template.thumbnailUrl} alt="" fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw" className="object-cover object-top" />
            </span>
          ) : (
            <TemplateLiveThumbnail storeId={storeId} templateKey={template.key} editionId={edition} fontClassName={fontClassName} fallback={<ThumbnailFallback tall />} tall />
          )}
        </button>
        {(current || template.isPremium) && (
          <span className="pointer-events-none absolute start-2.5 top-2.5 z-[2] flex gap-1.5">
            {current && (
              <span className="inline-flex items-center gap-1 rounded-full bg-(--s-solid) px-2.5 py-1 text-[11.5px] font-bold text-(--s-solid-fg)">
                <Check className="size-3.5" aria-hidden />
                {t("current")}
              </span>
            )}
            {template.isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-(--s-surface) px-2.5 py-1 text-[11.5px] font-bold text-(--s-muted)">
                <Lock className="size-3" aria-hidden />
                {t("soon")}
              </span>
            )}
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-1.5 text-[15.5px] font-bold text-(--s-ink)">
            <span className="min-w-0 truncate">{name}</span>
            {template.isDefault && !current && !nicheTag && <Tag>{t("default")}</Tag>}
            {nicheTag && <Tag tone="info">{nicheTag}</Tag>}
          </h3>
          <p className="text-[12.5px] text-(--s-subtle)">
            {categoryName} · {t("pagesCount", { count: template.pages.length })}
          </p>
        </div>
        <Swatches colors={template.palette} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SellerButton size="sm" className="whitespace-normal" disabled={disabled || template.isPremium} onClick={onUse}>
          {current ? <RotateCcw aria-hidden /> : <Sparkles aria-hidden />}
          {current ? tw("reapplyShort") : t("use")}
        </SellerButton>
        {/* The full-page template in a new tab, with this card's edition (owner, 2026-11-12). The tile still opens the preview dialog. */}
        <SellerButton asChild size="sm" variant="outline">
          <a
            href={templatePreviewTabUrl(TEMPLATE_PREVIEW_ORIGIN, locale, template.key, null, edition)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("preview.newTabLabel", { name })}
          >
            <Eye aria-hidden />
            {t("preview.action")}
          </a>
        </SellerButton>
      </div>
    </li>
  );
}

/** Colour swatches overlapping each other (`.sws`). */
export function Swatches({ colors }: { colors: readonly string[] }) {
  if (colors.length === 0) return null;
  return (
    <span aria-hidden className="flex shrink-0 pt-1.5">
      {colors.slice(0, 4).map((color, index) => (
        <i key={`${color}-${index}`} className={cn("size-[18px] rounded-full border-2 border-(--s-surface) shadow-[0_0_0_1px_var(--s-field)]", index > 0 && "-ms-1.5")} style={{ background: color }} />
      ))}
    </span>
  );
}

export function ThumbnailFallback({ tall = false }: { tall?: boolean }) {
  return (
    <span className={cn("grid w-full", tall ? "aspect-[3/4]" : "aspect-[380/398]", "place-items-center bg-(--s-fill) text-(--s-subtle)")}>
      <LayoutTemplate className="size-6" aria-hidden />
    </span>
  );
}
