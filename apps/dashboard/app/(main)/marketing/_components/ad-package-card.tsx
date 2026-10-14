"use client";

import { CalendarDays, Check, Flame, MessageCircle, ShoppingBag, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import type { AdPackage } from "@/lib/ad-packages";
import { RadioDot } from "./radio-dot";

type Props = {
  pkg: AdPackage;
  selected: boolean;
  onSelect: () => void;
};

export function AdPackageCard({ pkg, selected, onSelect }: Props) {
  const t = useTranslations("advertise.package");
  const perDay = Math.round(pkg.price / pkg.durationDays);

  const estimates = [
    { key: "reach", icon: Users, value: pkg.estimates.reach },
    { key: "messages", icon: MessageCircle, value: pkg.estimates.messages },
    { key: "purchases", icon: ShoppingBag, value: pkg.estimates.purchases },
  ] as const;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative flex flex-col gap-3.5 rounded-2xl border-[1.5px] bg-card p-4 text-start transition-[border-color,box-shadow,transform] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25",
        selected ? "border-primary ring-[3px] ring-primary/20" : "border-border hover:border-input"
      )}
    >
      {pkg.highlight && (
        <span className="absolute -top-2.5 start-4 inline-flex h-5.5 items-center gap-1 rounded-full bg-accent px-2.5 text-[11px] font-bold text-accent-foreground">
          <Flame className="size-3" aria-hidden />
          {t("popular")}
        </span>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex h-6.5 items-center gap-1.5 rounded-full bg-primary-soft px-2.5 text-xs font-semibold text-primary-ink">
          <CalendarDays className="size-3.5" aria-hidden />
          {t("days", { count: pkg.durationDays })}
        </span>
        <RadioDot checked={selected} />
      </div>

      <div>
        <h3 className="text-base font-bold leading-snug">{t(`${pkg.key}.name`)}</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t(`${pkg.key}.summary`)}</p>
      </div>

      <div className="flex items-baseline gap-1.5">
        <b className="text-3xl font-extrabold leading-none tabular-nums">{pkg.price.toLocaleString()}</b>
        <span className="text-sm text-muted-foreground">{t("currency")}</span>
        <small className="ms-auto whitespace-nowrap text-[11px] text-muted-foreground">
          {t("perDay", { amount: perDay.toLocaleString() })}
        </small>
      </div>

      <dl
        aria-label={t("estimates.title")}
        className="grid grid-cols-3 gap-1.5 rounded-xl bg-muted/50 p-2"
      >
        {estimates.map(({ key, icon: Icon, value }) => (
          <div key={key} className="min-w-0 text-center">
            <dt className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <Icon className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{t(`estimates.${key}`)}</span>
            </dt>
            <dd className="text-sm font-bold tabular-nums">~{value.toLocaleString()}</dd>
          </div>
        ))}
      </dl>

      <ul className="flex flex-col gap-2 border-t border-dashed pt-3.5">
        {pkg.features.map((feature) => (
          <li key={feature.key} className="flex gap-2 text-[13px] leading-relaxed">
            <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            {t(`featuresShort.${feature.key}`, { count: feature.count ?? 1 })}
          </li>
        ))}
      </ul>
    </button>
  );
}
