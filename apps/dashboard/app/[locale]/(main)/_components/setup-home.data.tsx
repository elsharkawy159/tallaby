import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SellerButton, SellerCard } from "@/components/seller-ui";
import { cn } from "@workspace/ui/lib/utils";
import type { HomeSnapshot } from "./home.queries";
import { HOME_STEP_ICONS, HOME_STEP_IMAGES } from "./setup-checklist.data";
import { buildHomeSteps, nextHomeStep } from "./setup-checklist.lib";
import { SetupMarkDoneButton } from "./setup-mark-done.client";
import { storeWelcomeHref } from "../stores/[storeId]/welcome/welcome.lib";

/** Length of the progress ring's circle (r = 26). */
const RING = 163.4;

/**
 * The setup-only home (ROADMAP.md F-86): a new seller with setup open and no
 * real order sees just these six steps, no metrics. Not dismissible, so the
 * seller can't land on an empty metrics page. No step is locked; domain and
 * SEO are optional and don't count in the ring (owner, 2026-11-27).
 */
export async function SetupHomeData({ snapshot }: { snapshot: HomeSnapshot }) {
  const t = await getTranslations("home.setupHome");
  const tSetup = await getTranslations("home.setup");
  const steps = buildHomeSteps(snapshot.setup, snapshot.setupStoreId);
  const required = steps.filter((step) => !step.optional);
  const doneCount = required.filter((step) => step.done).length;
  const nextKey = nextHomeStep(steps)?.key;

  return (
    <section aria-labelledby="setup-home-title" className="sui-rise flex flex-col gap-4 [animation-delay:.05s]">
      <div className="relative flex items-center gap-4 overflow-hidden rounded-[24px] bg-(--s-setup) px-6 py-5 text-white before:pointer-events-none before:absolute before:inset-x-[40%_-10%] before:-top-[60%] before:h-[160%] before:bg-[radial-gradient(50%_50%_at_50%_30%,rgb(253_173_40/0.2),transparent_70%)] max-[600px]:px-4 max-[600px]:py-4">
        <div
          className="relative size-[60px] shrink-0"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={required.length}
          aria-valuenow={doneCount}
          aria-label={tSetup("progress")}
        >
          <svg viewBox="0 0 60 60" className="size-full -rotate-90" aria-hidden>
            <circle cx="30" cy="30" r="26" fill="none" strokeWidth="6" className="stroke-white/12" />
            <circle
              cx="30"
              cy="30"
              r="26"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className="stroke-accent"
              strokeDasharray={RING}
              strokeDashoffset={RING * (1 - doneCount / Math.max(required.length, 1))}
            />
          </svg>
          <b dir="ltr" className="absolute inset-0 grid place-items-center font-montserrat text-sm font-extrabold">
            {doneCount}/{required.length}
          </b>
        </div>
        <div className="relative min-w-0">
          <h2 id="setup-home-title" className="text-lg font-bold leading-[1.45] text-white">
            {t("title")}
          </h2>
          <p className="text-pretty text-[13.5px] text-[#c6d8dc]">{t("description")}</p>
          {snapshot.setupStoreId && (
            <Link
              href={storeWelcomeHref(snapshot.setupStoreId)}
              className="mt-1 inline-flex min-h-10 items-center gap-1 text-[13.5px] font-bold text-accent underline-offset-4 hover:underline"
            >
              {t("openGuide")}
              <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden />
            </Link>
          )}
        </div>
      </div>

      <ol className="grid grid-cols-3 gap-3 max-[1180px]:grid-cols-2 max-[600px]:grid-cols-1">
        {steps.map((step, i) => {
          const Icon = HOME_STEP_ICONS[step.key];
          const image = HOME_STEP_IMAGES[step.key];
          const next = step.key === nextKey;
          const card = (
              <SellerCard
                className={cn(
                  "relative flex w-full flex-col gap-2.5 p-5 max-[600px]:p-4",
                  "transition-[border-color,box-shadow] duration-150 group-hover:border-(--s-outline) group-hover:shadow-(--s-shadow-hover)",
                  next && "border-accent shadow-(--s-shadow-hover)",
                  step.done && "border-dashed shadow-none",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  {image ? (
                    <Image src={image} alt="" aria-hidden width={88} height={88} loading="eager" className="size-[88px] select-none" />
                  ) : (
                    <span
                      className={cn(
                        "grid size-11 place-items-center rounded-[14px] bg-(--s-fill) text-(--s-ink) [&_svg]:size-5",
                        next && "bg-accent-soft text-accent-ink",
                        step.done && "bg-success-soft text-success",
                      )}
                    >
                      <Icon aria-hidden />
                    </span>
                  )}
                  {next ? (
                    <span className="whitespace-nowrap rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-accent-foreground">
                      {tSetup("nextStep")}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "grid size-6 place-items-center rounded-full border-[1.5px] border-(--s-line) font-montserrat text-[11px] font-bold text-(--s-subtle)",
                        step.done && "border-success bg-success text-white",
                      )}
                    >
                      {step.done ? <Check className="size-[13px] stroke-3" aria-hidden /> : i + 1}
                    </span>
                  )}
                </div>
                <h3 className="text-[15px] font-bold leading-normal text-(--s-ink)">
                  {tSetup(`tasks.${step.key}.title`)}
                  {step.optional && (
                    <span className="ms-1.5 inline-block rounded-full bg-(--s-fill) px-2 py-px align-middle text-[11px] font-bold text-(--s-muted)">
                      {tSetup("optional")}
                    </span>
                  )}
                  {step.done && <span className="sr-only"> — {tSetup("done")}</span>}
                </h3>
                <p className="text-pretty text-[13px] leading-[1.6] text-(--s-muted)">{tSetup(`tasks.${step.key}.description`)}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1.5">
                  {step.done ? (
                    <>
                      <span className="inline-flex items-center gap-[5px] text-[13px] font-bold text-success">
                        <Check className="size-4" aria-hidden />
                        {tSetup("stepDone")}
                      </span>
                      {!step.markedByHand && (
                        <span className="text-[12.5px] font-bold text-(--s-subtle) group-hover:text-(--s-ink) group-hover:underline">{t("edit")}</span>
                      )}
                    </>
                  ) : (
                    <SellerButton asChild size="sm" variant={next ? "amber" : "outline"} className={cn(!step.canMark && "max-[600px]:w-full")}>
                      <span>
                        {tSetup(`tasks.${step.key}.cta`)}
                        <ArrowLeft className="ltr:rotate-180" aria-hidden />
                      </span>
                    </SellerButton>
                  )}
                  {(step.canMark || step.markedByHand) && (
                    // Above the card's link (z-index), so it is its own button, not part of the link.
                    <SetupMarkDoneButton step={step.key} storeId={snapshot.setupStoreId} undo={step.markedByHand} className="relative z-[2]" />
                  )}
                </div>
              </SellerCard>
          );
          // The whole card opens the step (owner, 2026-11-26) through a link stretched over it, since the
          // "Mark as done" button can't sit inside an <a>; no step is locked (owner, 2026-11-27).
          return (
            <li key={step.key} className="group relative flex">
              <Link
                href={step.href}
                aria-label={`${tSetup(`tasks.${step.key}.title`)}: ${tSetup(`tasks.${step.key}.cta`)}`}
                className="absolute inset-0 z-[1] rounded-[24px] max-[600px]:rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              />
              {card}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
