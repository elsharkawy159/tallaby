"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Chip, ChipRow } from "@/components/marketing/site/chips";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { IconTile } from "@/components/marketing/site/site-card";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { TEMPLATE_CATEGORIES, type TemplateCategory } from "@/lib/marketing/templates.data";
import { galleryCards, templateFrameSrc, type GalleryEntry, type GalleryNicheTab } from "@/lib/marketing/templates.lib";
import { TemplateThumb } from "./template-thumb";

/**
 * The /templates grid: category chips, a count, and cards with each template's
 * real home page. `entries` comes from getTemplateGallery, the code catalog.
 * `?category=<code>` picks the first filter.
 *
 * Niche editions (ROADMAP F-90): niches work like categories (owner request
 * 2026-11-11), as in the dashboard gallery. A category with niche tabs gets a
 * second row ("All <category>", then each niche, `?niche=<id>`); a niche tab
 * lists only the templates made for it, best first, each drawn and linked
 * with that niche's edition (`?edition=<id>`).
 */
const PAGE_SIZE = 12;

function isCategory(value: string | null): value is TemplateCategory {
  return (TEMPLATE_CATEGORIES as readonly string[]).includes(value ?? "");
}

export function TemplateGallery({ entries, niches = [] }: { entries: GalleryEntry[]; niches?: GalleryNicheTab[] }) {
  const t = useTranslations("templates");
  const locale = useLocale();
  const [category, setCategory] = React.useState<TemplateCategory>("all");
  const [nicheId, setNicheId] = React.useState<string | null>(null);
  const [shown, setShown] = React.useState(PAGE_SIZE);

  // Read after hydration so the page stays static (no useSearchParams bailout).
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("category");
    if (!isCategory(requested)) return;
    setCategory(requested);
    const niche = params.get("niche");
    if (niches.some((tab) => tab.id === niche && tab.category === requested)) setNicheId(niche);
  }, [niches]);

  /** Shows a tab and mirrors it in the URL (no navigation, so the page stays static). */
  const pick = (nextCategory: TemplateCategory, nextNiche: string | null) => {
    setCategory(nextCategory);
    setNicheId(nextNiche);
    setShown(PAGE_SIZE);
    const params = new URLSearchParams(window.location.search);
    if (nextCategory === "all") params.delete("category");
    else params.set("category", nextCategory);
    if (nextNiche) params.set("niche", nextNiche);
    else params.delete("niche");
    const qs = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  };

  const tabs = category === "all" ? [] : niches.filter((tab) => tab.category === category);
  const niche = tabs.find((tab) => tab.id === nicheId) ?? null;
  // A niche tab lists its looks in its own order; a niche-only industry (ROADMAP F-90) its niche cards first.
  const cards = galleryCards(entries, niches, category, niche?.id ?? null);
  const matching = cards.map((card) => card.entry);
  const cardOf = new Map(cards.map((card) => [card.entry.id, card]));
  // The other cards stay in the HTML, hidden.
  const ordered = [...matching, ...entries.filter((tpl) => !cardOf.has(tpl.id))];
  // A page at a time: over 100 templates made the phone page tens of thousands of px tall.
  // Every card is still in the server HTML (a plain link to /templates/<id>), so all of
  // them can be crawled; the rest are hidden. A hidden card has no width, so its live
  // preview frame never mounts until "Show more" or a filter reveals it.
  const visible = matching.slice(0, shown);
  const visibleIds = new Set(visible.map((tpl) => tpl.id));
  const used = new Set(entries.map((e) => e.category));

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 min-[641px]:flex-row min-[641px]:flex-wrap min-[641px]:items-center min-[641px]:justify-between">
        <ChipRow role="group" aria-label={t("categoriesLabel")} className="flex-wrap overflow-x-visible">
          {TEMPLATE_CATEGORIES.filter((c) => c === "all" || used.has(c)).map((c) => (
            <Chip key={c} selected={c === category} onClick={() => pick(c, null)}>
              {t(`categories.${c}`)}
            </Chip>
          ))}
        </ChipRow>
        <span aria-live="polite" className="text-sm text-ink-400">
          {t("count", { count: matching.length })}
        </span>
        {tabs.length ? (
          <ChipRow
            role="group"
            aria-label={t("nichesLabel", {
              category: t(`categories.${category}`),
            })}
            className="flex-wrap overflow-x-visible min-[641px]:basis-full"
          >
            {[
              {
                id: null,
                name: t("nicheAll", { category: t(`categories.${category}`) }),
              },
              ...tabs,
            ].map((tab) => (
              <Chip key={tab.id ?? "all"} selected={(niche?.id ?? null) === tab.id} onClick={() => pick(category, tab.id)} className="h-9 px-4 text-[13px]">
                {tab.name}
              </Chip>
            ))}
          </ChipRow>
        ) : null}
      </div>

      <div className="grid gap-5 min-[641px]:grid-cols-2 min-[1081px]:grid-cols-3 min-[1201px]:grid-cols-4">
        {ordered.map((tpl) => {
          // On a niche tab every listed card is that niche's edition; a niche-only industry's card is its niche's.
          const card = visibleIds.has(tpl.id) ? cardOf.get(tpl.id) : undefined;
          const edition = card?.edition ?? null;
          // Its home page screenshot when it shows this card's edition (owner, 2026-11-12), else drawn live.
          const shot = tpl.shot && tpl.shot.edition === edition ? tpl.shot : null;
          const href = edition ? `/templates/${tpl.id}?edition=${encodeURIComponent(edition)}` : `/templates/${tpl.id}`;
          return (
            <article
              key={tpl.id}
              hidden={!visibleIds.has(tpl.id)}
              className="tpl-shot-trigger flex flex-col [&[hidden]]:hidden overflow-hidden rounded-card-lg border border-line bg-white shadow-soft transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-raise"
            >
              <div className="flex items-center justify-between gap-2.5 px-[18px] pt-4 pb-3">
                <div className="min-w-0">
                  <h3 className="truncate font-latin text-base font-bold text-teal-900">{tpl.name}</h3>
                  <small className="line-clamp-1 text-[12.5px] text-ink-500">{tpl.description ?? ""}</small>
                </div>
                <span className="flex-none rounded-full bg-teal-50 px-2.5 py-0.5 text-[11.5px] font-bold whitespace-nowrap text-teal-700">
                  {card?.tag ?? t(`categories.${tpl.category}`)}
                </span>
              </div>
              <Link
                href={href}
                aria-label={t("previewNamed", { name: tpl.name })}
                className="group/preview relative mx-3 block overflow-hidden rounded-[18px] border border-[#edf1f2] hover:no-underline"
              >
                <TemplateThumb
                  key={edition ?? "own"}
                  shot={shot}
                  liveSrc={templateFrameSrc(locale, tpl.id, undefined, true, edition)}
                  sizes="(min-width: 1201px) 290px, (min-width: 641px) 45vw, 92vw"
                />
                {/* Over a screenshot the button sits low on a light shade, so the page scrolling behind it stays in view. */}
                <span
                  className={cn(
                    "absolute inset-0 grid justify-items-center opacity-0 transition-opacity duration-200 group-hover/preview:opacity-100 group-focus-visible/preview:opacity-100",
                    shot ? "items-end bg-linear-to-t from-teal-900/60 via-transparent to-transparent pb-5" : "items-center bg-teal-900/55",
                  )}
                >
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
                <SignupTrigger size="sm" className="h-11 flex-1 shadow-none!">
                  {t("use")}
                </SignupTrigger>
                <CtaButton asChild tone="outline" size="sm" className="h-11">
                  <Link href={href}>{t("preview")}</Link>
                </CtaButton>
              </div>
            </article>
          );
        })}

        <div className="flex min-h-[320px] flex-col items-center justify-center gap-2.5 rounded-card-lg border-2 border-dashed border-[#d6e3e6] bg-white/60 p-8 text-center">
          <IconTile>
            <Plus aria-hidden />
          </IconTile>
          <b className="text-[17px] text-teal-900">{t("blankTitle")}</b>
          <p className="max-w-[260px] text-sm text-ink-500">{t("blankBody")}</p>
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
