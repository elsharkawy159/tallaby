"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Layers, Loader2, Package, Send, Smartphone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import type { AdRequestRow, AdWallet } from "@/actions/ads";
import {
  AD_PACKAGE_PERIODS,
  AD_PACKAGES,
  type AdPackageKey,
  type AdPackagePeriod,
} from "@/lib/ad-packages";
import { AdPackageCard } from "./ad-package-card";
import { AdRequestsList } from "./ad-requests-list";
import { CampaignPlan } from "./campaign-plan";
import { MobileSummaryBar, OrderSummary, type SummaryAction } from "./order-summary";
import { PaymentPanel, usePaymentForm } from "./payment-panel";
import { ProductPicker, type AdProductOption } from "./product-picker";
import { StepSection, type StepState } from "./step-section";

type Props = {
  products: AdProductOption[];
  requests: AdRequestRow[];
  wallet: AdWallet | null;
};

type Step = 1 | 2 | 3;

const stepId = (n: Step) => `ad-step-${n}`;

export function AdvertiseProducts({ products, requests, wallet }: Props) {
  const t = useTranslations("advertise");
  const tNav = useTranslations("nav");
  const dir = useLocale() === "en" ? "ltr" : "rtl";
  const [period, setPeriod] = useState<AdPackagePeriod>("weekly");
  const [packageKey, setPackageKey] = useState<AdPackageKey | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);
  const scrollTarget = useRef<string | null>(null);

  const pkg = AD_PACKAGES.find((p) => p.key === packageKey) ?? null;
  const product = products.find((p) => p.id === productId) ?? null;
  const pkgName = pkg ? t(`package.${pkg.key}.name`) : "";

  const payment = usePaymentForm({
    pkg,
    productId,
    wallet,
    onSubmitted: (method) => {
      toast.success(t("success.title"), {
        description: t(method === "wallet" ? "success.walletBody" : "success.body"),
      });
      setPackageKey(null);
      setProductId(null);
      setStep(1);
      scrollTarget.current = "ad-requests";
    },
  });

  // Scroll after the step's body has rendered, so the offset is right.
  useEffect(() => {
    if (!scrollTarget.current) return;
    document.getElementById(scrollTarget.current)?.scrollIntoView({ behavior: "smooth", block: "start" });
    scrollTarget.current = null;
  });

  const canGo = (n: Step) => n === 1 || (n === 2 && !!pkg) || (n === 3 && !!pkg && !!product);
  const go = (n: Step) => {
    if (!canGo(n)) return;
    setStep(n);
    scrollTarget.current = stepId(n);
  };
  const stateOf = (n: Step): StepState => {
    if (step === n) return "active";
    if ((n === 1 && pkg) || (n === 2 && product)) return "done";
    return canGo(n) ? "idle" : "locked";
  };

  const summaryAction: SummaryAction =
    step === 1
      ? { label: pkg ? t("flow.nextProduct") : t("summary.choosePackage"), disabled: !pkg, onClick: () => go(2) }
      : step === 2
        ? { label: product ? t("flow.nextPayment") : t("summary.chooseProduct"), disabled: !product, onClick: () => go(3) }
        : {
            label: payment.pending ? t("payment.submitting") : t("payment.submit"),
            disabled: !payment.ready,
            pending: payment.pending,
            onClick: payment.submit,
          };
  const mobileAction: SummaryAction = {
    ...summaryAction,
    label: step === 3 ? t("flow.send") : t("flow.next"),
  };

  return (
    <div className="mx-auto w-full pb-28 lg:pb-0">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold leading-snug sm:text-2xl">{tNav("advertiseProducts")}</h1>
          <p className="mt-1 max-w-155 text-pretty text-muted-foreground">{t("intro")}</p>
        </div>
        <div className="hidden flex-wrap gap-1.5 sm:flex">
          {(
            [
              ["package", Layers],
              ["product", Package],
              ["payment", Smartphone],
            ] as const
          ).map(([key, Icon]) => (
            <span
              key={key}
              className="inline-flex h-7.5 items-center gap-1.5 whitespace-nowrap rounded-full border bg-card px-3 text-xs text-muted-foreground"
            >
              <Icon className="size-3.5 text-primary-ink" aria-hidden />
              {t(`steps.${key}`)}
            </span>
          ))}
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-3.5">
          <StepSection
            id={stepId(1)}
            index={1}
            title={t("steps.package")}
            description={t("steps.packageDesc")}
            summary={pkg ? `${pkgName} · ${pkg.price.toLocaleString()} ${t("package.currency")}` : undefined}
            state={stateOf(1)}
            onOpen={() => go(1)}
            footer={
              <>
                <span className="text-xs text-muted-foreground">
                  {pkg ? t("flow.picked", { name: pkgName }) : t("flow.pickPackage")}
                </span>
                <Button type="button" variant="secondary" disabled={!pkg} onClick={() => go(2)}>
                  {t("flow.nextProduct")}
                  <ArrowRight className="rtl:rotate-180" aria-hidden />
                </Button>
              </>
            }
          >
            <Tabs value={period} onValueChange={(v) => setPeriod(v as AdPackagePeriod)} dir={dir} className="mb-4">
              <TabsList>
                {AD_PACKAGE_PERIODS.map((key) => (
                  <TabsTrigger key={key} value={key}>
                    {t(`package.periods.${key}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div
              role="radiogroup"
              aria-label={t("steps.package")}
              className="grid gap-3 pt-2.5 sm:grid-cols-[repeat(auto-fit,minmax(13.75rem,1fr))]"
            >
              {AD_PACKAGES.filter((p) => p.period === period).map((p) => (
                <AdPackageCard
                  key={p.key}
                  pkg={p}
                  selected={p.key === packageKey}
                  onSelect={() => setPackageKey(p.key)}
                />
              ))}
            </div>
            <p className="mt-2.5 text-[11px] text-muted-foreground">{t("package.estimates.disclaimer")}</p>
            {pkg && <CampaignPlan pkg={pkg} />}
          </StepSection>

          <StepSection
            id={stepId(2)}
            index={2}
            title={t("steps.product")}
            description={t("steps.productDesc")}
            summary={product?.title}
            state={stateOf(2)}
            onOpen={() => go(2)}
            footer={
              <>
                <Button type="button" variant="soft" onClick={() => go(1)}>
                  <ArrowLeft className="rtl:rotate-180" aria-hidden />
                  {t("flow.back")}
                </Button>
                <Button type="button" variant="secondary" disabled={!product} onClick={() => go(3)}>
                  {t("flow.nextPayment")}
                  <ArrowRight className="rtl:rotate-180" aria-hidden />
                </Button>
              </>
            }
          >
            <ProductPicker products={products} selectedId={productId} onSelect={setProductId} />
          </StepSection>

          <StepSection
            id={stepId(3)}
            index={3}
            title={t("steps.payment")}
            description={t("steps.paymentDesc")}
            state={stateOf(3)}
            onOpen={() => go(3)}
            footer={
              <>
                <Button type="button" variant="soft" onClick={() => go(2)}>
                  <ArrowLeft className="rtl:rotate-180" aria-hidden />
                  {t("flow.back")}
                </Button>
                <Button type="button" variant="accent" disabled={!payment.ready} onClick={payment.submit}>
                  {payment.pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
                  {payment.pending ? t("payment.submitting") : t("payment.submit")}
                </Button>
              </>
            }
          >
            {pkg && <PaymentPanel pkg={pkg} form={payment} />}
          </StepSection>

          <AdRequestsList requests={requests} />
        </div>

        <OrderSummary pkg={pkg} product={product} action={summaryAction} />
      </div>

      <MobileSummaryBar pkg={pkg} product={product} action={mobileAction} />
    </div>
  );
}
