"use client";

import { Check, Clapperboard, Megaphone, Share2, Star, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import type { AdPackage, AdPackageFeature } from "@/lib/ad-packages";

const FEATURE_ICONS: Record<AdPackageFeature, LucideIcon> = {
  video: Clapperboard,
  platforms: Share2,
  featured: Star,
  meta: Megaphone,
};

/**
 * Which days of the campaign each deliverable covers. The video launches the
 * campaign on day one; everything else runs for the whole week.
 */
const FEATURE_SPAN: Record<AdPackageFeature, [start: number, end: number]> = {
  video: [1, 1],
  platforms: [1, 7],
  featured: [1, 7],
  meta: [1, 7],
};

type Props = {
  pkg: AdPackage;
  selected: boolean;
  onSelect: () => void;
};

export function AdPackageCard({ pkg, selected, onSelect }: Props) {
  const t = useTranslations("advertise.package");
  const days = Array.from({ length: pkg.durationDays }, (_, i) => i + 1);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-card transition-colors",
        selected ? "border-primary ring-1 ring-primary" : "border-border"
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-4 bg-primary px-5 py-5 text-primary-foreground sm:px-6">
        <div className="space-y-1">
          <h3 className="text-xl font-bold leading-tight sm:text-2xl">{t(`${pkg.key}.name`)}</h3>
          <p className="text-sm opacity-80">{t(`${pkg.key}.summary`)}</p>
        </div>
        <div className="text-end">
          <p className="text-xs opacity-80">{t("total")}</p>
          <p className="text-4xl font-bold leading-none tabular-nums">
            {pkg.price.toLocaleString()}
            <span className="ms-1.5 text-base font-medium">{t("currency")}</span>
          </p>
        </div>
      </div>

      {/* Week grid: one column per campaign day, one row per deliverable. */}
      <div className="px-5 py-5 sm:px-6" aria-label={t("timelineLabel")}>
        <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_18rem] items-end gap-4 md:grid">
          <span className="text-xs text-muted-foreground">{t("timelineLabel")}</span>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
            {days.map((d) => (
              <span key={d}>{t("day", { day: d })}</span>
            ))}
          </div>
        </div>

        <ul className="divide-y">
          {pkg.features.map((feature) => {
            const Icon = FEATURE_ICONS[feature];
            const [start, end] = FEATURE_SPAN[feature];
            return (
              <li
                key={feature}
                className="grid gap-3 py-3.5 md:grid-cols-[minmax(0,1fr)_18rem] md:items-center md:gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <p className="text-sm leading-relaxed text-foreground">{t(`features.${feature}`)}</p>
                </div>
                <div className="grid grid-cols-7 gap-1 ps-11 md:ps-0" aria-hidden>
                  {days.map((d) => (
                    <span
                      key={d}
                      className={cn(
                        "h-2 rounded-full",
                        d >= start && d <= end ? "bg-primary" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-5 py-3 sm:px-6">
        <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border">
          {t("days", { count: pkg.durationDays })}
        </span>
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            selected
              ? "bg-primary/10 text-primary"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {selected && <Check className="size-4" aria-hidden />}
          {selected ? t("selected") : t("select")}
        </button>
      </div>
    </div>
  );
}
