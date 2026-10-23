"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { ChevronRight, CircleCheck, CircleHelp, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import { Spinner } from "@workspace/ui/components/spinner";
import type { FulfillmentPlanView } from "@workspace/lib/fulfillment";

import {
  WIZARD_STEPS,
  onboardingDefaults,
  toFormPath,
  toSubmission,
  validateWizardStep,
  wizardStepForPath,
  type FieldIssue,
  type OnboardingFormValues,
  type WizardStep,
} from "./become-seller.dto";
import {
  checkBusinessNameAvailability,
  submitSellerApplication,
} from "./become-seller.server";
import { useOnboardingDraft } from "./use-onboarding-draft";
import { recommendedDefaults } from "./fulfillment-choices.lib";
import { OnboardingSteps } from "./onboarding-steps";
import { BusinessStep, type BusinessNameCheck } from "./steps/business-step";
import { LegalAddressStep } from "./steps/legal-address-step";
import { FulfillmentStep } from "./steps/fulfillment-step";
import { DetailsStep } from "./steps/details-step";
import { ReviewStep } from "./steps/review-step";

const SELLER_SUPPORT_EMAIL = "sellers@tallaby.com";

interface OnboardingFormClientProps {
  user: { id: string } | null;
  plans: FulfillmentPlanView[];
  /** Social sign-in buttons, shown to signed-out visitors. */
  signInOptions?: ReactNode;
}

export function OnboardingFormClient({ user, plans, signInOptions }: OnboardingFormClientProps) {
  const t = useTranslations("onboarding");
  const tToast = useTranslations("toast");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stepIndex, setStepIndex] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [nameCheck, setNameCheck] = useState<BusinessNameCheck>("idle");

  // Start from the recommended setup (Tallaby handles fulfillment).
  const initialValues = useMemo(() => recommendedDefaults(plans, onboardingDefaults), [plans]);
  const form = useForm<OnboardingFormValues>({ defaultValues: initialValues });
  const step = WIZARD_STEPS[stepIndex]!;
  const isLastStep = stepIndex === WIZARD_STEPS.length - 1;

  const draft = useOnboardingDraft(user?.id, form, stepIndex, (restored) => {
    setStepIndex(restored);
    setMaxReached(restored);
  });

  useEffect(() => {
    if (draft.restored) {
      toast.info(t("draftRestored"));
    }
  }, [draft.restored, t]);

  // Live business-name availability (same slug rule as the server).
  const businessName = form.watch("businessName");
  const debouncedName = useDebounce(businessName?.trim() ?? "", 400);
  useEffect(() => {
    if (debouncedName.length < 2) {
      setNameCheck("idle");
      return;
    }
    let cancelled = false;
    setNameCheck("checking");
    checkBusinessNameAvailability(debouncedName)
      .then((available) => {
        if (cancelled) return;
        // null = the check failed; stay neutral rather than block the seller.
        if (available === null) {
          setNameCheck("idle");
          return;
        }
        setNameCheck(available ? "available" : "taken");
        if (!available) {
          form.setError("businessName", { type: "manual", message: t("businessNameTaken") });
        }
      })
      .catch(() => {
        if (!cancelled) setNameCheck("idle");
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedName, form, t]);

  const errorMessage = (code: string) =>
    t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.invalid");

  const applyIssues = (issues: FieldIssue[]) => {
    for (const issue of issues) {
      form.setError(issue.path as FieldPath<OnboardingFormValues>, {
        type: "manual",
        message: errorMessage(issue.code),
      });
    }
  };

  const goTo = (target: number) => {
    setStepIndex(target);
    setMaxReached((max) => Math.max(max, target));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Moves to the screen that owns the first issue and brings it into view. */
  const revealFirstIssue = (issues: FieldIssue[]) => {
    const target = WIZARD_STEPS.indexOf(wizardStepForPath(issues[0]!.path));
    if (target !== stepIndex) goTo(target);
    setTimeout(() => {
      const field = document.querySelector<HTMLElement>(
        '#onboarding-form [aria-invalid="true"]'
      );
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      field?.focus({ preventScroll: true });
    }, 50);
  };

  const handleNext = () => {
    const values = form.getValues();
    form.clearErrors();
    // Review re-validates earlier screens (e.g. a stale draft).
    const issues = isLastStep
      ? WIZARD_STEPS.flatMap((s) => validateWizardStep(s, values))
      : validateWizardStep(step, values);
    if (step === "store" && nameCheck === "taken") {
      issues.push({ path: "businessName", code: "business_name_taken" });
    }
    if (issues.length) {
      applyIssues(issues);
      revealFirstIssue(issues);
      return;
    }
    if (isLastStep) submit(values);
    else goTo(stepIndex + 1);
  };

  const submit = (values: OnboardingFormValues) => {
    startTransition(async () => {
      try {
        const result = await submitSellerApplication(toSubmission(values));

        if (result.success) {
          draft.clear();
          toast.success(t(result.messageKey));
          router.push("/onboarding/success");
          router.refresh();
          return;
        }

        toast.error(t(result.messageKey));
        if (result.errors) {
          const serverIssues = Object.entries(result.errors).map(([path, code]) => ({
            path: toFormPath(path, values),
            code,
          }));
          applyIssues(serverIssues);
          if (serverIssues.length) revealFirstIssue(serverIssues);
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error(tToast("unexpectedError"));
      }
    });
  };

  const startOver = () => {
    draft.clear();
    draft.dismissRestored();
    form.reset(initialValues);
    setMaxReached(0);
    goTo(0);
  };

  const renderStep = (current: WizardStep) => {
    switch (current) {
      case "store":
        return (
          <BusinessStep
            nameCheck={nameCheck}
            onNameEdited={() => setNameCheck("idle")}
            disabled={isPending}
          />
        );
      case "address":
        return <LegalAddressStep />;
      case "fulfillment":
        return <FulfillmentStep plans={plans} />;
      case "operations":
        return <DetailsStep />;
      case "review":
        return <ReviewStep plans={plans} onEdit={(s) => goTo(WIZARD_STEPS.indexOf(s))} />;
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-20 flex flex-col bg-primary px-4 py-3 text-white lg:h-screen lg:gap-7 lg:overflow-auto lg:px-7 lg:pt-7 lg:pb-6">
        <div className="flex items-center justify-between gap-3">
          <Logo color="white" logoClassName="h-6.5 md:h-6.5 lg:h-8.5" />
          <LanguageSwitcher variant="pill" />
        </div>
        <div className="hidden lg:block">
          <h2 className="mb-1.5 text-2xl font-bold text-white">{t("becomeSeller")}</h2>
          <p className="text-sm leading-relaxed text-white/80">{t("wizard.intro")}</p>
        </div>
        <OnboardingSteps
          current={user ? stepIndex : -1}
          maxReached={user ? maxReached : -1}
          onSelect={goTo}
        />
        <div className="mt-auto hidden items-center gap-2.5 border-t border-white/14 pt-5 text-[13px] text-white/80 lg:flex">
          <CircleHelp className="size-4.5 shrink-0" aria-hidden />
          <span>
            {t("wizard.questions")}{" "}
            <a href={`mailto:${SELLER_SUPPORT_EMAIL}`} className="text-white underline">
              {SELLER_SUPPORT_EMAIL}
            </a>
          </span>
        </div>
      </aside>

      <main className="flex flex-col items-center px-3 pt-4 lg:px-8 lg:pt-12 lg:pb-30">
        {!user ? (
          <SignInCard>{signInOptions}</SignInCard>
        ) : (
          <div className="w-full max-w-[760px] rounded-[14px] border border-neutral-200 bg-card shadow-[0_1px_3px_rgba(20,81,99,.06),0_1px_2px_rgba(0,0,0,.04)] lg:rounded-2xl dark:border-input">
            <header className="px-4.5 pt-5.5 pb-1 lg:px-9 lg:pt-8 lg:pb-2">
              <span className="text-[12.5px] font-semibold tracking-wide text-primary/80">
                {t("stepOf", { current: stepIndex + 1, total: WIZARD_STEPS.length })}
              </span>
              <h1 className="mt-1.5 mb-1.5 text-[21px] leading-snug font-bold text-neutral-900 lg:text-[26px] dark:text-foreground">
                {t(`wizard.steps.${step}.title`)}
              </h1>
              <p className="text-sm leading-relaxed text-pretty text-muted-foreground lg:text-[15px]">
                {t(`wizard.steps.${step}.description`)}
              </p>
            </header>

            <Form {...form}>
              <form
                id="onboarding-form"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  handleNext();
                }}
              >
                <div
                  key={step}
                  className="flex flex-col gap-4.5 px-4.5 pt-4.5 pb-6 animate-in fade-in slide-in-from-bottom-1.5 duration-300 lg:gap-5.5 lg:px-9 lg:pt-6 lg:pb-8"
                >
                  {renderStep(step)}
                </div>
              </form>
            </Form>

            <footer className="sticky bottom-0 flex items-center gap-3 border-t border-neutral-200 bg-card/97 px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-6px_16px_rgba(20,81,99,.06)] lg:rounded-b-2xl lg:px-9 lg:py-4 lg:shadow-none dark:border-input">
              {stepIndex > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  className="max-lg:flex-1 rtl:flex-row"
                  onClick={() => goTo(stepIndex - 1)}
                  disabled={isPending}
                >
                  <ChevronRight className="size-4 ltr:rotate-180" />
                  {t("back")}
                </Button>
              ) : draft.restored ? (
                <Button type="button" variant="soft" size="sm" className="rtl:flex-row" onClick={startOver}>
                  <RotateCcw className="size-3.5" />
                  {t("startOver")}
                </Button>
              ) : null}
              <span className="hidden flex-1 items-center justify-center gap-1.5 text-[12.5px] text-muted-foreground lg:flex">
                {draft.savedAt && (
                  <>
                    <CircleCheck className="size-3.5 text-success" aria-hidden />
                    {t("wizard.saved")}
                  </>
                )}
              </span>
              <Button
                type="submit"
                form="onboarding-form"
                variant="accent"
                size="xl"
                className="ms-auto max-lg:flex-1 lg:ms-0 rtl:flex-row"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Spinner className="size-4" />
                    {t("submitting")}
                  </>
                ) : isLastStep ? (
                  t("wizard.submit")
                ) : (
                  <>
                    {t("wizard.continue")}
                    <ChevronRight className="size-4 rtl:rotate-180" />
                  </>
                )}
              </Button>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}

function SignInCard({ children }: { children?: ReactNode }) {
  const t = useTranslations("onboarding");
  return (
    <div className="w-full max-w-[520px] space-y-5 rounded-[14px] border border-neutral-200 bg-card px-6 py-8 text-center shadow-[0_1px_3px_rgba(20,81,99,.06)] lg:rounded-2xl lg:px-9 dark:border-input">
      <div className="space-y-1.5">
        <h1 className="text-[21px] font-bold text-neutral-900 lg:text-[26px] dark:text-foreground">
          {t("authenticationRequired")}
        </h1>
        <p className="text-sm text-muted-foreground lg:text-[15px]">{t("mustBeLoggedIn")}</p>
      </div>
      <Button variant="accent" size="xl" className="w-full" asChild>
        <Link href="/auth?redirect=/onboarding">{t("signInToContinue")}</Link>
      </Button>
      {children && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
            <span className="h-px flex-1 bg-border" />
            {t("orSignInWith")}
            <span className="h-px flex-1 bg-border" />
          </div>
          {children}
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        {t("dontHaveAccount")}{" "}
        <Link href="/auth?redirect=/onboarding" className="font-semibold text-primary hover:underline">
          {t("signUp")}
        </Link>
      </p>
    </div>
  );
}
