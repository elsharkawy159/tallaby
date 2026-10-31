"use client";

import { useTranslations } from "next-intl";
import { FieldHint } from "@/components/form/form-ui";
import { BannerField } from "@/components/stores/brand-image-fields.client";
import { MAX_HERO_BANNERS, type HeroBanners } from "./hero-banners.lib";

/**
 * The home page hero's photos as a list (`hero-banners.lib.ts`). A carousel
 * hero adds and removes banners (one slide each, at least one); any other
 * hero only replaces its fixed photos.
 */
export function HeroBannerList({
  kind,
  value,
  onChange,
  disabled,
}: {
  kind: HeroBanners["kind"];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("websiteDesign.banners");
  const carousel = kind === "carousel";
  const set = (index: number, src: string) => {
    // Remove (empty src) drops a carousel slide; a fixed photo is only replaced.
    if (!src) onChange(value.filter((_, i) => i !== index));
    else onChange(value.map((old, i) => (i === index ? src : old)));
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold">{t("title")}</p>
        <FieldHint>{carousel ? t("carouselHint", { max: MAX_HERO_BANNERS }) : t("fixedHint")}</FieldHint>
      </div>
      {value.map((src, index) => (
        <BannerField
          // Index keys: the list is positional, like the slides it maps to.
          key={index}
          value={src}
          onChange={(next) => set(index, next)}
          disabled={disabled}
          label={value.length > 1 ? t("item", { number: index + 1 }) : t("single")}
          removable={carousel && value.length > 1}
        />
      ))}
      {carousel && value.length < MAX_HERO_BANNERS && (
        <BannerField value="" onChange={(src) => src && onChange([...value, src])} disabled={disabled} label={t("add")} />
      )}
    </div>
  );
}
