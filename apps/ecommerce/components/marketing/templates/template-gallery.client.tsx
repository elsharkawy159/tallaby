"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChoiceGroup } from "@/components/marketing/site/choice-group.client";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { TEMPLATE_CATEGORIES, type TemplateCategory } from "@/lib/marketing/templates.data";
import { templateFrameSrc, type GalleryEntry } from "@/lib/marketing/templates.lib";
import { TemplateFrame } from "./template-card";

/**
 * The /templates grid: category chips, whole cards linking to the template
 * with colour swatches, a count and a "start from blank" card. `entries` come
 * from getTemplateGallery: the active templates, default first. A card shows
 * the template's thumbnail, or its real home page live when it has none.
 * `?category=<code>` (the home page's category cards) picks the first filter.
 */
const PAGE_SIZE = 12;

function isCategory(value: string | null): value is TemplateCategory {
  return (TEMPLATE_CATEGORIES as readonly string[]).includes(value ?? "");
}

export function TemplateGallery({ entries }: { entries: GalleryEntry[] }) {
  const t = useTranslations("templates");
  const locale = useLocale();
  const th = useTranslations("home.templates");
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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <ChoiceGroup
          value={category}
          onChange={(next) => {
            setCategory(next);
            setShown(PAGE_SIZE);
          }}
          label={th("filter")}
          options={TEMPLATE_CATEGORIES.filter((c) => c === "all" || used.has(c)).map((c) => ({ value: c, label: t(`categories.${c}`) }))}
        />
        <span className="text-sm text-neutral-600">{t("count", { count: matching.length })}</span>
      </div>

      <div className="grid gap-x-7 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((tpl) => (
          <Link key={tpl.id} href={`/templates/${tpl.id}`} className="group flex flex-col gap-3.5 hover:no-underline">
            <TemplateFrame
              image={tpl.thumbnailUrl}
              liveSrc={templateFrameSrc(locale, tpl.id, undefined, true)}
              url={`${tpl.id}.tallaby.com`}
              overlay={
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-[18px] py-2.5 text-sm font-bold text-teal-900">
                  {t("previewTemplate")}
                  <ForwardArrow />
                </span>
              }
            />
            <div className="flex items-center justify-between gap-3">
              <div>
                <b className="block font-latin text-[17px] font-bold text-teal-900">{tpl.name}</b>
                <small className="text-[13px] text-neutral-600">{tpl.description ?? ""}</small>
              </div>
              <div className="flex gap-1">
                {tpl.palette.slice(0, 4).map((color, i) => (
                  <i key={`${i}-${color}`} className="block size-4 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" style={{ background: color }} />
                ))}
              </div>
            </div>
          </Link>
        ))}

        <div className="grid min-h-[260px] place-items-center rounded-2xl border-2 border-dashed border-teal-100 bg-white p-8 text-center text-teal-900">
          <div>
            <span className="mx-auto mb-3.5 grid size-14 place-items-center rounded-2xl bg-teal-50 text-teal-700">
              <Plus className="size-6" aria-hidden />
            </span>
            <b>{t("blankTitle")}</b>
            <p className="mt-1.5 mb-4 text-sm text-neutral-600">{t("blankBody")}</p>
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
