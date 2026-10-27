import Link from "next/link";
import { cookies } from "next/headers";
import { Check, Globe, LayoutTemplate, Package, Rocket, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { getHomeSnapshot, type HomeSnapshot } from "./home.queries";
import { SETUP_DISMISS_COOKIE } from "./home.shared";
import { HomeCard, IconTile } from "./home-ui";
import { SetupAccordion } from "./setup-accordion.client";
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
  // Open steps first (in their recommended order), so the visible half is what is left to do.
  const ordered = [...TASKS.filter((task) => !task.done), ...TASKS.filter((task) => task.done)];
  const nextKey = ordered[0]?.key;
  const canPublish = publishReady(snapshot.setup);
  const lockReason = publishLockReason(snapshot.setup);

  return (
    <SetupDismissible>
      <HomeCard aria-labelledby="setup-title" className="overflow-hidden">
        <div className="flex flex-col gap-4 px-5 pb-4 pt-5">
          <div className="flex items-start gap-3.5 pe-10">
            <IconTile icon={Rocket} tone="accent" className="size-11 rounded-xl" />
            <div className="min-w-0 flex-1">
              <h2 id="setup-title" className="text-[17px] font-bold leading-snug">
                {t("title")}
              </h2>
              <p className="mt-0.5 text-pretty text-[13px] text-muted-foreground">{t("description")}</p>
            </div>
            <p className="hidden shrink-0 text-end sm:block">
              <span dir="ltr" className="block font-montserrat text-2xl font-bold leading-none tabular-nums">
                {doneCount}
                <span className="text-base font-semibold text-faint">/{TASKS.length}</span>
              </span>
              <span className="mt-1 block text-[11px] text-muted-foreground">{t("progress")}</span>
            </p>
          </div>

          {/* One segment per step; the next one breathes softly. */}
          <div
            className="flex h-2 gap-1"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={TASKS.length}
            aria-valuenow={doneCount}
            aria-label={t("progress")}
          >
            {TASKS.map((task, i) => (
              <span
                key={task.key}
                className={cn(
                  "flex-1 rounded-full transition-colors duration-500",
                  i < doneCount
                    ? "bg-accent"
                    : i === doneCount
                      ? "bg-primary/35 motion-safe:animate-pulse"
                      : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="-mt-2 text-xs text-muted-foreground sm:hidden">
            {t("remaining", { count: TASKS.length - doneCount })}
          </p>
        </div>

        <SetupAccordion showAllLabel={t("showAll", { count: TASKS.length })} showLessLabel={t("showLess")}>
          <ol className="grid grid-cols-1 gap-2 px-5 pb-3 lg:grid-cols-2">
            {ordered.map((task) => {
              const done = task.done;
              const next = task.key === nextKey;
              return (
                <li
                  key={task.key}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3.5 py-3",
                    next && "border-primary/25 bg-primary-soft",
                    done && "border-transparent bg-muted/60"
                  )}
                >
                  {done ? (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-success-soft text-success">
                      <Check className="size-[17px]" aria-hidden />
                    </span>
                  ) : (
                    <IconTile icon={task.icon} className={cn(next && "bg-primary text-white")} />
                  )}
                  <div className="min-w-0 flex-1">
                    {next && (
                      <span className="mb-0.5 block text-[11px] font-semibold text-primary-ink">
                        {t("nextStep")}
                      </span>
                    )}
                    <b
                      className={cn(
                        "block truncate text-sm leading-normal",
                        done ? "font-medium text-muted-foreground line-through" : "font-semibold"
                      )}
                    >
                      {t(`tasks.${task.key}.title`)}
                      {done && <span className="sr-only"> — {t("done")}</span>}
                    </b>
                    {!done && (
                      <small className="line-clamp-2 text-xs text-muted-foreground">
                        {task.key === "publish" && lockReason
                          ? t(`publish.${lockReason}`)
                          : t(`tasks.${task.key}.description`)}
                      </small>
                    )}
                  </div>
                  {!done && task.key === "publish" && snapshot.setupStoreId ? (
                    <SetupPublishButton
                      storeId={snapshot.setupStoreId}
                      ready={canPublish}
                      lockedLabel={lockReason ? t(`publish.${lockReason}`) : undefined}
                      variant={next ? "secondary" : "neutral"}
                    />
                  ) : !done && (
                    <Button asChild size="sm" variant={next ? "secondary" : "neutral"} className="rounded-[9px]">
                      <Link href={task.href}>{t(`tasks.${task.key}.cta`)}</Link>
                    </Button>
                  )}
                </li>
              );
            })}
          </ol>
        </SetupAccordion>
      </HomeCard>
    </SetupDismissible>
  );
}
