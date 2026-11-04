import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getSelectedStoreLink } from "@/lib/stores/store-link.server";
import { Button } from "@workspace/ui/components/button";
import { getHomeSnapshot, getPendingOrdersCount } from "./home.queries";
import type { HomeChannel } from "./home.shared";
import { isSetupComplete } from "./setup-checklist.data";

/**
 * "Good morning, {name}" in the seller's (Cairo) time of day. On phones the
 * store's address follows it in small type (the header shows it from md up).
 */
export async function HomeGreeting() {
  const [snapshot, t, tHeader, storeLink] = await Promise.all([
    getHomeSnapshot(),
    getTranslations("home.header"),
    getTranslations("header"),
    getSelectedStoreLink().catch(() => null),
  ]);
  const hour = snapshot?.localHour ?? 12;
  return (
    <>
      {t(hour < 12 ? "morning" : "evening", { name: snapshot?.displayName ?? "" })}
      {storeLink && (
        <a
          href={storeLink.url}
          target="_blank"
          rel="noopener noreferrer"
          title={tHeader("openStore")}
          className="ms-2 inline-flex max-w-full items-center gap-1 align-middle text-xs font-normal text-muted-foreground hover:text-primary md:hidden"
        >
          <bdi dir="ltr" className="truncate">{storeLink.host}</bdi>
          <ExternalLink className="size-3 shrink-0" aria-hidden />
        </a>
      )}
    </>
  );
}

/** One line on what needs doing first. */
export async function HomeSubtitle({ channel }: { channel: HomeChannel }) {
  const [snapshot, pending, t] = await Promise.all([
    getHomeSnapshot(),
    getPendingOrdersCount(channel),
    getTranslations("home.header"),
  ]);
  if (pending > 0) return <>{t("pendingOrders", { count: pending })}</>;
  if (snapshot && !snapshot.hasOrders && !isSetupComplete(snapshot)) return <>{t("almostReady")}</>;
  return <>{t("summary")}</>;
}

/** Page header frame. Title and subtitle stream in; the actions render immediately. */
export function HomeHeaderView({
  title,
  subtitle,
  addLabel,
  rangeControl,
}: {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  addLabel: string;
  rangeControl: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold leading-snug sm:text-2xl">{title}</h1>
        <div className="mt-1 text-pretty text-muted-foreground">{subtitle}</div>
      </div>
      <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
        {rangeControl}
        <Button asChild variant="secondary" className="h-[42px] w-full rounded-xl px-[18px] sm:w-auto">
          <Link href="/products/add">
            <Plus aria-hidden />
            {addLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}
