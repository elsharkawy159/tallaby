"use client";

import * as React from "react";
import { Plus, SlidersHorizontal, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@workspace/ui/components/sheet";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { IconTile } from "@/components/marketing/site/site-card";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import {
  EMPTY_FILTERS,
  GALLERY_SORTS,
  filterGalleryCards,
  hasActiveFilters,
  industryOptions,
  nicheOptions,
  parseGalleryFilters,
  pickNiche,
  toggleIndustry,
  writeGalleryFilters,
  type GalleryFilters,
  type GallerySort,
  type IndustryCode,
} from "@/lib/marketing/template-filters.lib";
import { templateFrameSrc, type GalleryEntry, type GalleryNicheTab } from "@/lib/marketing/templates.lib";
import { TemplateFilterPanel } from "./template-filters.client";
import { TemplatePreviewCard } from "./template-preview-card";

/**
 * The /templates gallery (2026-11-16, like themes.shopify.com's collection
 * page): a sticky filter sidebar from 1081 px (a sheet below), the result
 * count, active-filter chips and a sort over the tall cards. `entries` comes
 * from getTemplateGallery, the code catalog.
 *
 * Filters (lib/marketing/template-filters.lib.ts): industries (category codes,
 * several at once) and one niche, kept in the URL as
 * `?industry=fa,be&niche=<id>&sort=newest`; the old `?category=<code>` and
 * `?category=<code>&niche=<id>` links still work.
 *
 * Niche editions (ROADMAP F-90): a niche lists only the templates made for
 * it, best first, each drawn and linked with that niche's edition
 * (`?edition=<id>`); a switched niche's template shows its niche on every view.
 */
const PAGE_SIZE = 12;

/**
 * A card's width, so the browser picks the 600 px or 1200 px desktop shot: in the
 * 1400 px container (40 px gutters) beside the 248 px sidebar and its 40 px gap,
 * three across (32 px gaps) from 1280 px, two from 1081 px; two on tablets, one on
 * phones (which get the phone shot instead).
 */
const GALLERY_CARD_SIZES =
  "(min-width: 1280px) calc((min(100vw, 1400px) - 432px) / 3), (min-width: 1081px) calc((100vw - 400px) / 2), (min-width: 641px) calc(50vw - 40px), 100vw";

const RTL_LOCALES = new Set(["ar"]);

export function TemplateGallery({ entries, niches = [] }: { entries: GalleryEntry[]; niches?: GalleryNicheTab[] }) {
  const t = useTranslations("templates");
  const locale = useLocale();
  const dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";
  const [filters, setFilters] = React.useState<GalleryFilters>(EMPTY_FILTERS);
  const [shown, setShown] = React.useState(PAGE_SIZE);

  // Read after hydration so the page stays static (no useSearchParams bailout).
  React.useEffect(() => {
    setFilters(parseGalleryFilters(window.location.search, niches));
  }, [niches]);

  /** Shows the filters and mirrors them in the URL (replaceState: no navigation and no scroll, so the page stays static). */
  const apply = (next: GalleryFilters) => {
    setFilters(next);
    setShown(PAGE_SIZE);
    const qs = writeGalleryFilters(next, window.location.search).toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  };

  const industryLabel = (code: IndustryCode) => t(`categories.${code}`);
  const industries = industryOptions(entries, niches);
  const nicheList = nicheOptions(niches, filters.industries);
  const cards = filterGalleryCards(entries, niches, filters, locale);
  const anyNicheCount = filterGalleryCards(entries, niches, { ...filters, niche: null }, locale).length;
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
  const active = hasActiveFilters(filters);
  const activeCount = filters.industries.length + (filters.niche ? 1 : 0);
  const pickedNiche = filters.niche ? niches.find((tab) => tab.id === filters.niche) : undefined;

  const onToggleIndustry = (code: IndustryCode) => apply(toggleIndustry(filters, code));
  const onPickNiche = (id: string | null) => apply(pickNiche(filters, id ? (niches.find((tab) => tab.id === id) ?? null) : null));
  const clearAll = () => apply({ ...EMPTY_FILTERS, sort: filters.sort });

  const panel = (idPrefix: string) => (
    <TemplateFilterPanel
      idPrefix={idPrefix}
      dir={dir}
      industries={industries}
      niches={nicheList}
      selectedIndustries={filters.industries}
      selectedNiche={filters.niche}
      anyNicheCount={anyNicheCount}
      industryLabel={industryLabel}
      onToggleIndustry={onToggleIndustry}
      onPickNiche={onPickNiche}
    />
  );

  return (
    <div className="min-[1081px]:grid min-[1081px]:grid-cols-[248px_minmax(0,1fr)] min-[1081px]:items-start min-[1081px]:gap-10">
      <aside aria-labelledby="gallery-filters-title" className="hidden min-[1081px]:sticky min-[1081px]:top-[92px] min-[1081px]:block min-[1081px]:max-h-[calc(100dvh-108px)] min-[1081px]:overflow-y-auto min-[1081px]:pe-1 no-scrollbar">
        <div className="mb-3 flex items-baseline justify-between gap-3 px-2">
          <h3 id="gallery-filters-title" className="text-[17px] font-bold text-ink-900">
            {t("filters.title")}
          </h3>
          {active ? (
            <button type="button" onClick={clearAll} className="rounded-md text-sm font-semibold text-ink-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-teal-500/50">
              {t("filters.clearAll")}
            </button>
          ) : null}
        </div>
        {panel("side")}
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex items-center gap-2.5 min-[641px]:gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex h-10 flex-none items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 text-sm font-semibold text-ink-600 outline-none hover:border-teal-300 focus-visible:ring-[3px] focus-visible:ring-teal-500/50 min-[1081px]:hidden"
              >
                <SlidersHorizontal className="size-4" aria-hidden />
                {t("filters.open")}
                {activeCount ? <span className="grid size-5 place-items-center rounded-full bg-teal-900 text-[11px] font-bold text-white tabular-nums">{activeCount}</span> : null}
              </button>
            </SheetTrigger>
            <SheetContent side={dir === "rtl" ? "right" : "left"} dir={dir} hideClose className="w-[88vw] max-w-[360px] gap-0 border-line bg-surface p-0 sm:max-w-[360px]">
              <SheetHeader className="flex-row items-center justify-between gap-3 border-b border-line px-5 py-4">
                <SheetTitle className="text-[17px] font-bold text-ink-900">{t("filters.title")}</SheetTitle>
                <SheetDescription className="sr-only">{t("count", { count: matching.length })}</SheetDescription>
                <SheetClose className="grid size-9 place-items-center rounded-full text-ink-500 outline-none hover:bg-tint focus-visible:ring-[3px] focus-visible:ring-teal-500/50" aria-label={t("filters.close")}>
                  <X className="size-5" aria-hidden />
                </SheetClose>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">{panel("sheet")}</div>
              <SheetFooter className="flex-row gap-2 border-t border-line px-5 py-4">
                {active ? (
                  <CtaButton type="button" tone="outline" onClick={clearAll} className="flex-none">
                    {t("filters.clearAll")}
                  </CtaButton>
                ) : null}
                <SheetClose asChild>
                  <CtaButton type="button" className="flex-1">
                    {t("filters.apply", { count: matching.length })}
                  </CtaButton>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <span aria-live="polite" className="min-w-0 truncate text-sm font-semibold text-ink-500">
            {t("count", { count: matching.length })}
          </span>

          <label className="ms-auto flex flex-none items-center gap-2 text-sm text-ink-500">
            <span className="max-[640px]:sr-only">{t("filters.sortLabel")}</span>
            <select
              value={filters.sort}
              onChange={(event) => apply({ ...filters, sort: event.target.value as GallerySort })}
              className="h-10 max-w-[150px] rounded-full border border-line-strong bg-surface ps-3 pe-2 text-[13px] min-[641px]:max-w-none min-[641px]:ps-4 min-[641px]:pe-3 min-[641px]:text-sm font-semibold text-ink-600 outline-none hover:border-teal-300 focus-visible:ring-[3px] focus-visible:ring-teal-500/50"
            >
              {GALLERY_SORTS.map((sort) => (
                <option key={sort} value={sort}>
                  {t(`filters.sort.${sort}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {active ? (
          <div role="group" aria-label={t("filters.active")} className="mb-7 flex flex-wrap items-center gap-2">
            {(pickedNiche ? [] : filters.industries).map((code) => (
              <ActiveChip key={code} label={industryLabel(code)} removeLabel={t("filters.remove", { name: industryLabel(code) })} onRemove={() => onToggleIndustry(code)} />
            ))}
            {pickedNiche ? (
              <>
                <ActiveChip label={industryLabel(pickedNiche.category)} removeLabel={t("filters.remove", { name: industryLabel(pickedNiche.category) })} onRemove={() => onToggleIndustry(pickedNiche.category)} />
                <ActiveChip label={pickedNiche.name} removeLabel={t("filters.remove", { name: pickedNiche.name })} onRemove={() => onPickNiche(null)} />
              </>
            ) : null}
            <button type="button" onClick={clearAll} className="rounded-md px-1.5 text-sm font-semibold text-ink-brand outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-teal-500/50">
              {t("filters.clearAll")}
            </button>
          </div>
        ) : (
          <div className="mb-7" />
        )}

        {matching.length ? null : (
          <div className="mb-10 flex flex-col items-center gap-4 rounded-[18px] border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center">
            <p className="max-w-[420px] text-[15px] text-pretty text-ink-500">{t("filters.emptyBody")}</p>
            <CtaButton type="button" tone="outline" onClick={clearAll}>
              {t("filters.emptyCta")}
            </CtaButton>
          </div>
        )}

        {/* Tall cards in the style of themes.shopify.com (TemplatePreviewCard). */}
        <div className="grid gap-x-6 gap-y-10 min-[641px]:grid-cols-2 min-[1081px]:gap-x-8 min-[1081px]:gap-y-14 min-[1280px]:grid-cols-3">
          {ordered.map((tpl) => {
            // A niche's cards are its edition; a switched niche's template shows its niche on every view.
            const card = visibleIds.has(tpl.id) ? cardOf.get(tpl.id) : undefined;
            const edition = card?.edition ?? null;
            // Its home page screenshot when it shows this card's edition (owner, 2026-11-12), else drawn live.
            const shot = tpl.shot && tpl.shot.edition === edition ? tpl.shot : null;
            const href = edition ? `/templates/${tpl.id}?edition=${encodeURIComponent(edition)}` : `/templates/${tpl.id}`;
            return (
              <TemplatePreviewCard
                key={tpl.id}
                hidden={!visibleIds.has(tpl.id)}
                href={href}
                name={tpl.name}
                tag={card?.tag ?? t(`categories.${tpl.category}`)}
                linkLabel={t("previewNamed", { name: tpl.name })}
                badge={tpl.price ? null : t("detail.free")}
                thumbKey={edition ?? "own"}
                shot={shot}
                liveSrc={templateFrameSrc(locale, tpl.id, undefined, true, edition)}
                sizes={GALLERY_CARD_SIZES}
              />
            );
          })}

          {matching.length ? (
            <div className="flex min-w-0 flex-col">
              <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2.5 rounded-[18px] border-2 border-dashed border-[#d6e3e6] dark:border-line bg-surface/60 p-8 text-center">
                <IconTile>
                  <Plus aria-hidden />
                </IconTile>
                <b className="text-[17px] text-ink-900">{t("blankTitle")}</b>
                <p className="max-w-[260px] text-sm text-ink-500">{t("blankBody")}</p>
                <SignupTrigger tone="outline" size="sm">
                  {t("blankCta")}
                </SignupTrigger>
              </div>
            </div>
          ) : null}
        </div>

        {matching.length > visible.length ? (
          <div className="mt-10 text-center">
            <CtaButton type="button" tone="outline" onClick={() => setShown((n) => n + PAGE_SIZE)}>
              {t("showMore", { count: matching.length - visible.length })}
            </CtaButton>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** A picked filter above the grid; the X removes it. */
function ActiveChip({ label, removeLabel, onRemove }: { label: string; removeLabel: string; onRemove: () => void }) {
  return (
    <span className="flex h-8 items-center gap-1 rounded-full border border-teal-900/15 bg-tint ps-3 pe-1 text-[13px] font-semibold text-ink-900">
      {label}
      <button type="button" onClick={onRemove} aria-label={removeLabel} className="grid size-6 place-items-center rounded-full outline-none hover:bg-tint-strong focus-visible:ring-2 focus-visible:ring-teal-500">
        <X className="size-3.5" aria-hidden />
      </button>
    </span>
  );
}
