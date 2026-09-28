"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import { ChevronLeft, LoaderCircle, ChevronRight } from "lucide-react";
import { updateProduct } from "@/actions/products";
import {
  addProductFormSchema,
  type AddProductFormData,
  type SupportedLocale,
} from "../../add/add-product.schema";
import { BasicInformationStep } from "../../add/steps/basic-information-step";
import { PriceStockStep } from "../../add/steps/price-stock-step";
import { SeoStep } from "../../add/steps/seo-step";
import type { CategoryOption, BrandOption } from "../../add/add-product.schema";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import { cn } from "@/lib/utils";
import { useLocalizedResolver } from "@/lib/i18n/localized-resolver";

const STEPS = [
  // title is a "productForm.steps" key
  { id: 1, title: "basic", key: "basic" },
  { id: 2, title: "priceStock", key: "priceStock" },
  { id: 3, title: "seo", key: "seo" },
] as const;

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  ar: "العربية",
};

interface EditProductProps {
  productId: string;
  defaultValues: AddProductFormData;
  categories: CategoryOption[];
  brands: BrandOption[];
  sellerPricing: SellerPricingSettings;
}

export function EditProduct({
  productId,
  defaultValues,
  categories,
  brands,
  sellerPricing,
}: EditProductProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>("en");
  const router = useRouter();
  const tToast = useTranslations("toast");
  const t = useTranslations("productForm");
  const resolver = useLocalizedResolver(zodResolver(addProductFormSchema) as any);

  const form = useForm<AddProductFormData>({
    resolver: resolver as any,
    defaultValues: defaultValues as any,
    mode: "onChange",
    shouldUnregister: false,
  });

  const handleSubmit = (data: AddProductFormData) => {
    startTransition(async () => {
      try {
        const result = await updateProduct(productId, {
          ...data,
          quantity: String(data.quantity),
          handlingTime: String(data.handlingTime),
        } as unknown as Parameters<typeof updateProduct>[1]);

        if (result.success) {
          toast.success(tToast("productUpdatedSuccessfully"));
          router.push("/products");
        } else {
          toast.error(result.error || tToast("failedToUpdateProduct"));
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error(tToast("somethingWentWrong"));
      }
    });
  };

  const validateStep = async (step: number): Promise<boolean> => {
    if (step === 1) {
      const result = await form.trigger([
        "localized.en.title",
        "localized.en.slug",
        "localized.ar.title",
        "categoryId",
        "images",
      ]);
      return result;
    }
    if (step === 2) {
      const result = await form.trigger([
        "price.list",
        "price.final",
        "quantity",
      ]);
      return result;
    }
    return true;
  };

  const handleNext = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else if (!isValid) {
      toast.error(tToast("pleaseFillRequiredFields"));
    }
  };

  const handlePrevious = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = async (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    } else if (step > currentStep) {
      const isValid = await validateStep(currentStep);
      if (isValid) {
        setCurrentStep(step);
      } else {
        toast.error(tToast("pleaseCompleteCurrentStep"));
      }
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-16 z-20 bg-card border-b border-border shadow-sm">
        <div className="container px-6 py-4">
          <div className="flex items-center gap-4">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-4",
                  index < STEPS.length - 1 && "flex-1"
                )}
              >
                <button
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  className={`flex items-center gap-2 ${
                    currentStep === step.id
                      ? "text-primary font-semibold"
                      : currentStep > step.id
                        ? "text-muted-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      currentStep === step.id
                        ? "border-primary bg-primary text-white"
                        : currentStep > step.id
                          ? "border-muted-foreground bg-muted-foreground text-background"
                          : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className="text-sm hidden sm:inline">
                    {t(`steps.${step.title}`)}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      currentStep > step.id ? "bg-muted-foreground" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-foreground">
              {t("contentLanguage")}
            </span>
            <div className="flex items-center gap-1">
              {(["en", "ar"] as const).map((loc) => (
                <Button
                  key={loc}
                  type="button"
                  variant={activeLocale === loc ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveLocale(loc)}
                  className="min-w-[4rem]"
                >
                  {LOCALE_LABELS[loc]}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit as any)}
            className="space-y-6"
            id="edit-product-form"
          >
            {currentStep === 1 && (
              <BasicInformationStep
                categories={categories}
                brands={brands}
                sellerPricing={sellerPricing}
                activeLocale={activeLocale}
              />
            )}
            {currentStep === 2 && (
              <PriceStockStep
                sellerPricing={sellerPricing}
                activeLocale={activeLocale}
              />
            )}
            {currentStep === 3 && <SeoStep activeLocale={activeLocale} />}
          </form>
        </Form>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-10 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="px-6 py-4 flex items-center gap-6 justify-end container">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
            {t("previous")}
          </Button>
          {currentStep < STEPS.length ? (
            <Button type="button" onClick={handleNext}>
              {t("next")}
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>
          ) : (
            <Button
              type="submit"
              form="edit-product-form"
              disabled={isPending || !form.formState.isValid}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  {t("saving")}
                </span>
              ) : (
                t("saveChanges")
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
