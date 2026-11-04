"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Chip, ChipRow } from "@/components/marketing/site/chips";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { IconTile } from "@/components/marketing/site/site-card";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { TEMPLATE_CATEGORIES, type TemplateCategory } from "@/lib/marketing/templates.data";
import { templateFrameSrc, type GalleryEntry } from "@/lib/marketing/templates.lib";
import { TemplateLiveThumb } from "./template-live-thumb.client";

/**
 * The /templates grid: category chips, a count, and cards with each template's
 * real home page. `entries` comes from getTemplateGallery, the code catalog.
 * `?category=<code>` picks the first filter.
 */
const PAGE_SIZE = 12;

function isCategory(value: string | null): value is TemplateCategory {
  return (TEMPLATE_CATEGORIES as readonly string[]).includes(value ?? "");
}

export function TemplateGallery({ entries }: { entries: GalleryEntry[] }) {
  const t = useTranslations("templates");
  const locale = useLocale();
  const [category, setCategory] = React.useState<TemplateCategory>("all");
  const [shown, setShown] = React.useState(PAGE_SIZE);

  // Read after hydration so the page stays static (no useSearchParams bailout).
  React.useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("category");
    if (isCategory(requested)) setCategory(requested);
  }, []);

  const matching = entries.filter((tpl) => category === "all" || tpl.category === category);
  // A page at a time: over 100 templates made the phone page tens of thousands of px tall.
  const visible = matching.slice(0, shown);
  const used = new Set(entries.map((e) => e.category));

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 min-[641px]:flex-row min-[641px]:flex-wrap min-[641px]:items-center min-[641px]:justify-between">
        <ChipRow role="group" aria-label={t("categoriesLabel")}>
          {TEMPLATE_CATEGORIES.filter((c) => c === "all" || used.has(c)).map((c) => (
            <Chip
              key={c}
              selected={c === category}
              onClick={() => {
                setCategory(c);
                setShown(PAGE_SIZE);
              }}
            >
              {t(`categories.${c}`)}
            </Chip>
          ))}
        </ChipRow>
        <span aria-live="polite" className="text-sm text-ink-400">{t("count", { count: matching.length })}</span>
      </div>

      <div className="grid gap-5 min-[641px]:grid-cols-2 min-[1081px]:grid-cols-3">
        {visible.map((tpl) => (
          <article key={tpl.id} className="flex flex-col overflow-hidden rounded-card-lg border border-line bg-white shadow-soft transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-raise">
            <div className="flex items-center justify-between gap-2.5 px-[18px] pt-4 pb-3">
              <div className="min-w-0">
                <h3 className="truncate font-latin text-base font-bold text-teal-900">{tpl.name}</h3>
                <small className="line-clamp-1 text-[12.5px] text-ink-500">{tpl.description ?? ""}</small>
              </div>
              <span className="flex-none rounded-full bg-teal-50 px-2.5 py-0.5 text-[11.5px] font-bold whitespace-nowrap text-teal-700">{t(`categories.${tpl.category}`)}</span>
            </div>
            <Link href={`/templates/${tpl.id}`} aria-label={t("previewNamed", { name: tpl.name })} className="group/preview relative mx-3 block overflow-hidden rounded-[18px] border border-[#edf1f2] hover:no-underline">
              <TemplateLiveThumb src={templateFrameSrc(locale, tpl.id, undefined, true)} />
              <span className="absolute inset-0 grid place-items-center bg-teal-900/55 opacity-0 transition-opacity duration-200 group-hover/preview:opacity-100 group-focus-visible/preview:opacity-100">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-[18px] py-2.5 text-sm font-bold text-teal-900">
                  {t("previewTemplate")}
                  <ForwardArrow />
                </span>
              </span>
            </Link>
            {tpl.palette.length ? (
              <div className="flex items-center gap-1.5 px-[18px] pt-3 text-xs text-ink-500">
                {t("colors")}
                {tpl.palette.slice(0, 4).map((color, i) => (
                  <i key={`${i}-${color}`} className="size-[18px] rounded-full border-2 border-white shadow-[0_0_0_1px_#dfe8ea]" style={{ background: color }} />
                ))}
              </div>
            ) : null}
            <div className="mt-auto flex gap-2 px-[18px] pt-3.5 pb-[18px]">
              <SignupTrigger size="sm" className="h-11 flex-1 shadow-none!">{t("use")}</SignupTrigger>
              <CtaButton asChild tone="outline" size="sm" className="h-11">
                <Link href={`/templates/${tpl.id}`}>{t("preview")}</Link>
              </CtaButton>
            </div>
          </article>
        ))}

        <div className="flex min-h-[320px] flex-col items-center justify-center gap-2.5 rounded-card-lg border-2 border-dashed border-[#d6e3e6] bg-white/60 p-8 text-center">
          <IconTile>
            <Plus aria-hidden />
          </IconTile>
          <b className="text-[17px] text-teal-900">{t("blankTitle")}</b>
          <p className="max-w-[260px] text-sm text-[#5f7277]">{t("blankBody")}</p>
          <SignupTrigger tone="outline" size="sm">
            {t("blankCta")}
          </SignupTrigger>
        </div>
      </div>

      {matching.length > visible.length ? (
        <div className="mt-10 text-center">
          <CtaButton type="button" tone="outline" onClick={() => setShown((n) => n + PAGE_SIZE)}>
            {t("showMore", { count: matching.length - visible.length })}
          </CtaButton>
        </div>
      ) : null}
    </>
  );
}
