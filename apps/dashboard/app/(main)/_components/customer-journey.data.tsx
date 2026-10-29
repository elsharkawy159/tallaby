import Link from "next/link";
import { Info, Lightbulb } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { formatNumber } from "@/lib/i18n/format";
import { getHomeChannelStores, getHomeTrafficFor, getStoreFunnel } from "./home.queries";
import type { HomeChannel, HomeRange } from "./home.shared";
import { HeaderLink, HomeCard, HomeCardHeader } from "./home-ui";

/** Show the drop-off tip only when enough shoppers left their cart. */
const DROPOFF_TIP_MIN = 0.3;

/** Store-website visits → carts → orders for the period (customer journey). */
export async function CustomerJourneyData({ range, channel = "all" }: { range: HomeRange; channel?: HomeChannel }) {
  const [traffic, funnel, { storeIds, analyticsStoreId }, t, locale] = await Promise.all([
    getHomeTrafficFor(range, channel),
    getStoreFunnel(range, channel),
    getHomeChannelStores(channel),
    getTranslations("home.journey"),
    getLocale(),
  ]);

  const visits = traffic?.visits ?? 0;
  // A cart count can trail orders (an order's cart may predate the range); keep the steps monotonic.
  const carts = Math.max(funnel.carts, funnel.orders);
  const top = Math.max(visits, carts, 1);
  const steps = [
    { key: "visits", value: visits, bar: "bg-primary" },
    { key: "carts", value: carts, bar: "bg-primary/75" },
    { key: "orders", value: funnel.orders, bar: "bg-accent" },
  ] as const;
  const hasData = visits > 0 || carts > 0;
  const dropoff = carts > 0 ? 1 - funnel.orders / carts : 0;
  const percent = (v: number, digits = 1) =>
    formatNumber(v, locale, { style: "percent", maximumFractionDigits: digits });

  const note =
    storeIds.length === 0
      ? { icon: Info, text: t("storesOnly") }
      : !hasData
        ? { icon: Info, text: t("empty") }
        : dropoff >= DROPOFF_TIP_MIN
          ? {
              icon: Lightbulb,
              text: (
                <>
                  {t("dropoff", { percent: percent(dropoff, 0) })}{" "}
                  <Link href="/coupons" className="font-medium text-primary-ink hover:underline">
                    {t("dropoffCta")}
                  </Link>
                </>
              ),
            }
          : null;

  return (
    <HomeCard aria-labelledby="journey-title" className="flex flex-col">
      <HomeCardHeader
        id="journey-title"
        title={t("title")}
        description={t("description")}
        action={
          analyticsStoreId && storeIds.length > 0 ? (
            <HeaderLink href={`/stores/${analyticsStoreId}/analytics`}>{t("viewAnalytics")}</HeaderLink>
          ) : undefined
        }
      />
      <ol className="flex flex-col gap-3.5 px-5 pb-5 pt-4">
        {steps.map((step, i) => (
          <li key={step.key} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-[13px]">
              <span>{t(step.key)}</span>
              <span>
                <b className="font-montserrat text-sm font-semibold tabular-nums">{formatNumber(step.value, locale)}</b>
                {i > 0 && hasData && (
                  <em className="ms-1.5 font-montserrat text-xs not-italic text-muted-foreground tabular-nums">
                    {percent(step.value / top)}
                  </em>
                )}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <i
                className={cn("block h-full rounded-full transition-[width] duration-500", step.bar)}
                style={{ width: hasData ? `${Math.max(2, (step.value / top) * 100)}%` : "0%" }}
              />
            </div>
          </li>
        ))}
      </ol>
      {note && (
        <div className="mx-5 mb-[18px] mt-auto flex items-start gap-2 rounded-[10px] bg-muted/70 px-3 py-2.5 text-xs text-muted-foreground">
          <note.icon className="mt-0.5 size-[15px] shrink-0 text-primary-ink" aria-hidden />
          <span>{note.text}</span>
        </div>
      )}
    </HomeCard>
  );
}
