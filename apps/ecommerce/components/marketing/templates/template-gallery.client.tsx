"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChoiceGroup } from "@/components/marketing/site/choice-group.client";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { TEMPLATE_CATEGORIES, displayName, type TemplateCategory } from "@/lib/marketing/templates.data";
import type { GalleryEntry } from "@/lib/marketing/templates.lib";
import { SoonBadge, TemplateFrame } from "./template-card";

/**
 * Filterable template grid. `home`: cards with "Use this template" and a
 * preview link. `page`: whole cards link to the template, with colour
 * swatches, a count and a "start from blank" card. `entries` come from
 * getTemplateGallery (installable templates first, then "coming soon" previews).
 */
export function TemplateGallery({ entries, variant, heading }: { entries: GalleryEntry[]; variant: "home" | "page"; heading?: React.ReactNode }) {
  const t = useTranslations("templates");
  const th = useTranslations("home.templates");
  const [category, setCategory] = React.useState<TemplateCategory>("all");

  const matching = entries.filter((tpl) => category === "all" || tpl.category === category);
  // Two rows of three on the home page; the templates page shows them all.
  const visible = variant === "home" ? matching.slice(0, 6) : matching;
  const used = new Set(entries.map((e) => e.category));
  const chips = (
    <ChoiceGroup
      value={category}
      onChange={setCategory}
      label={th("filter")}
      options={TEMPLATE_CATEGORIES.filter((c) => c === "all" || used.has(c)).map((c) => ({ value: c, label: t(`categories.${c}`) }))}
    />
  );

  return (
    <>
      {variant === "home" ? (
        <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
          {heading}
          {chips}
        </div>
      ) : (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
          {chips}
          <span className="text-sm text-neutral-600">{t("count", { count: visible.length })}</span>
        </div>
      )}

      <div className="grid gap-x-7 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((tpl) => {
          const name = tpl.name ?? (tpl.preview ? displayName(tpl.preview.look.name) : tpl.id);
          const desc = tpl.description ?? (tpl.preview ? t(`items.${tpl.id}.desc`) : "");
          const soon = tpl.status === "soon";
          const badge = soon ? <SoonBadge>{t("soon")}</SoonBadge> : null;

          if (variant === "home") {
            return (
              <article key={tpl.id} className="group flex flex-col gap-3.5">
                <TemplateFrame
                  look={tpl.preview?.look}
                  image={tpl.thumbnailUrl}
                  badge={badge}
                  overlay={soon ? undefined : <SignupTrigger size="sm">{th("use")}</SignupTrigger>}
                />
                <div className="flex items-center justify-between gap-2.5">
                  <div>
                    <b className="block font-latin text-base text-teal-900">{name}</b>
                    <span className="text-[13px] text-neutral-600">{desc}</span>
                  </div>
                  <Link
                    href={`/templates/${tpl.id}`}
                    aria-label={`${th("preview")} ${name}`}
                    className="flex items-center gap-1 text-sm font-bold text-teal-700"
                  >
                    {th("preview")}
                    <ForwardArrow />
                  </Link>
                </div>
              </article>
            );
          }

          return (
            <Link key={tpl.id} href={`/templates/${tpl.id}`} className="group flex flex-col gap-3.5 hover:no-underline">
              <TemplateFrame
                look={tpl.preview?.look}
                image={tpl.thumbnailUrl}
                badge={badge}
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
                  <b className="block font-latin text-[17px] font-bold text-teal-900">{name}</b>
                  <small className="text-[13px] text-neutral-600">{desc}</small>
                </div>
                <div className="flex gap-1">
                  {tpl.preview?.variants.map(([accent]) => (
                    <i key={accent} className="block size-4 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" style={{ background: accent }} />
                  ))}
                </div>
              </div>
            </Link>
          );
        })}

        {variant === "page" ? (
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
        ) : null}
      </div>

      {variant === "home" ? (
        <div className="mt-10 text-center">
          <CtaButton asChild tone="outline">
            <Link href="/templates">{th("seeAll")}</Link>
          </CtaButton>
        </div>
      ) : null}
    </>
  );
}
