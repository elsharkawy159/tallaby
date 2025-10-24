"use client";

import React, { MouseEvent, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import { Stepper, ProgressStepper } from "@workspace/ui/components/stepper";
import type { AddProductFormData } from "../new/add-product.schema";
import type { CategoryOption, BrandOption } from "../new/add-product.schema";

import { FORM_STEPS } from "../new/add-product-multi-step.constants";
import { isStepValid } from "../new/add-product-multi-step.lib";
import { useAddProductForm } from "../new/add-product-multi-step.hooks";
import { updateProduct } from "@/actions/products";
import {
  BasicInformationStep,
  ListingStep,
  VariantsSeoStep,
} from "../new/add-product-steps";
import Link from "next/link";
import { ChevronLeft, LoaderCircle } from "lucide-react";

interface ProductEditFormProps {
  productId: string;
  initialData: Partial<AddProductFormData>;
  categories: CategoryOption[];
  brands: BrandOption[];
}

export function ProductEditForm({
  productId,
  initialData,
  categories,
  brands,
}: ProductEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Use custom hook for form management with initial data
  const { form, isFormDirty, setFormData, defaultValues } = useAddProductForm({
    initialData,
    isEditMode: true,
  });

  // Local state for current step
  const [currentStep, setCurrentStep] = React.useState(0);

  const handleNext = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const isValid = await isStepValid(currentStep, form);
    if (isValid && currentStep < FORM_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      const formValues = form.getValues();
      setFormData(formValues);
    } else if (!isValid) {
      toast.error("Please complete all required fields before proceeding");
    }
  };

  const handlePrevious = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
    }
  };

  const handleStepClick = async (stepIndex: number, e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Only allow navigation to completed steps or the next step
    if (stepIndex <= currentStep || stepIndex === currentStep + 1) {
      // Validate current step before allowing navigation
      if (stepIndex === currentStep + 1) {
        const isValid = await isStepValid(currentStep, form);
        if (!isValid) {
          toast.error("Please complete all required fields before proceeding");
          return;
        }
      }
      setCurrentStep(stepIndex);
    } else {
      toast.error("Please complete the current step before proceeding");
    }
  };

  const handleSubmit = (data: AddProductFormData) => {
    startTransition(async () => {
      try {
        const result = await updateProduct(productId, data as any);

        if (result.success) {
          toast.success("Product updated successfully!");
          router.push("/products");
          setFormData({});
        } else {
          toast.error(result.error || "Failed to update product");
        }
      } catch (error) {
        console.error("Update error:", error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const handleSaveDraft = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      toast.success("Draft saved successfully!");
    } catch (error) {
      toast.error("Failed to save draft.");
    }
  };

  const handleClearForm = () => {
    form.reset(initialData);
    setCurrentStep(0);
    setFormData(initialData);
    toast.success("Form reset to original values!");
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInformationStep
            categories={categories || []}
            brands={brands || []}
          />
        );
      case 1:
        return <ListingStep />;
      case 2:
        return <VariantsSeoStep />;
      default:
        return (
          <BasicInformationStep
            categories={categories || []}
            brands={brands || []}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 pb-80">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              className="h-10 text-sm hover:bg-gray-100"
            >
              <Link href="/products">
                <ChevronLeft className="h-4 w-4" />
                Back to Products
              </Link>
            </Button>
            <div className="text-sm text-gray-600">
              Editing: {initialData.title || "Product"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearForm}
              className="h-10 flex items-center"
            >
              Reset Form
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              className="h-10 flex items-center"
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              form="edit-product-form"
              className="h-10 px-6"
              disabled={isPending || !isFormDirty}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="animate-spin" />
                  Updating Product...
                </span>
              ) : (
                "Update Product"
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-8">
          <Stepper
            steps={FORM_STEPS}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            variant="default"
            size="sm"
            className="mb-6"
            allowStepClick={true}
          />

          <ProgressStepper
            steps={FORM_STEPS}
            currentStep={currentStep}
            className="mb-6"
          />
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            onKeyDown={(e) => {
              // Prevent form submission on Enter key when not on final step
              if (e.key === "Enter" && currentStep < FORM_STEPS.length - 1) {
                e.preventDefault();
              }
            }}
            className="space-y-8"
            id="edit-product-form"
          >
            <div className="mb-5 space-y-5">{renderCurrentStep()}</div>

            <div className="flex justify-between items-center p-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="px-6"
              >
                Previous
              </Button>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  Step {currentStep + 1} of {FORM_STEPS.length}
                </span>

                {currentStep < FORM_STEPS.length - 1 ? (
                  <Button type="button" onClick={handleNext} className="px-6">
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isPending || !form.formState.isValid}
                    className="px-6"
                  >
                    {isPending ? "Updating Product..." : "Update Product"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
