import Link from "next/link";
import { Globe, Link2, Share2 } from "lucide-react";
import { siFacebook, siGoogle, siInstagram, siTiktok, siWhatsapp, siYoutube } from "simple-icons";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@workspace/ui/components/button";
import { formatNumber } from "@/lib/i18n/format";
import type { TrafficPlatform } from "@/lib/analytics/home-traffic.lib";
import { getHomeChannelStores, getHomeTrafficFor } from "./home.queries";
import type { HomeChannel, HomeRange } from "./home.shared";
import { BrandIcon, EmptyState, HeaderLink, HomeCard, HomeCardHeader } from "./home-ui";

const PLATFORM_ICONS: Partial<Record<TrafficPlatform, string>> = {
  instagram: siInstagram.path,
  facebook: siFacebook.path,
  tiktok: siTiktok.path,
  google: siGoogle.path,
  whatsapp: siWhatsapp.path,
  youtube: siYoutube.path,
};

/** Where the store website's visits came from in the period (GA4 session source). */
export async function TrafficSourcesData({ range, channel = "all" }: { range: HomeRange; channel?: HomeChannel }) {
  const [traffic, { storeIds, analyticsStoreId }, t, locale] = await Promise.all([
    getHomeTrafficFor(range, channel),
    getHomeChannelStores(channel),
    getTranslations("home.sources"),
    getLocale(),
  ]);
  const sources = traffic?.sources ?? [];
  const total = sources.reduce((sum, s) => sum + s.sessions, 0) || 1;
  const max = sources[0]?.sessions || 1;

  return (
    <HomeCard aria-labelledby="sources-title">
      <HomeCardHeader
        id="sources-title"
        title={t("title")}
        description={t("description")}
        action={
          analyticsStoreId && storeIds.length > 0 ? (
            <HeaderLink href={`/stores/${analyticsStoreId}/analytics`}>{t("viewAll")}</HeaderLink>
          ) : undefined
        }
      />
      {sources.length === 0 ? (
        <EmptyState
          icon={Share2}
          title={t("emptyTitle")}
          description={storeIds.length === 0 ? t("storesOnly") : t("emptyDescription")}
          action={
            analyticsStoreId ? (
              <Button asChild variant="neutral" size="sm" className="rounded-[9px]">
                <Link href={`/stores/${analyticsStoreId}/website/social`}>
                  <Link2 aria-hidden />
                  {t("shareCta")}
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-3.5 px-5 pb-[18px] pt-3">
          {sources.map((source) => {
            const icon = source.platform ? PLATFORM_ICONS[source.platform] : undefined;
            return (
              <li key={source.label} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] border bg-muted text-primary-ink">
                  {icon ? <BrandIcon path={icon} /> : source.platform === "direct" ? <Link2 className="size-[15px]" aria-hidden /> : <Globe className="size-[15px]" aria-hidden />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
                  <b className="truncate text-[13px] font-semibold" dir={source.platform ? undefined : "ltr"}>
                    {source.platform ? t(`platforms.${source.platform}`) : source.label}
                  </b>
                  <span className="h-[5px] overflow-hidden rounded-full bg-muted">
                    <i className="block h-full rounded-full bg-primary" style={{ width: `${(source.sessions / max) * 100}%` }} />
                  </span>
                </span>
                <span className="whitespace-nowrap text-end text-xs text-muted-foreground">
                  <b className="block font-montserrat text-sm text-foreground tabular-nums">
                    {formatNumber(source.sessions / total, locale, { style: "percent", maximumFractionDigits: 0 })}
                  </b>
                  {t("visits", { count: source.sessions })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </HomeCard>
  );
}
