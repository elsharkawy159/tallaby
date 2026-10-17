import Link from "next/link";
import { cookies } from "next/headers";
import { Check, Headphones, Landmark, Megaphone, Package, Rocket, ScrollText, Store, TicketPercent, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { getHomeSnapshot, type HomeSnapshot } from "./home.queries";
import { SETUP_DISMISS_COOKIE } from "./home.shared";
import { HomeCard, IconTile } from "./home-ui";
import { SetupDismissible } from "./setup-dismiss.client";

import { buildSetupTasks, isSetupDone, type SetupKey } from "./setup-checklist.lib";

const ICONS: Record<SetupKey, LucideIcon> = {
  profile: Store,
  product: Package,
  contact: Headphones,
  policies: ScrollText,
  legal: Landmark,
  payout: Wallet,
  coupon: TicketPercent,
  campaign: Megaphone,
};

export function isSetupComplete(snapshot: HomeSnapshot) {
  return isSetupDone(snapshot.setup, snapshot.setupStoreId);
}

/** "Get your store ready" checklist. Hidden once complete or dismissed. */
export async function SetupChecklistData() {
  const [snapshot, cookieStore, t] = await Promise.all([
    getHomeSnapshot(),
    cookies(),
    getTranslations("home.setup"),
  ]);

  if (!snapshot || isSetupComplete(snapshot)) return null;
  if (cookieStore.get(SETUP_DISMISS_COOKIE)?.value === "1") return null;

  const TASKS = buildSetupTasks(snapshot.setup, snapshot.setupStoreId).map((task) => ({
    ...task,
    icon: ICONS[task.key],
  }));
  const doneCount = TASKS.filter((task) => task.done).length;
  const nextIndex = TASKS.findIndex((task) => !task.done);

  return (
    <SetupDismissible>
      <HomeCard
        aria-labelledby="setup-title"
        className="grid overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)]"
      >
        <div className="flex flex-col gap-2.5 bg-primary p-[22px] text-white dark:bg-[#103e4b]">
          <IconTile icon={Rocket} className="bg-white/15 text-white" />
          <h2 id="setup-title" className="text-[17px] font-bold leading-normal">
            {t("title")}
          </h2>
          <p className="text-pretty text-[13px] opacity-80">{t("description")}</p>
          <div className="mt-2 flex flex-col gap-2 xl:mt-auto">
            <div className="flex justify-between text-xs opacity-85">
              <span>{t("progress")}</span>
              <span dir="ltr" className="font-montserrat tabular-nums">
                {doneCount} / {TASKS.length}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-white/20"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={TASKS.length}
              aria-valuenow={doneCount}
              aria-label={t("progress")}
            >
              <i
                className="block h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${(doneCount / TASKS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <ol className="flex flex-col px-5 py-2">
          {TASKS.map((task, i) => {
            const done = task.done;
            return (
              <li key={task.key} className="flex items-center gap-3.5 border-b py-3 last:border-b-0">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px]",
                    done ? "border-success bg-success text-white" : "border-border text-transparent"
                  )}
                >
                  <Check className="size-3.5" aria-hidden />
                </span>
                <IconTile icon={task.icon} />
                <div className="min-w-0 flex-1">
                  <b
                    className={cn(
                      "block text-sm leading-normal",
                      done ? "font-medium text-muted-foreground line-through" : "font-semibold"
                    )}
                  >
                    {t(`tasks.${task.key}.title`)}
                    {done && <span className="sr-only"> — {t("done")}</span>}
                  </b>
                  <small className="text-xs text-muted-foreground">
                    {t(`tasks.${task.key}.description`)}
                  </small>
                </div>
                {!done && (
                  <Button
                    asChild
                    size="sm"
                    variant={i === nextIndex ? "secondary" : "neutral"}
                    className="rounded-[9px]"
                  >
                    <Link href={task.href}>{t(`tasks.${task.key}.cta`)}</Link>
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      </HomeCard>
    </SetupDismissible>
  );
}
