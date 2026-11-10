import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, Check, CreditCard, FileText, Package, Palette, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SellerButton } from "@/components/seller-ui";
import { cn } from "@workspace/ui/lib/utils";
import { getHomeSnapshot, type HomeSnapshot } from "./home.queries";
import { SETUP_DISMISS_COOKIE } from "./home.shared";
import { SetupDismissible } from "./setup-dismiss.client";
import { SetupStepsToggle } from "./setup-steps-toggle.client";

import { buildHomeSteps, isSetupDone, type HomeStepKey } from "./setup-checklist.lib";

export const HOME_STEP_ICONS: Record<HomeStepKey, LucideIcon> = {
  product: Package,
  design: Palette,
  payments: CreditCard,
  shipping: Truck,
};

/** Length of the progress ring's circle (r = 36). */
const RING = 226.2;

export function isSetupComplete(snapshot: HomeSnapshot) {
  return isSetupDone(snapshot.setup, snapshot.setupStoreId);
}

/**
 * "Get your store ready" guide (`.setup`) on the normal home (a seller with
 * orders but a step still open): a dark card with a progress ring and the four
 * step cards (setup-checklist.lib.ts). Hidden when every step is done or the
 * seller dismissed it. A seller with no real order and setup open gets the
 * setup-only home instead (setup-home.data.tsx), which can't be dismissed.
 * On a phone only the next step shows until the seller asks for the rest.
 */
export async function SetupChecklistData() {
  const [snapshot, cookieStore, t] = await Promise.all([
    getHomeSnapshot(),
    cookies(),
    getTranslations("home.setup"),
  ]);

  if (!snapshot || isSetupDone(snapshot.setup, snapshot.setupStoreId)) return null;
  if (cookieStore.get(SETUP_DISMISS_COOKIE)?.value === "1") return null;

  const TASKS = buildHomeSteps(snapshot.setup, snapshot.setupStoreId).map((task) => ({
    ...task,
    icon: HOME_STEP_ICONS[task.key],
  }));
  const required = TASKS;
  const doneCount = required.filter((task) => task.done).length;
  // The first open step in the recommended order is the one to do next.
  const nextKey = TASKS.find((task) => !task.done)?.key;

  return (
    <SetupDismissible>
      <section
        aria-labelledby="setup-title"
        className="sui-rise relative grid grid-cols-[260px_minmax(0,1fr)] items-center gap-7 overflow-hidden rounded-[28px] bg-(--s-setup) px-7 py-[26px] text-white [animation-delay:.05s] before:pointer-events-none before:absolute before:inset-x-[40%_-10%] before:-top-[60%] before:h-[160%] before:bg-[radial-gradient(50%_50%_at_50%_30%,rgb(253_173_40/0.2),transparent_70%)] max-[1280px]:grid-cols-1 max-[720px]:rounded-[24px] max-[720px]:px-[18px] max-[720px]:py-[22px]"
      >
        <SetupStepsToggle stepsId="setup-steps" total={TASKS.length} collapsible={Boolean(nextKey)}>
          <div className="relative flex flex-col gap-3 max-[1280px]:flex-row max-[1280px]:flex-wrap max-[1280px]:items-center max-[1280px]:gap-x-[18px] max-[480px]:flex-col max-[480px]:items-start">
            <div
              className="relative size-[84px] shrink-0"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={required.length}
              aria-valuenow={doneCount}
              aria-label={t("progress")}
            >
              <svg viewBox="0 0 84 84" className="size-full -rotate-90" aria-hidden>
                <circle cx="42" cy="42" r="36" fill="none" strokeWidth="8" className="stroke-white/12" />
                <circle
                  cx="42"
                  cy="42"
                  r="36"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="sui-ring-fill stroke-accent [--sui-ring-empty:226.2]"
                  strokeDasharray={RING}
                  strokeDashoffset={RING * (1 - doneCount / required.length)}
                />
              </svg>
              <b dir="ltr" className="absolute inset-0 grid place-items-center font-montserrat text-lg font-extrabold">
                {doneCount}/{required.length}
              </b>
            </div>
            <div className="min-w-[220px] max-[1280px]:flex-1">
              <h2 id="setup-title" className="text-xl font-bold leading-[1.45] text-white">
                {t("title")}
              </h2>
              <p className="text-pretty text-[13.5px] text-[#c6d8dc]">{t("description")}</p>
            </div>
            <p
              className={cn(
                "flex items-start gap-1.5 text-[12.5px] leading-[1.7] text-[#a9c3c9] max-[1280px]:basis-full",
                nextKey && "max-[600px]:hidden max-[600px]:group-data-open/setup:flex",
              )}
            >
              <FileText aria-hidden className="mt-[3px] size-[15px] shrink-0" />
              <span>
                {t("policies.note")}{" "}
                <Link href="/settings#policies" className="font-bold text-accent no-underline hover:underline">
                  {t("policies.link")}
                </Link>
              </span>
            </p>
          </div>

          <ol id="setup-steps" className="relative grid grid-cols-4 gap-2.5 max-[1180px]:grid-cols-2 max-[600px]:grid-cols-1">
            {TASKS.map((task, i) => {
              const done = task.done;
              const next = task.key === nextKey;
              return (
                <li
                  key={task.key}
                  className={cn(
                    "relative flex min-h-[178px] flex-col gap-2 rounded-[20px] border border-white/10 bg-white/6 p-4 max-[720px]:min-h-0",
                    done && "border-dashed bg-transparent",
                    nextKey && !next && "max-[600px]:hidden max-[600px]:group-data-open/setup:flex",
                    next &&
                      "-translate-y-1 border-(--s-surface) bg-(--s-surface) text-(--s-ink) shadow-[0_18px_40px_rgb(0_0_0/0.18)] max-[1180px]:translate-y-0",
                  )}
                >
                  {next && (
                    // On the card's edge: a four-column row is too narrow to share a line with the icon.
                    <span className="absolute -top-2.5 start-3.5 whitespace-nowrap rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-(--tallaby-teal-900)">
                      {t("nextStep")}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "grid size-[38px] place-items-center rounded-xl bg-white/10 text-white [&_svg]:size-[18px]",
                        done && "bg-[#16a34a]/20 text-[#86efac]",
                        next && "bg-accent-soft text-accent-ink",
                      )}
                    >
                      <task.icon aria-hidden />
                    </span>
                    {next ? null : (
                      <span
                        className={cn(
                          "grid size-6 place-items-center rounded-full border-[1.5px] border-white/25 font-montserrat text-[11px] font-bold text-[#c6d8dc]",
                          done && "border-[#16a34a] bg-[#16a34a] text-white",
                        )}
                      >
                        {done ? <Check className="size-[13px] stroke-3" aria-hidden /> : i + 1}
                      </span>
                    )}
                  </div>
                  <b className={cn("text-sm font-bold leading-normal", done && "text-[#d9e7ea]")}>
                    {t(`tasks.${task.key}.title`)}
                    {done && <span className="sr-only"> — {t("done")}</span>}
                  </b>
                  <small className={cn("text-pretty text-xs leading-[1.6] text-[#a9c3c9]", next && "text-(--s-muted)")}>
                    {t(`tasks.${task.key}.description`)}
                  </small>
                  <div className="mt-auto pt-1">
                    {done ? (
                      <span className="inline-flex items-center gap-[5px] text-xs font-bold text-[#86efac]">
                        <Check className="size-3.5" aria-hidden />
                        {t("stepDone")}
                      </span>
                    ) : next ? (
                      <SellerButton asChild size="sm">
                        <Link href={task.href}>
                          {t(`tasks.${task.key}.cta`)}
                          <ArrowLeft className="ltr:rotate-180" aria-hidden />
                        </Link>
                      </SellerButton>
                    ) : (
                      <Link
                        href={task.href}
                        className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-white/20 px-3 text-[12.5px] font-bold text-white no-underline transition-colors duration-150 hover:bg-white/8 hover:text-white max-[600px]:h-10"
                      >
                        {t(`tasks.${task.key}.cta`)}
                        <ArrowLeft className="size-[15px] ltr:rotate-180" aria-hidden />
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </SetupStepsToggle>
      </section>
    </SetupDismissible>
  );
}
