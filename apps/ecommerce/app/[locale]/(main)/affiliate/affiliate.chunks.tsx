"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import posthog from "posthog-js";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  Gift,
  Link2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Users,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

import { Link, useRouter } from "@/i18n/navigation";
import { joinAffiliateProgramAction } from "@/actions/affiliate";

/** Shown to a guest, or an authenticated customer who hasn't joined yet — never a real code. */
const PREVIEW_CODE = "YOUR_CODE";

export interface AffiliatePageAccount {
  code: string;
  status: "active" | "inactive";
}

const BENEFIT_ICONS = [TrendingUp, Gift, Link2, Wallet];
const STEP_ICONS = [Users, Sparkles, Link2, Wallet];
const STEP_NUMBERS = ["01", "02", "03", "04"];
/** Only the "get your code" step (index 1) shows a preview code chip. */
const STEP_CODE_INDEX = 1;

const RECENT_ACTIVITY = [
  {
    order: "#TLB-10294",
    statusKey: "activityStatusDelivered" as const,
    profitKey: "activityProfit1" as const,
  },
  {
    order: "#TLB-10281",
    statusKey: "activityStatusOnTheWay" as const,
    profitKey: null,
  },
  {
    order: "#TLB-10270",
    statusKey: "activityStatusDelivered" as const,
    profitKey: "activityProfit2" as const,
  },
];

interface BenefitEntry {
  title: string;
  text: string;
}

interface FaqEntry {
  question: string;
  answer: string;
}

export function AffiliatePageContent({
  account,
  isAuthenticated,
}: {
  account: AffiliatePageAccount | null;
  isAuthenticated: boolean;
}) {
  const t = useTranslations("affiliateLanding");
  const [copied, setCopied] = useState(false);
  const [isJoining, startJoining] = useTransition();
  const router = useRouter();

  const isJoined = Boolean(account);
  const displayCode = account?.code ?? PREVIEW_CODE;

  const benefits = t.raw("benefits") as BenefitEntry[];
  const steps = t.raw("steps") as BenefitEntry[];
  const checklist = t.raw("checklist") as string[];
  const faqs = t.raw("faqs") as FaqEntry[];
  const flowSteps = [
    t("flowStepShare"),
    t("flowStepSave"),
    t("flowStepDelivered"),
    t("flowStepEarn"),
  ];

  useEffect(() => {
    posthog.capture("affiliate_program_view");
    // Fires once per page load, regardless of prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyCode() {
    await navigator.clipboard.writeText(displayCode);
    setCopied(true);
    if (isJoined) posthog.capture("affiliate_code_copied");
    window.setTimeout(() => setCopied(false), 1800);
  }

  function handleJoin() {
    startJoining(async () => {
      const result = await joinAffiliateProgramAction();
      if (result.success) {
        posthog.capture("affiliate_signup");
        toast.success(t("joinSuccess", { code: result.data.code }));
        router.push("/profile/affiliate");
      } else {
        toast.error(t("joinFailed"));
      }
    });
  }

  // A plain function, not a nested component — it closes over isJoined/
  // isAuthenticated/handleJoin and is invoked as {renderAffiliateCta(...)},
  // never rendered as a JSX tag, so it never risks the "new component
  // identity every render" pitfall a capitalized nested component would have.
  function renderAffiliateCta(className = "") {
    if (isJoined) {
      return (
        <Button asChild size="lg" className={className}>
          <Link href="/profile/affiliate">
            {t("goToDashboard")} <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      );
    }
    if (isAuthenticated) {
      return (
        <Button
          size="lg"
          className={className}
          onClick={handleJoin}
          disabled={isJoining}
        >
          {isJoining ? t("joining") : t("joinCta")}{" "}
          <ArrowRight data-icon="inline-end" />
        </Button>
      );
    }
    return (
      <Button asChild size="lg" className={className}>
        <Link href="/auth?redirect=/affiliate">
          {t("joinCta")} <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="overflow-hidden bg-primary text-primary-foreground">
        <div className="container py-12 md:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
            <div className="text-center lg:text-start">
              <Badge className="mb-5 bg-accent text-accent-foreground">
                {t("badge")}
              </Badge>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {t("heroTitleStart")}{" "}
                <span className="text-accent">{t("heroTitleHighlight")}</span>{" "}
                {t("heroTitleEnd")}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-primary-foreground/80 lg:mx-0">
                {t("heroDescription")}
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                {renderAffiliateCta(
                  "bg-accent text-accent-foreground hover:bg-accent/90",
                )}
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link href="#how-it-works">{t("howItWorksCta")}</Link>
                </Button>
              </div>
              <div className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/70 lg:justify-start">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-accent" /> {t("noSetup")}
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-accent" />{" "}
                  {t("autoWalletCredit")}
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div className="rounded-3xl border border-primary-foreground/15 bg-primary-foreground/10 p-5 shadow-2xl backdrop-blur-sm sm:p-7">
                <div className="flex items-center justify-between text-sm text-primary-foreground/70">
                  <span>{t("yourPersonalCode")}</span>
                  <Sparkles className="size-4 text-accent" />
                </div>
                <div className="mt-4 rounded-2xl bg-background p-5 text-foreground shadow-xl">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-2xl font-bold tracking-[0.18em] text-primary sm:text-3xl">
                      {displayCode}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      aria-label={t("codeCopyAria")}
                      onClick={copyCode}
                    >
                      {copied ? (
                        <Check data-icon="inline-start" />
                      ) : (
                        <Copy data-icon="inline-start" />
                      )}
                    </Button>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t pt-4">
                    <span className="text-sm text-muted-foreground">
                      {t("customerDiscount")}
                    </span>
                    <span className="text-xl font-bold text-accent">
                      {t("discountBadge")}
                    </span>
                  </div>
                  {copied && (
                    <p className="mt-3 text-xs font-medium text-primary">
                      {t("codeCopied")}
                    </p>
                  )}
                </div>
                <div className="mt-6 grid grid-cols-4 items-center gap-2 text-center text-xs text-primary-foreground/75">
                  {flowSteps.map((label, index) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-2"
                    >
                      <span className="flex size-9 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">
                        {index + 1}
                      </span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t("whyEyebrow")}
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">
              {t("whyHeading")}
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ title, text }, index) => {
              const Icon = BENEFIT_ICONS[index]!;
              return (
                <Card
                  key={title}
                  className="bg-card transition-transform hover:-translate-y-1"
                >
                  <CardHeader>
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="pt-3 text-lg">{title}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {text}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-20 bg-muted/50 py-16 md:py-24"
        >
          <div className="container">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {t("howEyebrow")}
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">
                {t("howHeading")}
              </h2>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-4">
              {steps.map(({ title, text }, index) => {
                const Icon = STEP_ICONS[index]!;
                const number = STEP_NUMBERS[index]!;
                return (
                  <div key={number} className="relative">
                    <div className="flex items-center gap-4 lg:block">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
                        {number}
                      </span>
                      <div className="mt-0 lg:mt-5">
                        <Icon className="hidden size-5 text-accent lg:block" />
                        <h3 className="mt-0 font-semibold lg:mt-3">{title}</h3>
                      </div>
                    </div>
                    <p className="ml-16 mt-3 text-sm leading-relaxed text-muted-foreground lg:ml-0">
                      {text}
                    </p>
                    {index === STEP_CODE_INDEX && (
                      <p className="ml-16 mt-3 inline-block rounded-lg bg-background px-3 py-2 font-mono text-sm font-semibold text-primary lg:ml-0">
                        {PREVIEW_CODE}
                      </p>
                    )}
                    {index !== steps.length - 1 && (
                      <span className="absolute left-12 top-12 hidden h-px w-[calc(100%-2rem)] bg-border lg:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="container py-16 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {t("mathEyebrow")}
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">
                {t("mathHeading")}
              </h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {t("mathDescription")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-muted/40">
                <CardHeader>
                  <CardDescription>{t("customerPays")}</CardDescription>
                  <CardTitle className="text-2xl text-primary">
                    {t("customerPaysAmount")}{" "}
                    <span className="text-base font-normal text-muted-foreground">
                      {t("plusShipping")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>{t("productsSubtotal")}</p>
                  <p className="mt-2 text-accent">{t("discountLine")}</p>
                </CardContent>
              </Card>
              <Card className="border-accent/40 bg-accent/10">
                <CardHeader>
                  <CardDescription>{t("affiliateEarns")}</CardDescription>
                  <CardTitle className="text-2xl text-primary">
                    {t("affiliateEarnsAmount")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>{t("eligiblePercent")}</p>
                  <p className="mt-2 inline-flex items-center gap-1 font-medium text-primary">
                    <Wallet className="size-4" /> {t("addedAfterDelivery")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-primary py-16 text-primary-foreground md:py-24">
          <div className="container">
            <div className="grid items-start gap-8 lg:grid-cols-[.7fr_1.3fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                  {t("dashboardEyebrow")}
                </p>
                <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">
                  {t("dashboardHeading")}
                </h2>
                <p className="mt-5 leading-relaxed text-primary-foreground/75">
                  {t("dashboardDescription")}
                </p>
                <p className="mt-6 inline-flex items-center gap-2 text-sm text-primary-foreground/75">
                  <ShieldCheck className="size-4 text-accent" />{" "}
                  {t("privacySafe")}
                </p>
              </div>
              <div className="rounded-3xl bg-background p-4 text-foreground shadow-2xl sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("yourAffiliateCode")}
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold tracking-wider text-primary">
                      {displayCode}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={copyCode}>
                    {copied ? t("copied") : t("copyCode")}{" "}
                    <Clipboard data-icon="inline-end" />
                  </Button>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    [t("statOrders"), "24"],
                    [t("statDelivered"), "19"],
                    [t("statPendingProfit"), t("statPendingProfitValue")],
                    [t("statTotalProfit"), t("statTotalProfitValue")],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-2 font-semibold text-primary">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-accent/30 bg-accent/10 p-4">
                  <p className="text-xs text-muted-foreground">
                    {t("walletBalance")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {t("walletBalanceValue")}
                  </p>
                </div>
                <div className="mt-5">
                  <p className="text-sm font-semibold">{t("recentActivity")}</p>
                  <div className="mt-3 flex flex-col gap-3">
                    {RECENT_ACTIVITY.map(({ order, statusKey, profitKey }) => (
                      <div
                        key={order}
                        className="flex items-center justify-between gap-3 border-b pb-3 text-sm last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">Order {order}</p>
                          <p className="text-xs text-muted-foreground">
                            {t(statusKey)}
                          </p>
                        </div>
                        <span
                          className={
                            profitKey
                              ? "font-semibold text-primary"
                              : "text-muted-foreground"
                          }
                        >
                          {profitKey
                            ? t(profitKey)
                            : t("activityProfitPending")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-5 text-xs text-muted-foreground">
                  {t("earningsAvailableNote")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {t("sharingEyebrow")}
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">
                {t("sharingHeading")}
              </h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {t("sharingDescription")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {checklist.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-4" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/50 py-16 md:py-24">
          <div className="container max-w-3xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {t("faqEyebrow")}
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                {t("faqHeading")}
              </h2>
            </div>
            <Accordion
              type="single"
              collapsible
              className="mt-10 flex flex-col gap-3"
            >
              {faqs.map(({ question, answer }, index) => (
                <AccordionItem key={question} value={`faq-${index}`}>
                  <AccordionTrigger>{question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <section className="bg-primary py-16 text-center text-primary-foreground md:py-20">
        <div className="container">
          <h2 className="text-balance text-3xl font-bold md:text-4xl">
            {t("finalHeading")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/75">
            {t("finalDescription")}
          </p>
          <div className="mt-8 flex justify-center">
            {renderAffiliateCta(
              "bg-accent text-accent-foreground hover:bg-accent/90",
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
