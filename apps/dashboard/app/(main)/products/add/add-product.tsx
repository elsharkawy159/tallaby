"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import { ChevronLeft, LoaderCircle, ChevronRight } from "lucide-react";
import { createProduct } from "@/actions/products";
import {
  addProductFormSchema,
  defaultValues,
  type AddProductFormData,
} from "./add-product.schema";
import { BasicInformationStep } from "./steps/basic-information-step";
import { PriceStockStep } from "./steps/price-stock-step";
import { SeoStep } from "./steps/seo-step";
import type { CategoryOption, BrandOption } from "./add-product.schema";

interface AddProductProps {
  categories: CategoryOption[];
  brands: BrandOption[];
}

const STEPS = [
  { id: 1, title: "Basic Information", key: "basic" },
  { id: 2, title: "Price and Stock", key: "priceStock" },
  { id: 3, title: "Search Engine", key: "seo" },
] as const;

export default function AddProduct({ categories, brands }: AddProductProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductFormSchema) as any,
    defaultValues: defaultValues as any,
    mode: "onChange",
  });

  const handleSubmit = (data: AddProductFormData) => {
    
    startTransition(async () => {
      try {
        const result = await createProduct(data);

        if (result.success) {
          toast.success("Product created successfully!");
          form.reset(defaultValues as any);
          router.push("/products");
        } else {
          toast.error(result.error || "Failed to create product");
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof AddProductFormData)[] = [];

    if (step === 1) {
      fieldsToValidate = [
        "title",
        "slug",
        "categoryId",
        "images",
      ] as (keyof AddProductFormData)[];
    } else if (step === 2) {
      fieldsToValidate = ["price.list", "price.final", "quantity"] as any;
    } else if (step === 3) {
      // SEO is optional, so no validation needed
      return true;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else if (!isValid) {
      toast.error("Please fill in all required fields");
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
        toast.error("Please complete the current step first");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      {/* Step Indicator */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4 flex-1">
              <button
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`flex items-center gap-2 ${
                  currentStep === step.id
                    ? "text-primary font-semibold"
                    : currentStep > step.id
                      ? "text-gray-600"
                      : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep === step.id
                      ? "border-primary bg-primary text-white"
                      : currentStep > step.id
                        ? "border-gray-600 bg-gray-600 text-white"
                        : "border-gray-300 bg-white text-gray-400"
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
                <span className="text-sm hidden sm:inline">{step.title}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 ${
                    currentStep > step.id ? "bg-gray-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit as any)}
            className="space-y-6"
            id="add-product-form"
          >
            {/* Step Content using Activity API pattern */}
            {currentStep === 1 && (
              <BasicInformationStep categories={categories} brands={brands} />
            )}
            {currentStep === 2 && <PriceStockStep />}
            {currentStep === 3 && <SeoStep />}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="text-sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNext}
                  className="text-sm"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || !form.formState.isValid}
                  className="text-sm"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save Product"
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
