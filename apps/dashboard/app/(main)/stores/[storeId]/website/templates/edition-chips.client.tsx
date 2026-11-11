"use client";

import { useTranslations } from "next-intl";
import { Chip } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import type { NicheOptionView } from "./templates.dto";

/**
 * A template's niche editions as small chips (niche editions, ROADMAP F-90):
 * the look's own content first, then each trade it is also made for. Picking
 * one switches the preview and what "Use template" installs. Renders nothing
 * for a template with no editions. One row that scrolls sideways, so a card
 * keeps its height on a phone.
 */
export function EditionChips({
  editions,
  value,
  onChange,
  locale,
  templateName,
  className,
}: {
  editions: readonly NicheOptionView[];
  /** The chosen niche id, or null for the template's own content. */
  value: string | null;
  onChange: (editionId: string | null) => void;
  locale: "ar" | "en";
  templateName: string;
  className?: string;
}) {
  const t = useTranslations("websiteTemplates.editions");
  if (editions.length === 0) return null;
  const chip = "h-7 shrink-0 px-2.5 text-[12px] max-[600px]:h-9 max-[600px]:px-3";
  return (
    <div
      role="group"
      aria-label={t("label", { name: templateName })}
      className={cn("-mx-0.5 flex gap-1 overflow-x-auto px-0.5 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
    >
      <Chip className={chip} pressed={value === null} onClick={() => onChange(null)}>
        {t("original")}
      </Chip>
      {editions.map((edition) => (
        <Chip key={edition.id} className={chip} pressed={value === edition.id} onClick={() => onChange(edition.id)}>
          {edition.name[locale] || edition.name.ar}
        </Chip>
      ))}
    </div>
  );
}
