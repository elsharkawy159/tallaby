import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@workspace/ui/components/button";
import { getHomeSnapshot } from "./home.queries";
import { isSetupComplete } from "./setup-checklist.data";

/** "Good morning, {name}" in the seller's (Cairo) time of day. */
export async function HomeGreeting() {
  const [snapshot, t] = await Promise.all([getHomeSnapshot(), getTranslations("home.header")]);
  const hour = snapshot?.localHour ?? 12;
  return <>{t(hour < 12 ? "morning" : "evening", { name: snapshot?.displayName ?? "" })}</>;
}

/** One line on what needs doing first. */
export async function HomeSubtitle() {
  const [snapshot, t] = await Promise.all([getHomeSnapshot(), getTranslations("home.header")]);
  const pending = snapshot?.attention.pendingOrders ?? 0;
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
      <div className="flex flex-wrap items-center gap-2.5">
        {rangeControl}
        <Button asChild variant="secondary" className="h-[42px] rounded-xl px-[18px]">
          <Link href="/products/add">
            <Plus aria-hidden />
            {addLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}
