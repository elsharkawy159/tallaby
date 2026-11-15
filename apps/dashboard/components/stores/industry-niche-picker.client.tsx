"use client";

import { useLocale, useTranslations } from "next-intl";
import { Chip, Chips, Field } from "@/components/seller-ui";
import { STORE_INDUSTRIES, type StoreIndustry } from "@/lib/stores/industries.lib";
import type { NicheChoice } from "@/lib/stores/niche-choices.lib";

/**
 * The store's industry chips and, under them, the niche chips of the picked
 * industry (owner, 2026-11-15). Controlled: the parent keeps the values and
 * decides what an industry change does (Store settings › General and the
 * welcome page both start the niche again). `nicheId` "" is "none".
 * Moved from store-general.client.tsx, same markup and strings.
 */
export function IndustryNichePicker({
  industryId,
  nicheId,
  niches,
  disabled,
  onIndustryChange,
  onNicheChange,
}: {
  /** The picked industry's id, or null. */
  industryId: string | null;
  nicheId: string;
  /** The picked industry's niche chips, in the page's language (`nicheChoices`). */
  niches: NicheChoice[];
  disabled?: boolean;
  onIndustryChange: (industry: StoreIndustry) => void;
  onNicheChange: (nicheId: string) => void;
}) {
  const t = useTranslations("storeSettings");
  const uiLocale = useLocale();

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
              {uiLocale === "en" ? option.en : option.ar}
            </Chip>
          ))}
        </Chips>
      </Field>
      {niches.length > 0 && (
        <Field label={t("fields.niche")} note={t("fields.nicheHint")}>
          <Chips role="group" aria-label={t("fields.niche")}>
            {[...niches, { id: "", name: t("fields.nicheNone") }].map((option) => (
              <Chip
                key={option.id || "none"}
                pressed={option.id ? nicheId === option.id : !niches.some((choice) => choice.id === nicheId)}
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
