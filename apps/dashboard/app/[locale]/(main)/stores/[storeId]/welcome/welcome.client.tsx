"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Check, ChevronDown, Sparkles } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Note, SellerButton, SellerCard } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { requestSetupPromptCheck } from "../../../_components/setup-prompts.lib";
import { AiProductCreatedCard, AiProductUploader } from "../products/add/ai/ai-product-uploader.client";
import type { QuickProductCard } from "../products/add/ai/ai-product-uploader.lib";
import { WelcomeShippingStep } from "./welcome-delivery.client";
import { WelcomeIndustryLine } from "./welcome-industry.client";
import { WelcomeLiveCard, WelcomeOfflineLine } from "./welcome-live.client";
import { WelcomeThemeStep } from "./welcome-theme.client";
import { WelcomeTopUpLine } from "./welcome-top-up.client";
import {
  nextWelcomeStep,
  welcomeArrival,
  welcomeFinishProductHref,
  welcomeHashRedirect,
  welcomeLiveState,
  welcomeProductHref,
  welcomeProgress,
  welcomeStepBlocker,
  welcomeSteps,
  welcomeThemeNeedsConfirm,
  type WelcomeStepKey,
} from "./welcome.lib";
import type { WelcomeData } from "./welcome.types";

/**
 * The welcome page (docs/plans/seller-welcome.md, owner 2026-11-17): one flat
 * list of at most three steps with one counter, one step open at a time (the
 * first unfinished one on arrival, or the one a `#hash` names), in order: a
 * step waiting for an earlier one is greyed with what to do first and can't
 * be opened (owner, 2026-11-25). Then the
 * "store is live" card and the top-up line. Every save uses an existing
 * action, then `router.refresh()` re-reads the done-states.
 */
export function StoreWelcome({ data, fontClassName }: { data: WelcomeData; fontClassName: string }) {
  const t = useTranslations("storeWelcome");
  const router = useRouter();
  const steps = welcomeSteps({ flags: data.flags, themesAvailable: data.themesAvailable });
  const next = nextWelcomeStep(steps);
  const progress = welcomeProgress(steps);
  const live = welcomeLiveState({ flags: data.flags, themesAvailable: data.themesAvailable, wallet: data.wallet.status });
  const [open, setOpen] = useState<WelcomeStepKey | "">(() => welcomeArrival("", steps).open);
  const disabled = data.readOnly;

  // A deep link (`#product`, `#shipping`…) opens its step and scrolls to it; `#payments` now lives in Settings.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const moved = welcomeHashRedirect(hash, data.storeId);
    if (moved) {
      router.replace(moved);
      return;
    }
    const arrival = welcomeArrival(hash, steps);
    setOpen(arrival.open);
    if (!arrival.scrollTo) return;
    const id = `welcome-${arrival.scrollTo}`;
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "start" }), 250);
    return () => window.clearTimeout(timer);
    // Only on arrival: later refreshes keep what the seller opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The open step was just finished (a refresh brought its done flag): move on to the next unfinished one.
  // Not from the product step: it keeps showing the product the seller just created.
  const doneKey = steps.map((step) => (step.done ? "1" : "0")).join("");
  const seenDoneKey = useRef(doneKey);
  useEffect(() => {
    if (seenDoneKey.current === doneKey) return;
    const before = seenDoneKey.current;
    seenDoneKey.current = doneKey;
    setOpen((current) => {
      const index = steps.findIndex((step) => step.key === current);
      const justDone = index >= 0 && current !== "product" && steps[index]!.done && before[index] === "0";
      return justDone ? (nextWelcomeStep(steps) ?? "") : current;
    });
    // `steps` is rebuilt every render; `doneKey` is what changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneKey]);

  return (
    <>
      {data.readOnly && <Note tone="amber">{t("readOnly")}</Note>}

      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-(--s-muted)">{t("progress", { done: progress.done, total: progress.total })}</p>
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
          aria-label={t("progressLabel")}
        >
          {Array.from({ length: progress.total }, (_, index) => (
            <span key={index} className={cn("h-1.5 flex-1 rounded-full bg-(--s-fill)", index < progress.done && "bg-success")} />
          ))}
        </div>
      </div>

      <SellerCard className="overflow-hidden py-2">
        <ol className="flex flex-col">
          {steps.map((step, index) => {
            const blocker = welcomeStepBlocker(steps, step.key);
            return (
              <WelcomeStep
                key={step.key}
                stepKey={step.key}
                number={index + 1}
                done={step.done}
                current={step.key === next}
                open={!blocker && step.key === open}
                locked={blocker ? t(`locked.${blocker}`) : null}
                last={index === steps.length - 1}
                summary={step.key === "shipping" ? t("steps.shipping.zonesSummary", { count: data.delivery.shipping.zones.length }) : t(`steps.${step.key}.doneNote`)}
                onToggle={() => setOpen((current) => (current === step.key ? "" : step.key))}
              >
                {step.key === "theme" && (
                  <WelcomeThemeStep
                    storeId={data.storeId}
                    done={step.done}
                    needsConfirm={welcomeThemeNeedsConfirm({ templateChosen: data.flags.template, siteStatus: data.share.siteStatus })}
                    disabled={disabled}
                    fontClassName={fontClassName}
                    industry={<WelcomeIndustryLine storeId={data.storeId} industry={data.industry} disabled={disabled} />}
                  />
                )}
                {step.key === "product" && <ProductStep data={data} done={step.done} disabled={disabled} />}
                {step.key === "shipping" && <WelcomeShippingStep storeId={data.storeId} delivery={data.delivery} disabled={disabled} />}
              </WelcomeStep>
            );
          })}
        </ol>
      </SellerCard>

      {live === "live" && <WelcomeLiveCard storeName={data.storeName} url={data.share.url} />}
      {live === "offline" && <WelcomeOfflineLine storeId={data.storeId} />}

      <WelcomeTopUpLine wallet={data.wallet} />
    </>
  );
}

/**
 * One step of the list: a numbered marker on a line and a header that opens
 * and closes it. Closed, a done step shows its one-line summary; an open one
 * shows what to do. A locked step (`locked`: what to do first) is greyed and
 * its header can't be pressed.
 */
function WelcomeStep({
  stepKey,
  number,
  done,
  current,
  open,
  locked,
  last,
  summary,
  onToggle,
  children,
}: {
  stepKey: WelcomeStepKey;
  number: number;
  done: boolean;
  current: boolean;
  open: boolean;
  locked: string | null;
  last: boolean;
  summary: string;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslations("storeWelcome");
  const panelId = `welcome-${stepKey}-panel`;
  return (
    <li id={`welcome-${stepKey}`} className="relative flex scroll-mt-24 gap-3.5 px-5 max-[600px]:gap-3 max-[600px]:px-3.5">
      <div className="flex flex-col items-center pt-3">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border-[1.5px] border-(--s-line) bg-(--s-surface) font-montserrat text-[13px] font-bold text-(--s-subtle)",
            current && "border-accent bg-accent text-accent-foreground",
            done && "border-success bg-success text-white",
          )}
        >
          {done ? <Check className="size-4 stroke-3" aria-hidden /> : number}
        </span>
        {!last && <span aria-hidden className="mt-1 w-px flex-1 bg-(--s-line)" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h2>
          <button
            type="button"
            onClick={onToggle}
            disabled={Boolean(locked)}
            aria-expanded={locked ? undefined : open}
            aria-controls={open ? panelId : undefined}
            className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-[14px] py-2 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={cn("text-[15px] font-bold leading-normal text-(--s-ink)", locked && "text-(--s-subtle)")}>
                {t(`steps.${stepKey}.title`)}
                {done && <span className="sr-only"> ({t("done")})</span>}
              </span>
              {locked && <span className="text-[13px] font-normal text-(--s-subtle)">{locked}</span>}
              {!open && done && <span className="truncate text-[13px] font-normal text-(--s-muted)">{summary}</span>}
            </span>
            {!locked && (
              <ChevronDown className={cn("size-5 shrink-0 text-(--s-subtle) transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
            )}
          </button>
        </h2>
        {open && (
          <div id={panelId} className={cn("flex flex-col gap-3", last ? "pb-4" : "pb-6")}>
            <p className="-mt-1.5 text-pretty text-[13px] leading-[1.6] text-(--s-muted)">{t(`steps.${stepKey}.description`)}</p>
            {children}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * The first product. With AI on: the quick AI uploader right here (photos,
 * description, price, one click), replaced by the saved product's card; the
 * full add form stays one link away. With AI off: today's add page, which
 * comes back here once the product is published. A done step shows the
 * store's newest product.
 */
function ProductStep({ data, done, disabled }: { data: WelcomeData; done: boolean; disabled: boolean }) {
  const t = useTranslations("storeWelcome.steps.product");
  const router = useRouter();
  const { storeId, aiEnabled } = data;
  // Kept across router.refresh(), so the card doesn't flash while the done flag reloads (or stays off for a draft).
  const [created, setCreated] = useState<QuickProductCard | null>(null);
  const card = created ?? (done ? data.product.latest : null);

  if (card) return <AiProductCreatedCard storeId={storeId} product={card} />;
  if (done) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13.5px] font-semibold text-success">{t("doneNote")}</p>
        <Link href={`/stores/${storeId}/products`} className="inline-flex min-h-10 items-center text-[13px] font-bold text-(--s-link) underline-offset-4 hover:underline">
          {t("viewProducts")}
        </Link>
      </div>
    );
  }
  if (aiEnabled && data.product.uploader) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-pretty text-[13px] text-(--s-muted)">{t("aiHint")}</p>
        <AiProductUploader
          storeId={storeId}
          categories={data.product.uploader.categories}
          sellerPricing={data.product.uploader.sellerPricing}
          finishHref={welcomeFinishProductHref(storeId)}
          disabled={disabled}
          onCreated={(product) => {
            setCreated(product);
            router.refresh();
            requestSetupPromptCheck();
          }}
        />
        <Link
          href={welcomeProductHref(storeId, false)}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          className={cn("inline-flex min-h-10 items-center self-start text-[13px] font-bold text-(--s-link) underline-offset-4 hover:underline", disabled && "pointer-events-none opacity-45")}
        >
          {t("fullForm")}
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {aiEnabled && <p className="text-pretty text-[13px] text-(--s-muted)">{t("aiHint")}</p>}
      <SellerButton asChild size="default" className={cn("self-start max-[600px]:w-full", disabled && "pointer-events-none opacity-45")}>
        <Link href={welcomeProductHref(storeId, aiEnabled)} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : undefined}>
          {aiEnabled && <Sparkles aria-hidden />}
          {t(aiEnabled ? "cta" : "ctaManual")}
          <ArrowLeft className="ltr:rotate-180" aria-hidden />
        </Link>
      </SellerButton>
    </div>
  );
}
