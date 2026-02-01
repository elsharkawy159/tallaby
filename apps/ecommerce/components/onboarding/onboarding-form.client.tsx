"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@workspace/ui/components/form";
import {
  TextInput,
  TextareaInput,
  SelectInput,
} from "@workspace/ui/components/inputs";
import { Progress } from "@workspace/ui/components/progress";
import { Spinner } from "@workspace/ui/components/spinner";
import { LogoUploader } from "./logo-uploader";

import {
  sellerApplicationSchema,
  sellerApplicationDefaults,
  type SellerApplicationFormData,
} from "@/app/(main)/become-seller/_components/become-seller.dto";
import {
  checkBusinessNameAvailability,
  submitSellerApplication,
} from "@/app/(main)/become-seller/_components/become-seller.server";
import {
  BUSINESS_TYPE_OPTIONS,
  COUNTRY_OPTIONS,
} from "@/app/(main)/become-seller/_components/become-seller.types";
import { useAuthDialog } from "@/hooks/use-auth-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@workspace/ui/components";

interface OnboardingFormClientProps {
  user: any;
}

export function OnboardingFormClient({ user }: OnboardingFormClientProps) {
  const t = useTranslations("onboarding");
  const tToast = useTranslations("toast");
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [businessNameCheck, setBusinessNameCheck] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const router = useRouter();
  const { open: openAuthDialog } = useAuthDialog();

  const steps = [
    {
      title: t("businessInformation"),
      description: t("tellUsAboutBusiness"),
      fields: [
        "businessName",
        "businessType",
        "description",
        "logoUrl",
        "supportEmail",
        "supportPhone",
      ],
    },
    {
      title: t("legalContactDetails"),
      description: t("provideBusinessLegalAddress"),
      fields: [
        "legalAddress.street",
        "legalAddress.city",
        "legalAddress.state",
        "legalAddress.postalCode",
        "legalAddress.country",
      ],
    },
  ];

  const currentForm = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const form = useForm<SellerApplicationFormData>({
    resolver: zodResolver(sellerApplicationSchema),
    defaultValues: sellerApplicationDefaults,
    mode: "onChange",
  });

  const businessName = form.watch("businessName");
  const debouncedBusinessName = useDebounce(businessName?.trim() ?? "", 400);
  const checkInFlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (debouncedBusinessName.length < 2) {
      setBusinessNameCheck("idle");
      if (form.formState.errors.businessName?.type === "manual") {
        form.clearErrors("businessName");
      }
      return;
    }

    let cancelled = false;
    checkInFlightRef.current = debouncedBusinessName;
    setBusinessNameCheck("checking");

    checkBusinessNameAvailability(debouncedBusinessName).then((available) => {
      if (cancelled || checkInFlightRef.current !== debouncedBusinessName)
        return;
      checkInFlightRef.current = null;
      setBusinessNameCheck(available ? "available" : "taken");
      if (!available) {
        form.setError("businessName", {
          type: "manual",
          message: t("businessNameTaken"),
        });
      } else {
        form.clearErrors("businessName");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedBusinessName, t, form]);

  const handleNext = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();

    const currentFields = steps[currentStep]?.fields as string[];
    const isValid = await form.trigger(currentFields as any);

    if (isValid && !isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = (data: SellerApplicationFormData) => {
    if (!user) {
      toast.error(t("youMustBeLoggedIn"));
      openAuthDialog("signin");
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitSellerApplication(data);

        if (result.success) {
          toast.success(result.message);
          form.reset();
          router.push("/");
          router.refresh();
        } else {
          toast.error(result.message);

          if (result.errors) {
            Object.entries(result.errors).forEach(([field, messages]) => {
              form.setError(field as keyof SellerApplicationFormData, {
                type: "server",
                message: messages[0],
              });
            });
          }
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error(tToast("unexpectedError"));
      }
    });
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
              <Link href="/auth?redirect=/onboarding">
                {t("signInToContinue")}
              </Link>
            </Button>
            <p className="text-sm text-center text-gray-600">
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

  const renderCurrentStepContent = () => {
    switch (currentStep) {
      case 0: {
        return (
          <div className="md:space-y-6 space-y-4">
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("businessLogo")}</FormLabel>
                  <FormControl>
                    <LogoUploader
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("businessName")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder={t("enterBusinessName")}
                          required
                          className="ltr:pr-9 rtl:pl-9"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setBusinessNameCheck("idle");
                            if (
                              form.formState.errors.businessName?.type ===
                              "manual"
                            ) {
                              form.clearErrors("businessName");
                            }
                          }}
                        />
                        <span className="pointer-events-none absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2">
                          {businessNameCheck === "checking" && (
                            <Spinner className="h-4 w-4 text-muted-foreground" />
                          )}
                          {businessNameCheck === "available" && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                          {businessNameCheck === "taken" && (
                            <X className="h-4 w-4 text-destructive" />
                          )}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SelectInput
                name="businessType"
                label={t("businessType")}
                placeholder={t("selectBusinessType")}
                options={BUSINESS_TYPE_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: t(
                    `businessType_${opt.value}` as "businessType_individual"
                  ),
                }))}
                required
              />
            </div>

            {/* <TextInput
              form={form}
              name="displayName"
              label="Display Name"
              placeholder="How your store appears to customers (optional)"
              description="Leave empty to use business name"
            /> */}

            <TextareaInput
              form={form}
              name="description"
              label={t("businessDescription")}
              placeholder={t("tellCustomersAboutBusiness")}
              rows={4}
              validation={{ maxLength: 1000 }}
              showCharacterCount
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                form={form}
                name="supportEmail"
                label={t("supportEmail")}
                type="email"
                placeholder={t("enterBusinessEmail")}
                required
              />

              <TextInput
                form={form}
                name="supportPhone"
                label={t("supportPhone")}
                type="tel"
                placeholder={t("enterSupportPhone")}
              />
            </div>
          </div>
        );
      }

      case 1: {
        return (
          <div className="space-y-6">
            <TextInput
              form={form}
              name="legalAddress.street"
              label={t("streetAddress")}
              placeholder={t("streetAddressPlaceholder")}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                form={form}
                name="legalAddress.city"
                label={t("city")}
                placeholder={t("enterCity")}
                required
              />

              <TextInput
                form={form}
                name="legalAddress.state"
                label={t("stateProvince")}
                placeholder={t("enterStateProvince")}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                form={form}
                name="legalAddress.postalCode"
                label={t("postalZipCode")}
                placeholder={t("enterPostalCode")}
              />

              <div className="w-full">
                <SelectInput
                  name="legalAddress.country"
                  label={t("country")}
                  placeholder={t("selectCountry")}
                  disabled
                  options={COUNTRY_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  required
                />
              </div>
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                form={form}
                name="registrationNumber"
                label="Registration Number"
                placeholder="Business registration number (optional)"
              />

              <TextInput
                form={form}
                name="taxId"
                label="Tax ID"
                placeholder="Tax identification number (optional)"
              />
            </div> */}
          </div>
        );
      }

      default: {
        return null;
      }
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle>{currentForm?.title}</CardTitle>
            <p className="text-muted-foreground text-xs">
              {t("stepOf", {
                current: currentStep + 1,
                total: steps.length,
              })}
            </p>
          </div>
          <CardDescription>{currentForm?.description}</CardDescription>
        </div>
        <Progress value={progress} />
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <Form {...form}>
            <form
              id="onboarding-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="md:space-y-6 space-y-4"
            >
              {renderCurrentStepContent()}
            </form>
          </Form>
        </FormProvider>
      </CardContent>
      <CardFooter className="flex justify-between">
        {currentStep > 0 ? (
          <Button type="button" variant="ghost" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4" />
            {t("back")}
          </Button>
        ) : (
          <div />
        )}
        {!isLastStep ? (
          <Button type="button" onClick={handleNext}>
            {t("next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            form="onboarding-form"
            disabled={isPending}
            size="lg"
          >
            {isPending ? (
              <>
                <Spinner className="h-4 w-4" />
                {t("creatingSellerAccount")}
              </>
            ) : (
              t("createSellerAccount")
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
