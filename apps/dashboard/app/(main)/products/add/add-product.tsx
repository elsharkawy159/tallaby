"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Form } from "@workspace/ui/components/form"
import { Separator } from "@workspace/ui/components/separator"
import { LoaderCircle } from "lucide-react"
import { createProduct } from "@/actions/products"
import {
  addProductFormSchema,
  defaultValues,
  type AddProductFormData,
  type SupportedLocale,
} from "./add-product.schema"
import {
  ADD_PRODUCT_STEPS,
  getStepValidationStatus,
  scrollToStepSection,
} from "./add-product.lib"
import { BasicInformationStep } from "./steps/basic-information-step"
import { PriceStockStep } from "./steps/price-stock-step"
import { SeoStep } from "./steps/seo-step"
import type { CategoryOption, BrandOption } from "./add-product.schema"
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib"
import { cn } from "@/lib/utils"

interface AddProductProps {
  categories: CategoryOption[];
  brands: BrandOption[];
  sellerPricing: SellerPricingSettings;
}

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  ar: "العربية",
}

export default function AddProduct({ categories, brands, sellerPricing }: AddProductProps) {
  const [isPending, startTransition] = useTransition()
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>("en")
  const router = useRouter()
  const tToast = useTranslations("toast")

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductFormSchema) as any,
    defaultValues: defaultValues as any,
    mode: "onChange",
    shouldUnregister: false,
  })

  const { errors, isValid } = form.formState

  const handleSubmit = (data: AddProductFormData) => {
    startTransition(async () => {
      try {
        const result = await createProduct(data);

        if (result.success) {
          toast.success(tToast("productCreatedSuccessfully"));
          form.reset(defaultValues as any);
          router.push("/products");
        } else {
          toast.error(result.error || tToast("failedToCreateProduct"));
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error(tToast("somethingWentWrong"));
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/30 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="container px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-gray-900">Add Product</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              Content language
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
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          {/* Vertical stepper */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav className="flex flex-col">
              {ADD_PRODUCT_STEPS.map((step, index) => {
                const status = getStepValidationStatus(
                  step.id,
                  form.formState,
                  form.getFieldState
                );

                return (
                  <div key={step.id} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => scrollToStepSection(step.key)}
                      className={cn(
                        "flex items-center gap-3 text-left py-2",
                        status === "valid" && "text-gray-600",
                        status === "error" && "text-red-600",
                        status === "default" && "text-gray-400"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 text-sm font-medium",
                          status === "valid" &&
                            "border-gray-600 bg-gray-600 text-white",
                          status === "error" &&
                            "border-red-500 bg-red-500 text-white",
                          status === "default" &&
                            "border-gray-300 bg-white text-gray-400"
                        )}
                      >
                        {status === "valid" ? (
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
                      <span className="text-sm font-medium">{step.title}</span>
                    </button>
                    {index < ADD_PRODUCT_STEPS.length - 1 && (
                      <div
                        className={cn(
                          "ml-4 w-0.5 h-6",
                          status === "valid" ? "bg-gray-600" : "bg-gray-300"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* Form content */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit as any)}
              className="space-y-8"
              id="add-product-form"
            >
              <section id="step-basic" className="scroll-mt-28">
                <BasicInformationStep
                  categories={categories}
                  brands={brands}
                  sellerPricing={sellerPricing}
                  activeLocale={activeLocale}
                />
              </section>

              <Separator />

              <section id="step-priceStock" className="scroll-mt-28">
                <PriceStockStep
                  sellerPricing={sellerPricing}
                  activeLocale={activeLocale}
                />
              </section>

              <Separator />

              <section id="step-seo" className="scroll-mt-28">
                <SeoStep activeLocale={activeLocale} />
              </section>
            </form>
          </Form>
        </div>
      </div>

      {/* Fixed bottom save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="px-6 py-4 flex items-center justify-end container">
          <Button
            type="submit"
            form="add-product-form"
            disabled={isPending || !isValid}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Product"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
