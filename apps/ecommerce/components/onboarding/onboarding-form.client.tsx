"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";

import { Link, useRouter } from "@/i18n/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Form } from "@workspace/ui/components/form";
import { Progress } from "@workspace/ui/components/progress";
import { Spinner } from "@workspace/ui/components/spinner";
import type { FulfillmentPlanView } from "@workspace/lib/fulfillment";

import {
  ONBOARDING_STEPS,
  onboardingDefaults,
  stepForPath,
  toFormPath,
  toSubmission,
  validateStep,
  type FieldIssue,
  type OnboardingFormValues,
  type OnboardingStep,
} from "./become-seller.dto";
import {
  checkBusinessNameAvailability,
  submitSellerApplication,
} from "./become-seller.server";
import { useOnboardingDraft } from "./use-onboarding-draft";
import { recommendedDefaults } from "./fulfillment-choices.lib";
import { BusinessStep, type BusinessNameCheck } from "./steps/business-step";
import { LegalAddressStep } from "./steps/legal-address-step";
import { ModelStep } from "./steps/model-step";
import { ServicesStep } from "./steps/services-step";
import { DetailsStep } from "./steps/details-step";
import { ReviewStep } from "./steps/review-step";
import { TermsStep } from "./steps/terms-step";

interface OnboardingFormClientProps {
  user: { id: string } | null;
  plans: FulfillmentPlanView[];
}

export function OnboardingFormClient({ user, plans }: OnboardingFormClientProps) {
  const t = useTranslations("onboarding");
  const tToast = useTranslations("toast");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stepIndex, setStepIndex] = useState(0);
  const [nameCheck, setNameCheck] = useState<BusinessNameCheck>("idle");
  const topRef = useRef<HTMLDivElement>(null);

  // Start from the recommended setup (Tallaby handles fulfillment).
  const initialValues = useMemo(() => recommendedDefaults(plans, onboardingDefaults), [plans]);
  const form = useForm<OnboardingFormValues>({ defaultValues: initialValues });
  const step = ONBOARDING_STEPS[stepIndex]!;
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;
  const progress = ((stepIndex + 1) / ONBOARDING_STEPS.length) * 100;

  const draft = useOnboardingDraft(user?.id, form, stepIndex, setStepIndex);

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
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNext = () => {
    const values = form.getValues();
    form.clearErrors();
    const issues = validateStep(step, values);
    if (step === "business" && nameCheck === "taken") {
      issues.push({ path: "businessName", code: "business_name_taken" });
    }
    if (issues.length) {
      applyIssues(issues);
      // Review re-validates earlier steps (e.g. a stale draft): jump to the first problem.
      if (step === "review") goTo(ONBOARDING_STEPS.indexOf(stepForPath(issues[0]!.path)));
      return;
    }
    goTo(stepIndex + 1);
  };

  const handleBack = () => {
    if (stepIndex > 0) goTo(stepIndex - 1);
  };

  const handleSubmit = () => {
    const values = form.getValues();
    form.clearErrors();
    const issues = [...validateStep("review", values), ...validateStep("terms", values)];
    if (issues.length) {
      applyIssues(issues);
      goTo(ONBOARDING_STEPS.indexOf(stepForPath(issues[0]!.path)));
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitSellerApplication(toSubmission(values));

        if (result.success) {
          posthog.capture("seller_application_submitted", {
            business_type: values.businessType,
            fulfillment_model: values.model,
          });
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
          if (serverIssues[0]) {
            goTo(ONBOARDING_STEPS.indexOf(stepForPath(serverIssues[0].path)));
          }
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
    goTo(0);
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("authenticationRequired")}</CardTitle>
          <CardDescription>{t("mustBeLoggedIn")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button className="w-full" asChild>
              <Link href="/auth?redirect=/onboarding">{t("signInToContinue")}</Link>
            </Button>
            <p className="text-center text-sm text-gray-600">
              {t("dontHaveAccount")}{" "}
              <Link
                href="/auth?redirect=/onboarding"
                className="font-semibold text-primary hover:text-primary/80"
              >
                {t("signUp")}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderStep = (current: OnboardingStep) => {
    switch (current) {
      case "business":
        return (
          <BusinessStep
            nameCheck={nameCheck}
            onNameEdited={() => setNameCheck("idle")}
            disabled={isPending}
          />
        );
      case "legal":
        return <LegalAddressStep />;
      case "model":
        return <ModelStep plans={plans} />;
      case "services":
        return <ServicesStep plans={plans} />;
      case "details":
        return <DetailsStep />;
      case "review":
        return <ReviewStep plans={plans} onEdit={(s) => goTo(ONBOARDING_STEPS.indexOf(s))} />;
      case "terms":
        return <TermsStep />;
    }
  };

  return (
    <Card ref={topRef} className="scroll-mt-4">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{t(`steps.${step}.title`)}</CardTitle>
            <p className="shrink-0 text-xs text-muted-foreground">
              {t("stepOf", { current: stepIndex + 1, total: ONBOARDING_STEPS.length })}
            </p>
          </div>
          <CardDescription>{t(`steps.${step}.description`)}</CardDescription>
        </div>
        <Progress value={progress} />
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            id="onboarding-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (isLastStep) handleSubmit();
              else handleNext();
            }}
          >
            {renderStep(step)}
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {stepIndex > 0 && (
            <Button type="button" variant="outline" onClick={handleBack} disabled={isPending}>
              {t("back")}
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
          )}
          {draft.restored && stepIndex === 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={startOver}>
              <RotateCcw className="h-3.5 w-3.5" />
              {t("startOver")}
            </Button>
          )}
        </div>
        {!isLastStep ? (
          <Button type="submit" form="onboarding-form">
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            {t("next")}
          </Button>
        ) : (
          <Button type="submit" form="onboarding-form" disabled={isPending} size="lg">
            {isPending ? (
              <>
                <Spinner className="h-4 w-4" />
                {t("submitting")}
              </>
            ) : (
              t("submit")
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
