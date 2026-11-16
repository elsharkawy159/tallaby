"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Chip, ChipRow } from "@/components/marketing/site/chips";
import { CtaButton } from "@/components/marketing/site/cta-button";
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

/**
 * A card's width, so the browser picks the 600 px or 1200 px desktop shot: three
 * across the 1600 px container (40 px gutters, 32 px gaps) from 1081 px, two below,
 * one on phones (which get the phone shot instead).
 */
const GALLERY_CARD_SIZES = "(min-width: 1081px) calc((min(100vw, 1600px) - 144px) / 3), (min-width: 641px) calc(50vw - 40px), 100vw";

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

      {/*
        Tall cards in the style of themes.shopify.com (2026-11-16): the home page shot,
        panned on hover or keyboard focus, then the name and the niche. The whole card is
        one link to the template page; "Use" and the live demo live there.
      */}
      <div className="grid gap-x-6 gap-y-10 min-[641px]:grid-cols-2 min-[1081px]:grid-cols-3 min-[1081px]:gap-x-8 min-[1081px]:gap-y-14">
        {ordered.map((tpl) => {
          // On a niche tab every listed card is that niche's edition; a niche-only industry's card is its niche's.
          const card = visibleIds.has(tpl.id) ? cardOf.get(tpl.id) : undefined;
          const edition = card?.edition ?? null;
          // Its home page screenshot when it shows this card's edition (owner, 2026-11-12), else drawn live.
          const shot = tpl.shot && tpl.shot.edition === edition ? tpl.shot : null;
          const href = edition ? `/templates/${tpl.id}?edition=${encodeURIComponent(edition)}` : `/templates/${tpl.id}`;
          return (
            <article key={tpl.id} hidden={!visibleIds.has(tpl.id)} className="tpl-shot-trigger group/card min-w-0 [&[hidden]]:hidden">
              <Link
                href={href}
                aria-label={t("previewNamed", { name: tpl.name })}
                className="block rounded-[18px] outline-none hover:no-underline focus-visible:ring-[3px] focus-visible:ring-teal-500 focus-visible:ring-offset-4"
              >
                <TemplateThumb
                  key={edition ?? "own"}
                  shot={shot}
                  liveSrc={templateFrameSrc(locale, tpl.id, undefined, true, edition)}
                  sizes={GALLERY_CARD_SIZES}
                  className="rounded-[18px] border border-line bg-[#eef3f4] shadow-soft transition-shadow duration-300 group-hover/card:shadow-raise"
                />
                <div className="flex items-start justify-between gap-3 px-1 pt-4">
                  <div className="min-w-0">
                    <h3 className="truncate font-latin text-[17px] leading-snug font-bold text-teal-900">{tpl.name}</h3>
                    <p className="mt-0.5 truncate text-sm text-ink-500">{card?.tag ?? t(`categories.${tpl.category}`)}</p>
                  </div>
                  <span className="flex-none pt-0.5 text-sm font-semibold text-teal-700">{tpl.price ? null : t("detail.free")}</span>
                </div>
              </Link>
            </article>
          );
        })}

        <div className="flex min-w-0 flex-col">
          <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2.5 rounded-[18px] border-2 border-dashed border-[#d6e3e6] bg-white/60 p-8 text-center">
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
