"use client";

import { useState, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
import { submitSellerApplication } from "@/app/(main)/become-seller/_components/become-seller.server";
import {
  BUSINESS_TYPE_OPTIONS,
  COUNTRY_OPTIONS,
} from "@/app/(main)/become-seller/_components/become-seller.types";
import { useAuthDialog } from "@/hooks/use-auth-dialog";
import { Input } from "@workspace/ui/components";

interface OnboardingFormClientProps {
  user: any;
}

const steps = [
  {
    title: "Business Information",
    description: "Tell us about your business",
    fields: [
      "businessName",
      // "displayName",
      "businessType",
      "description",
      "logoUrl",
      "supportEmail",
      "supportPhone",
    ],
  },
  {
    title: "Legal & Contact Details",
    description: "Provide your business legal address and registration details",
    fields: [
      "legalAddress.street",
      "legalAddress.city",
      "legalAddress.state",
      "legalAddress.postalCode",
      "legalAddress.country",
      // "registrationNumber",
      // "taxId",
    ],
  },
];

export function OnboardingFormClient({ user }: OnboardingFormClientProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const { open: openAuthDialog } = useAuthDialog();

  const currentForm = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const form = useForm<SellerApplicationFormData>({
    resolver: zodResolver(sellerApplicationSchema),
    defaultValues: sellerApplicationDefaults,
    mode: "onChange",
  });

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
      toast.error("You must be logged in to create a seller account");
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
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            You must be logged in to create a seller account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button className="w-full" asChild>
              <Link href="/auth?redirect=/onboarding">Sign In to Continue</Link>
            </Button>
            <p className="text-sm text-center text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/auth?redirect=/onboarding"
                className="font-semibold text-primary hover:text-primary/80"
              >
                Sign up
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
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Logo</FormLabel>
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
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter your business name"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SelectInput
                name="businessType"
                label="Business Type"
                placeholder="Select your business type"
                options={BUSINESS_TYPE_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
                required
                className="h-1"
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
              label="Business Description"
              placeholder="Tell customers about your business (optional)"
              rows={4}
              validation={{ maxLength: 1000 }}
              showCharacterCount
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                form={form}
                name="supportEmail"
                label="Support Email"
                type="email"
                placeholder="Enter your business email"
                required
              />

              <TextInput
                form={form}
                name="supportPhone"
                label="Support Phone"
                type="tel"
                placeholder="Enter support phone (optional)"
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
              label="Street Address"
              placeholder="Street address"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                form={form}
                name="legalAddress.city"
                label="City"
                placeholder="Enter city"
                required
              />

              <TextInput
                form={form}
                name="legalAddress.state"
                label="State/Province"
                placeholder="Enter state/province"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                form={form}
                name="legalAddress.postalCode"
                label="Postal/ZIP Code"
                placeholder="Enter postal code"
              />

              <div className="w-full">
                <SelectInput
                  name="legalAddress.country"
                  label="Country"
                  placeholder="Select country"
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
              Step {currentStep + 1} of {steps.length}
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
              className="space-y-6"
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
            Back
          </Button>
        ) : (
          <div />
        )}
        {!isLastStep ? (
          <Button type="button" onClick={handleNext}>
            Next
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
                Creating Seller Account...
              </>
            ) : (
              "Create Seller Account"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
