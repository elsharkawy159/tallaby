import Link from "next/link";
import { Gift } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getFeeTrialStatus } from "@workspace/lib/sellers";
import { Button } from "@workspace/ui/components/button";
import { formatDate } from "@/lib/i18n/format";
import { getHomeSnapshot } from "./home.queries";
import { HomeCard, IconTile } from "./home-ui";

/**
 * Platform fee trial (PLAN.md §13.5, P6-07): days left while it runs, or how
 * it starts for new sellers. Nothing for old sellers or after it ended.
 */
export async function TrialBannerData() {
  const [snapshot, t, locale] = await Promise.all([
    getHomeSnapshot(),
    getTranslations("home.trial"),
    getLocale(),
  ]);
  if (!snapshot) return null;

  const status = getFeeTrialStatus(snapshot.feeTrial);
  if (status.state !== "active" && status.state !== "not_started") return null;

  const active = status.state === "active";
  const endingSoon = active && status.daysLeft <= 7;

  return (
    <HomeCard
      aria-labelledby="trial-title"
      className="flex flex-wrap items-center gap-3.5 px-5 py-4"
    >
      <IconTile icon={Gift} tone={endingSoon ? "accent" : "success"} />
      <div className="min-w-0 flex-1">
        <h2 id="trial-title" className="text-[15px] font-bold leading-normal">
          {active ? t("activeTitle", { days: status.daysLeft }) : t("notStartedTitle")}
        </h2>
        <p className="text-pretty text-[13px] text-muted-foreground">
          {active ? t("active", { date: formatDate(status.endsAt, locale) }) : t("notStarted")}
        </p>
      </div>
      <Button asChild variant="secondary" size="sm" className="rounded-xl">
        <Link href="/settings/plan">{t("planLink")}</Link>
      </Button>
    </HomeCard>
  );
}
