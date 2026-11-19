"use client";

import * as React from "react";
import { Chip, ChipRow } from "@/components/marketing/site/chips";
import { TemplateRailCard } from "@/components/marketing/pages/template-rail";
import type { GalleryEntry } from "@/lib/marketing/templates.lib";

/** Category chips over a sideways row of real template cards. */
export function TemplateRail({
  entries,
  categories,
  locale,
  ariaLabel,
  previewLabel,
}: {
  entries: GalleryEntry[];
  categories: { id: string; label: string }[];
  locale: string;
  ariaLabel: string;
  previewLabel: string;
}) {
  const [category, setCategory] = React.useState(categories[0]?.id ?? "");
  const shown = entries.filter((entry) => entry.category === category);
  return (
    <>
      <ChipRow role="toolbar" aria-label={ariaLabel} className="mb-6 justify-start min-[861px]:justify-center">
        {categories.map((item) => (
          <Chip key={item.id} selected={item.id === category} onClick={() => setCategory(item.id)}>
            {item.label}
          </Chip>
        ))}
      </ChipRow>
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto scroll-smooth px-4 pt-1 pb-3.5 [scroll-snap-type:x_mandatory] motion-reduce:scroll-auto sm:-mx-5 sm:px-5">
        {shown.map((entry) => (
          <TemplateRailCard key={entry.id} entry={entry} locale={locale} previewLabel={previewLabel} className="flex-[0_0_78vw] sm:flex-[0_0_300px]" />
        ))}
      </div>
    </>
  );
}
