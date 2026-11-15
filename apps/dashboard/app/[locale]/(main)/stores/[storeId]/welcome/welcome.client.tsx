"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, LoaderCircle, Pencil, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@workspace/ui/components/accordion";
import { Link, useRouter } from "@/i18n/navigation";
import { IconButton, Modal, Note, SellerButton, SellerCard, Tag } from "@/components/seller-ui";
import { IndustryNichePicker } from "@/components/stores/industry-niche-picker.client";
import { STORE_INDUSTRIES, type StoreIndustry } from "@/lib/stores/industries.lib";
import { cn } from "@/lib/utils";
import { requestSetupPromptCheck } from "../../../_components/setup-prompts.lib";
import { saveStoreGeneral } from "../settings/store-settings.server";
import { WelcomeBrandStep } from "./welcome-brand.client";
import { WelcomePaymentsStep, WelcomeShippingStep } from "./welcome-delivery.client";
import { WelcomeThemeStep } from "./welcome-theme.client";
import {
  initialWelcomeSection,
  nextWelcomeStep,
  welcomeDeliverySteps,
  welcomeProductHref,
  welcomeProgress,
  welcomeSetupSteps,
  type WelcomeDeliveryStepKey,
  type WelcomeSetupStepKey,
} from "./welcome.lib";
import type { WelcomeData } from "./welcome.types";

/**
 * The welcome page's sections (docs/plans/seller-welcome.md): an accordion,
 * one section open at a time, the first unfinished one open on arrival, or
 * the one a `#hash` names (`#product` after the first product). Every save
 * uses an existing action, then `router.refresh()` re-reads the done-states.
 */
export function StoreWelcome({ data, fontClassName }: { data: WelcomeData; fontClassName: string }) {
  const t = useTranslations("storeWelcome");
  const steps = welcomeSetupSteps({ flags: data.flags, hasIndustry: Boolean(data.industry.category.en || data.industry.category.ar), themesAvailable: data.themesAvailable });
  const next = nextWelcomeStep(steps);
  const deliverySteps = welcomeDeliverySteps(data.flags);
  const deliveryNext = deliverySteps.find((step) => !step.done)?.key ?? null;
  const progress = welcomeProgress(data.flags);
  const stepsDone = steps.filter((step) => step.done).length;
  const [open, setOpen] = useState<string>(() => initialWelcomeSection("", steps, deliverySteps));
  const disabled = data.readOnly;

  // A deep link (`#product`, `#brand`…) opens its section and scrolls to the step.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const section = initialWelcomeSection(hash, steps, deliverySteps);
    if (!section) return;
    setOpen(section);
    const id = hash.slice(1);
    const timer = window.setTimeout(() => document.getElementById(`welcome-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    return () => window.clearTimeout(timer);
    // Only on arrival: later refreshes keep what the seller opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {data.readOnly && <Note tone="amber">{t("readOnly")}</Note>}

      <div className="flex flex-col gap-2" role="group" aria-label={t("progressLabel")}>
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

      <Accordion type="single" collapsible value={open} onValueChange={setOpen} className="flex flex-col gap-3">
        <SellerCard id="welcome-setup" className="scroll-mt-24 overflow-hidden">
          <AccordionItem value="setup">
            <AccordionTrigger className="items-center rounded-none bg-transparent px-5 py-4! hover:bg-(--s-fill)/40 max-[600px]:px-4">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-[16px] font-bold text-(--s-ink)">
                  {t("main.title")}
                  {next ? (
                    <Tag>{t("main.count", { done: stepsDone, total: steps.length })}</Tag>
                  ) : (
                    <Tag tone="success">{t("done")}</Tag>
                  )}
                </span>
                <span className="text-[13px] font-normal text-(--s-subtle)">{t("main.description")}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-1 pb-5 max-[600px]:px-0">
              <ol className="flex flex-col">
                {steps.map((step, index) => (
                  <WelcomeStep
                    key={step.key}
                    stepKey={step.key}
                    number={index + 1}
                    done={step.done}
                    current={step.key === next}
                    last={index === steps.length - 1}
                  >
                    {step.key === "industry" && <IndustryStep data={data} disabled={disabled} />}
                    {step.key === "theme" && <WelcomeThemeStep storeId={data.storeId} done={step.done} disabled={disabled} fontClassName={fontClassName} />}
                    {step.key === "brand" && (
                      <WelcomeBrandStep
                        // A theme install rewrites the design system (and its version): start from the new one.
                        key={data.brand.designSystem?.version ?? 0}
                        storeId={data.storeId}
                        storeName={data.storeName}
                        brand={data.brand}
                        themeApplied={data.flags.template}
                        disabled={disabled}
                      />
                    )}
                    {step.key === "product" && <ProductStep storeId={data.storeId} done={step.done} aiEnabled={data.aiEnabled} disabled={disabled} />}
                  </WelcomeStep>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        </SellerCard>

        <SellerCard id="welcome-delivery" className="scroll-mt-24 overflow-hidden">
          <AccordionItem value="delivery">
            <AccordionTrigger className="items-center rounded-none bg-transparent px-5 py-4! hover:bg-(--s-fill)/40 max-[600px]:px-4">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-[16px] font-bold text-(--s-ink)">
                  {t("delivery.title")}
                  {deliveryNext ? (
                    <Tag>{t("main.count", { done: deliverySteps.filter((step) => step.done).length, total: deliverySteps.length })}</Tag>
                  ) : (
                    <Tag tone="success">{t("done")}</Tag>
                  )}
                </span>
                <span className="text-[13px] font-normal text-(--s-subtle)">{t("delivery.description")}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-1 pb-5 max-[600px]:px-0">
              <ol className="flex flex-col">
                {deliverySteps.map((step, index) => (
                  <WelcomeStep
                    key={step.key}
                    stepKey={step.key}
                    number={index + 1}
                    done={step.done}
                    current={step.key === deliveryNext}
                    last={index === deliverySteps.length - 1}
                  >
                    {step.key === "shipping" && <WelcomeShippingStep storeId={data.storeId} delivery={data.delivery} disabled={disabled} />}
                    {step.key === "payments" && <WelcomePaymentsStep storeId={data.storeId} delivery={data.delivery} done={step.done} disabled={disabled} />}
                  </WelcomeStep>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        </SellerCard>
      </Accordion>
    </>
  );
}

/** One step of a section: a numbered marker on a line, the title and what to do. */
function WelcomeStep({
  stepKey,
  number,
  done,
  current,
  last,
  children,
}: {
  stepKey: WelcomeSetupStepKey | WelcomeDeliveryStepKey;
  number: number;
  done: boolean;
  current: boolean;
  last: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("storeWelcome");
  return (
    <li id={`welcome-${stepKey}`} className="relative flex scroll-mt-24 gap-3.5 px-4 max-[600px]:gap-3 max-[600px]:px-3">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border-[1.5px] border-(--s-line) bg-(--s-surface) font-montserrat text-[13px] font-bold text-(--s-subtle)",
            current && "border-accent bg-accent text-accent-foreground",
            done && "border-success bg-success text-white",
          )}
        >
          {done ? <Check className="size-4 stroke-3" aria-hidden /> : number}
        </span>
        {!last && <span aria-hidden className="my-1 w-px flex-1 bg-(--s-line)" />}
      </div>
      <div className={cn("flex min-w-0 flex-1 flex-col gap-3", last ? "pb-1" : "pb-7")}>
        <div className="pt-1">
          <h3 className="text-[15px] font-bold leading-normal text-(--s-ink)">
            {t(`steps.${stepKey}.title`)}
            {done && <span className="sr-only"> ({t("done")})</span>}
          </h3>
          <p className="text-pretty text-[13px] leading-[1.6] text-(--s-muted)">{t(`steps.${stepKey}.description`)}</p>
        </div>
        {children}
      </div>
    </li>
  );
}

/** Step 1a: the industry and niche, shown; the pencil opens the same chips as Store settings › General. */
function IndustryStep({ data, disabled }: { data: WelcomeData; disabled: boolean }) {
  const t = useTranslations("storeWelcome.steps.industry");
  const tSettings = useTranslations("storeSettings");
  const uiLocale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, startSaving] = useTransition();
  const saved = STORE_INDUSTRIES.find((option) => option.id === data.industry.id) ?? null;
  const [industry, setIndustry] = useState<StoreIndustry | null>(saved);
  const [niche, setNiche] = useState(data.industry.savedNiche);

  const industryName = saved
    ? uiLocale === "en"
      ? saved.en
      : saved.ar
    : (uiLocale === "en" ? data.industry.category.en || data.industry.category.ar : data.industry.category.ar || data.industry.category.en) || "";
  const nicheName = saved && data.industry.shownNiche ? (data.industry.nicheOptions[saved.id] ?? []).find((option) => option.id === data.industry.shownNiche)?.name : undefined;
  const changed = industry !== null && (industry.id !== saved?.id || niche !== data.industry.savedNiche);

  const openEditor = () => {
    setIndustry(saved);
    setNiche(data.industry.savedNiche);
    setEditing(true);
  };

  const onSave = () =>
    startSaving(async () => {
      if (!industry) return;
      const result = await saveStoreGeneral(data.storeId, { storeCategory: industry.en, storeCategoryAr: industry.ar, niche: niche || null });
      if (!result.success) {
        toast.error(tSettings(`errors.${result.error}`));
        return;
      }
      toast.success(t("saved"));
      setEditing(false);
      // The themes are sorted by the industry and niche.
      void queryClient.invalidateQueries({ queryKey: ["store-templates", data.storeId] });
      router.refresh();
      requestSetupPromptCheck();
    });

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-(--s-line) bg-(--s-surface) px-3.5 py-2.5">
        <p className="min-w-0 text-[14px] font-semibold text-(--s-ink)">
          {industryName ? (
            <>
              {industryName}
              {nicheName && <span className="font-normal text-(--s-muted)"> · {nicheName}</span>}
            </>
          ) : (
            <span className="font-normal text-(--s-subtle)">{t("empty")}</span>
          )}
        </p>
        {industryName ? (
          <IconButton disabled={disabled} onClick={openEditor} aria-label={t("edit")} title={t("edit")}>
            <Pencil aria-hidden />
          </IconButton>
        ) : (
          <SellerButton size="sm" variant="solid" disabled={disabled} onClick={openEditor}>
            {t("choose")}
          </SellerButton>
        )}
      </div>

      <Modal
        open={editing}
        onOpenChange={(value) => !value && !saving && setEditing(false)}
        title={t("modalTitle")}
        width={560}
        footer={
          <>
            <SellerButton variant="outline" disabled={saving} onClick={() => setEditing(false)}>
              {t("cancel")}
            </SellerButton>
            <SellerButton variant="solid" disabled={saving || !changed} onClick={onSave}>
              {saving && <LoaderCircle className="animate-spin" aria-hidden />}
              {t("save")}
            </SellerButton>
          </>
        }
      >
        <IndustryNichePicker
          industryId={industry?.id ?? null}
          nicheId={niche}
          niches={industry ? (data.industry.nicheOptions[industry.id] ?? []) : []}
          disabled={saving}
          onIndustryChange={(option) => {
            // Another industry has other niches: the niche starts again.
            if (industry?.id !== option.id) setNiche("");
            setIndustry(option);
          }}
          onNicheChange={setNiche}
        />
      </Modal>
    </>
  );
}

/** Step 1d: today's add-product page (AI first), which comes back here once the product is published. */
function ProductStep({ storeId, done, aiEnabled, disabled }: { storeId: string; done: boolean; aiEnabled: boolean; disabled: boolean }) {
  const t = useTranslations("storeWelcome.steps.product");
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
