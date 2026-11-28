"use client";

import { useLocale, useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Chip, Chips, Field, fieldClass } from "@/components/seller-ui";
import { STORE_INDUSTRIES, type StoreIndustry } from "@/lib/stores/industries.lib";
import type { NicheChoice } from "@/lib/stores/niche-choices.lib";
import { cn } from "@/lib/utils";

/** Radix Select has no "" value: the "None of these" niche goes through this one. */
const NO_NICHE = "__none__";

/**
 * The store's industry and, under it, the niche of the picked industry
 * (owner, 2026-11-15). Controlled: the parent keeps the values and decides
 * what an industry change does (Store settings › General starts
 * the niche again). `nicheId` "" is "none".
 * `variant`: chips or two dropdowns (Store settings ›
 * General, owner 2026-11-27), same values and strings.
 */
export function IndustryNichePicker({
  industryId,
  nicheId,
  niches,
  disabled,
  variant = "chips",
  onIndustryChange,
  onNicheChange,
}: {
  /** The picked industry's id, or null. */
  industryId: string | null;
  nicheId: string;
  /** The picked industry's niche chips, in the page's language (`nicheChoices`). */
  niches: NicheChoice[];
  disabled?: boolean;
  variant?: "chips" | "select";
  onIndustryChange: (industry: StoreIndustry) => void;
  onNicheChange: (nicheId: string) => void;
}) {
  const t = useTranslations("storeSettings");
  const uiLocale = useLocale();
  const industryName = (option: StoreIndustry) => (uiLocale === "en" ? option.en : option.ar);
  const nicheOptions = [...niches, { id: "", name: t("fields.nicheNone") }];
  // A saved niche of another industry (or none) shows as "None of these", as on the chips.
  const nicheValue = niches.some((choice) => choice.id === nicheId) ? nicheId : NO_NICHE;

  if (variant === "select") {
    return (
      <>
        <Field label={t("fields.industry")} htmlFor="store-industry" note={t("fields.industryHint")}>
          <Select
            value={industryId ?? undefined}
            disabled={disabled}
            onValueChange={(id) => {
              const option = STORE_INDUSTRIES.find((industry) => industry.id === id);
              if (option) onIndustryChange(option);
            }}
          >
            <SelectTrigger id="store-industry" className={cn(fieldClass, "!h-[46px]")}>
              <SelectValue placeholder={t("fields.industryPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {STORE_INDUSTRIES.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {industryName(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {niches.length > 0 && (
          <Field label={t("fields.niche")} htmlFor="store-niche" note={t("fields.nicheHint")}>
            <Select
              value={nicheValue}
              disabled={disabled}
              onValueChange={(id) => onNicheChange(id === NO_NICHE ? "" : id)}
            >
              <SelectTrigger id="store-niche" className={cn(fieldClass, "!h-[46px]")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {nicheOptions.map((option) => (
                  <SelectItem key={option.id || NO_NICHE} value={option.id || NO_NICHE}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </>
    );
  }

  return (
    <>
      <Field label={t("fields.industry")} note={t("fields.industryHint")}>
        <Chips role="group" aria-label={t("fields.industry")}>
          {STORE_INDUSTRIES.map((option) => (
            <Chip
              key={option.id}
              pressed={industryId === option.id}
              disabled={disabled}
              className="disabled:opacity-50"
              onClick={() => onIndustryChange(option)}
            >
              {industryName(option)}
            </Chip>
          ))}
        </Chips>
      </Field>
      {niches.length > 0 && (
        <Field label={t("fields.niche")} note={t("fields.nicheHint")}>
          <Chips role="group" aria-label={t("fields.niche")}>
            {nicheOptions.map((option) => (
              <Chip
                key={option.id || "none"}
                pressed={option.id ? nicheId === option.id : nicheValue === NO_NICHE}
                disabled={disabled}
                className="disabled:opacity-50"
                onClick={() => onNicheChange(option.id)}
              >
                {option.name}
              </Chip>
            ))}
          </Chips>
        </Field>
      )}
    </>
  );
}
