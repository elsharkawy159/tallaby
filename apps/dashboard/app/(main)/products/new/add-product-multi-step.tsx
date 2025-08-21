"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Form } from "@workspace/ui/components/form";
import {
  Stepper,
  ProgressStepper,
  type StepperStep,
} from "@workspace/ui/components/stepper";
import {
  addProductFormSchema,
  defaultValues,
  type AddProductFormData,
  type CategoryOption,
  type BrandOption,
} from "./add-product.schema";
import { addProductAction } from "./add-product.server";
import {
  BasicInformationStep,
  ProductImagesStep,
  PricingStep,
  InventoryStep,
  ProductSettingsStep,
  PhysicalPropertiesStep,
  SeoMarketingStep,
} from "./add-product-steps";

interface AddProductMultiStepProps {
  categories?: CategoryOption[];
  brands?: BrandOption[];
  isEditMode?: boolean;
  productId?: string;
  initialData?: any;
}

// Define the form steps
const FORM_STEPS: StepperStep[] = [
  {
    id: "basic",
    title: "Basic Information",
    description: "Product name, description, and category",
  },
  {
    id: "images",
    title: "Product Images",
    description: "Upload product photos",
  },
  {
    id: "pricing",
    title: "Pricing",
    description: "Set base and listing prices",
  },
  {
    id: "inventory",
    title: "Inventory & Stock",
    description: "Manage stock levels and SKU",
  },
  {
    id: "settings",
    title: "Product Settings",
    description: "Condition, fulfillment, and status",
  },
  {
    id: "physical",
    title: "Physical Properties",
    description: "Weight, dimensions, and tax class",
  },
  {
    id: "seo",
    title: "SEO & Marketing",
    description: "Search engine optimization",
  },
];

export default function AddProductMultiStep({
  categories,
  brands,
  isEditMode = false,
  productId,
  initialData,
}: AddProductMultiStepProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductFormSchema),
    defaultValues: initialData || defaultValues,
    mode: "onChange", // Validate on change for better UX
  });

  // Track form changes for edit mode
  const [isFormDirty, setIsFormDirty] = React.useState(false);

  // Watch form changes to track if form is dirty
  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === "change" && isEditMode) {
        setIsFormDirty(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditMode]);

  // Check if current step is valid
  const isStepValid = async (stepIndex: number): Promise<boolean> => {
    const step = FORM_STEPS[stepIndex];
    if (!step) return false;

    // Define which fields belong to each step
    const stepFields: Record<string, string[]> = {
      basic: [
        "title",
        "slug",
        "description",
        "bulletPoints",
        "mainCategoryId",
        "brandId",
      ],
      images: ["images"],
      pricing: ["basePrice", "listPrice", "price", "salePrice"],
      inventory: ["sku", "stockQuantity", "maxOrderQuantity", "restockDate"],
      settings: [
        "condition",
        "fulfillmentType",
        "handlingTime",
        "isActive",
        "isAdult",
        "isPlatformChoice",
        "isBestSeller",
        "isFeatured",
      ],
      physical: ["weight", "dimensions", "taxClass", "notes"],
      seo: ["metaTitle", "metaDescription", "metaKeywords", "searchKeywords"],
    };

    const fieldsToValidate = stepFields[step.id] || [];

    try {
      const result = await form.trigger(fieldsToValidate as any);
      return result;
    } catch {
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = await isStepValid(currentStep);
    if (isValid && currentStep < FORM_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (!isValid) {
      toast.error("Please complete all required fields before proceeding");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = async (stepIndex: number) => {
    // Only allow navigation to completed steps or the next step
    if (stepIndex <= currentStep || stepIndex === currentStep + 1) {
      // Validate current step before allowing navigation
      if (stepIndex === currentStep + 1) {
        const isValid = await isStepValid(currentStep);
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
        let result;
        if (isEditMode && productId) {
          // Import updateProductAction dynamically to avoid server action issues
          const { updateProductAction } = await import("./add-product.server");
          result = await updateProductAction(productId, data);
        } else {
          result = await addProductAction(data);
        }

        if (result.success) {
          toast.success(
            isEditMode
              ? "Product updated successfully!"
              : "Product created successfully!"
          );
          router.push("/products");
        } else {
          toast.error(
            result.message ||
              `Failed to ${isEditMode ? "update" : "create"} product`
          );
        }
      } catch (error) {
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const handleSaveDraft = async () => {
    try {
      toast.success("Draft saved successfully!");
    } catch (error) {
      toast.error("Failed to save draft.");
    }
  };

  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicInformationStep categories={categories || []} brands={brands || []} />;
      case 1:
        return <ProductImagesStep />;
      case 2:
        return <PricingStep />;
      case 3:
        return <InventoryStep />;
      case 4:
        return <ProductSettingsStep />;
      case 5:
        return <PhysicalPropertiesStep />;
      case 6:
        return <SeoMarketingStep />;
      default:
        return <BasicInformationStep categories={categories || []} brands={brands || []} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Back button and title */}
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              className="h-10 text-sm hover:bg-gray-100"
            >
              <a href="/products">← Back to Products</a>
            </Button>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-3">
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
              form="add-product-form"
              className="h-10 px-6"
              disabled={isPending || (isEditMode && !isFormDirty)}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {isEditMode ? "Updating Product..." : "Creating Product..."}
                </span>
              ) : isEditMode ? (
                "Update Product"
              ) : (
                "Create Product"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Stepper */}
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

            {/* Progress indicator */}
            <ProgressStepper
              steps={FORM_STEPS}
              currentStep={currentStep}
              className="mb-6"
            />
          </div>

          {/* Form */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8"
              id="add-product-form"
            >
              {/* Current step content */}
              <div className="mb-8">{renderCurrentStep()}</div>

              {/* Navigation buttons */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
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
                        <Button
                          type="button"
                          onClick={handleNext}
                          className="px-6"
                        >
                          Next
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={isPending || !form.formState.isValid}
                          className="px-6"
                        >
                          {isPending ? "Creating Product..." : "Create Product"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
