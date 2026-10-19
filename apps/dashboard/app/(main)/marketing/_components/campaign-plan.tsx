"use client";

import { Clapperboard, Megaphone, Share2, Sparkles, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { planColumns, type AdPackage, type AdPackageFeature } from "@/lib/ad-packages";

const FEATURE_ICONS: Record<AdPackageFeature, LucideIcon> = {
  video_social: Clapperboard,
  video_ai: Sparkles,
  platforms: Share2,
  meta: Megaphone,
};

/** Literal classes so Tailwind keeps them; plans have 4 (weeks) or 7 (days) columns. */
const GRID_COLS: Record<number, string> = { 4: "grid-cols-4", 7: "grid-cols-7" };

/** What happens to the product across the campaign, one row per deliverable. */
export function CampaignPlan({ pkg }: { pkg: AdPackage }) {
  const t = useTranslations("advertise.package");
  const count = planColumns(pkg);
  const columns = Array.from({ length: count }, (_, i) => i + 1);
  const gridCols = GRID_COLS[count] ?? "grid-cols-7";
  const monthly = pkg.period === "monthly";
  const columnLabel = (n: number) => (monthly ? t("week", { week: n }) : t("day", { day: n }));

  return (
    <div className="mt-4 rounded-2xl border bg-muted/30 p-4">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold">{t("plan.title", { name: t(`${pkg.key}.name`) })}</h4>
          <p className="text-xs text-muted-foreground">
            {t("plan.subtitle", { days: t("days", { count: pkg.durationDays }) })}
          </p>
        </div>
        <div className="flex gap-3.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <i className="h-1.5 w-3.5 rounded-full bg-primary" aria-hidden />
            {t("plan.ongoing")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="h-1.5 w-3.5 rounded-full bg-accent" aria-hidden />
            {t("plan.once")}
          </span>
        </div>
      </div>

      <div className="grid text-[13px] sm:grid-cols-[minmax(9rem,1.1fr)_minmax(0,2fr)]">
        <div className="hidden pb-2 text-[11px] text-muted-foreground sm:block">{t("plan.service")}</div>
        <div className={cn("hidden gap-1 pb-2 text-center text-[11px] text-muted-foreground sm:grid", gridCols)}>
          {columns.map((n) => (
            <span key={n}>{columnLabel(n)}</span>
          ))}
        </div>

        {pkg.features.map((feature) => {
          const Icon = FEATURE_ICONS[feature.key];
          const once = !!feature.at;
          return (
            <div key={feature.key} className="contents">
              <div className="flex items-center gap-2.5 border-t pt-3 pb-1 leading-snug sm:py-2.5 sm:pe-3">
                <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg border bg-card text-primary-ink">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                {t(`features.${feature.key}`, { count: feature.count ?? 1 })}
              </div>
              <div
                className={cn("grid items-center gap-1 pb-3 sm:border-t sm:py-2.5", gridCols)}
                aria-hidden
              >
                {columns.map((n) => (
                  <i
                    key={n}
                    className={cn(
                      "h-2 rounded-full",
                      !once ? "bg-primary" : feature.at!.includes(n) ? "bg-accent" : "bg-border"
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
