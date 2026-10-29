import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, Check, Globe, LayoutTemplate, Package, Rocket, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { getHomeSnapshot, type HomeSnapshot } from "./home.queries";
import { SETUP_DISMISS_COOKIE } from "./home.shared";
import { HomeCard, IconTile } from "./home-ui";
import { SetupDismissible } from "./setup-dismiss.client";
import { SetupPublishButton } from "./setup-publish.client";

import { buildSetupTasks, isSetupDone, publishLockReason, publishReady, type SetupKey } from "./setup-checklist.lib";

const ICONS: Record<SetupKey, LucideIcon> = {
  product: Package,
  template: LayoutTemplate,
  shipping: Truck,
  publish: Globe,
};

export function isSetupComplete(snapshot: HomeSnapshot) {
  return isSetupDone(snapshot.setup, snapshot.setupStoreId);
}

/** "Get your store ready" guide: numbered step cards. Hidden once complete or dismissed. */
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
  // The first open step in the recommended order is the one to do next.
  const nextKey = TASKS.find((task) => !task.done)?.key;
  const canPublish = publishReady(snapshot.setup);
  const lockReason = publishLockReason(snapshot.setup);
  const percent = Math.round((doneCount / TASKS.length) * 100);

  return (
    <SetupDismissible>
      <HomeCard aria-labelledby="setup-title" className="flex flex-col gap-[18px] p-5 sm:p-[22px]">
        <div className="flex items-start gap-3.5 pe-10">
          <IconTile icon={Rocket} tone="accent" className="size-11 rounded-xl" />
          <div className="min-w-0 flex-1">
            <h2 id="setup-title" className="text-lg font-bold leading-normal">
              {t("title")}
            </h2>
            <p className="mt-0.5 text-pretty text-[13px] text-muted-foreground">{t("description")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>{t("progressCount", { done: doneCount, total: TASKS.length })}</span>
            <b dir="ltr" className="font-montserrat text-primary-ink tabular-nums">
              {percent}%
            </b>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full border bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={TASKS.length}
            aria-valuenow={doneCount}
            aria-label={t("progress")}
          >
            <i
              className="block h-full rounded-full bg-primary transition-[width] duration-500 ease-[cubic-bezier(.2,.6,.2,1)]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <ol className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 xl:grid-cols-4">
          {TASKS.map((task, i) => {
            const done = task.done;
            const next = task.key === nextKey;
            return (
              <li
                key={task.key}
                className={cn(
                  "relative flex flex-col gap-2.5 rounded-[14px] border bg-card p-4",
                  next && "border-primary ring-[3px] ring-ring/25",
                  done && "bg-muted/60"
                )}
              >
                {next && (
                  <span className="absolute -top-2.5 start-3.5 inline-flex h-5 items-center whitespace-nowrap rounded-full bg-primary px-2 text-[11px] font-semibold text-primary-foreground">
                    {t("nextStep")}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <IconTile icon={task.icon} />
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] font-montserrat text-[11px] font-bold",
                      done ? "border-success bg-success text-white" : "text-muted-foreground"
                    )}
                  >
                    {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
                  </span>
                </div>
                <div>
                  <b className={cn("block text-sm font-semibold leading-normal", done && "text-muted-foreground")}>
                    {t(`tasks.${task.key}.title`)}
                    {done && <span className="sr-only"> — {t("done")}</span>}
                  </b>
                  <small className="block text-pretty text-xs leading-relaxed text-muted-foreground">
                    {!done && task.key === "publish" && lockReason
                      ? t(`publish.${lockReason}`)
                      : t(`tasks.${task.key}.description`)}
                  </small>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  {done ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                      <Check className="size-3.5" aria-hidden />
                      {t("stepDone")}
                    </span>
                  ) : task.key === "publish" && snapshot.setupStoreId ? (
                    <SetupPublishButton
                      storeId={snapshot.setupStoreId}
                      ready={canPublish}
                      lockedLabel={lockReason ? t(`publish.${lockReason}`) : undefined}
                      variant={next ? "secondary" : "neutral"}
                    />
                  ) : (
                    <Button asChild size="sm" variant={next ? "secondary" : "neutral"} className="rounded-[9px]">
                      <Link href={task.href}>
                        {t(`tasks.${task.key}.cta`)}
                        <ArrowLeft className="ltr:rotate-180" aria-hidden />
                      </Link>
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </HomeCard>
    </SetupDismissible>
  );
}
