"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import { cn } from "@workspace/ui/lib/utils";
import type { IndustryCode, IndustryOption, NicheOption } from "@/lib/marketing/template-filters.lib";

/** Niches listed before "Show all": a niche-only industry list runs to 80+. */
const NICHES_SHOWN = 8;

/** The radio value of "All trades" (Radix wants a non-empty value). */
const ANY_NICHE = "__any";

const rowClassName =
  "flex min-h-9 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-[14.5px] text-ink-600 transition-colors duration-150 hover:bg-teal-50/70 motion-reduce:transition-none has-[[data-state=checked]]:font-semibold has-[[data-state=checked]]:text-teal-900";

const controlClassName =
  "size-[18px] border-line-strong bg-white shadow-none focus-visible:border-teal-700 focus-visible:ring-teal-500/40 data-[state=checked]:border-teal-900 data-[state=checked]:bg-teal-900 data-[state=checked]:text-white";

/** A collapsible filter group: a quiet title row over its options. */
function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-line py-4 first:pt-0 last:border-b-0">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1 text-start text-[15px] font-bold text-teal-900 outline-none focus-visible:ring-[3px] focus-visible:ring-teal-500/50">
        {title}
        <ChevronDown aria-hidden className={cn("size-4 text-ink-400 transition-transform duration-150 motion-reduce:transition-none", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function Count({ value }: { value: number }) {
  return <span className="ms-auto ps-2 text-[13px] font-normal text-ink-400 tabular-nums">{value}</span>;
}

/**
 * The /templates filters: industries (checkboxes) and one trade (radio). The
 * same panel sits in the desktop sidebar and in the phone sheet; `idPrefix`
 * keeps the two copies' input ids apart.
 */
export function TemplateFilterPanel({
  idPrefix,
  dir,
  industries,
  niches,
  selectedIndustries,
  selectedNiche,
  anyNicheCount,
  industryLabel,
  onToggleIndustry,
  onPickNiche,
}: {
  idPrefix: string;
  dir: "ltr" | "rtl";
  industries: readonly IndustryOption[];
  niches: readonly NicheOption[];
  selectedIndustries: readonly IndustryCode[];
  selectedNiche: string | null;
  /** Cards listed for the picked industries with no trade picked. */
  anyNicheCount: number;
  industryLabel: (code: IndustryCode) => string;
  onToggleIndustry: (code: IndustryCode) => void;
  onPickNiche: (id: string | null) => void;
}) {
  const t = useTranslations("templates.filters");
  const [allNiches, setAllNiches] = React.useState(false);
  const selectedIndex = niches.findIndex((niche) => niche.id === selectedNiche);
  // A picked niche past the fold keeps the list open, so the choice is always in view.
  const expanded = allNiches || selectedIndex >= NICHES_SHOWN;
  const shownNiches = expanded ? niches : niches.slice(0, NICHES_SHOWN);

  return (
    <div>
      <FilterGroup title={t("industries")}>
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          {industries.map((option) => {
            const id = `${idPrefix}-industry-${option.code}`;
            return (
              <li key={option.code}>
                <label htmlFor={id} className={rowClassName}>
                  <Checkbox id={id} checked={selectedIndustries.includes(option.code)} onCheckedChange={() => onToggleIndustry(option.code)} className={controlClassName} />
                  <span className="min-w-0 truncate">{industryLabel(option.code)}</span>
                  <Count value={option.count} />
                </label>
              </li>
            );
          })}
        </ul>
      </FilterGroup>

      {niches.length ? (
        <FilterGroup title={t("niches")}>
          <RadioGroup dir={dir} value={selectedNiche ?? ANY_NICHE} onValueChange={(value) => onPickNiche(value === ANY_NICHE ? null : value)} aria-label={t("niches")} className="gap-0.5">
            {[{ id: ANY_NICHE, name: t("anyNiche"), count: anyNicheCount }, ...shownNiches].map((option) => {
              const id = `${idPrefix}-niche-${option.id}`;
              return (
                <label key={option.id} htmlFor={id} className={rowClassName}>
                  <RadioGroupItem id={id} value={option.id} className={cn(controlClassName, "data-[state=checked]:bg-white [&_svg]:fill-teal-900 [&_svg]:text-teal-900")} />
                  <span className="min-w-0 truncate">{option.name}</span>
                  <Count value={option.count} />
                </label>
              );
            })}
          </RadioGroup>
          {niches.length > NICHES_SHOWN && selectedIndex < NICHES_SHOWN ? (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setAllNiches((value) => !value)}
              className="mt-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-teal-700 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-teal-500/50"
            >
              {expanded ? t("showFewer") : t("showAll", { count: niches.length })}
            </button>
          ) : null}
        </FilterGroup>
      ) : null}
    </div>
  );
}
