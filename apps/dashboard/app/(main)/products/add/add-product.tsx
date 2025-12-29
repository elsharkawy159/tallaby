"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import Link from "next/link";
import { ChevronLeft, LoaderCircle } from "lucide-react";
import { createProduct } from "@/actions/products";
import {
  addProductFormSchema,
  defaultValues,
  type AddProductFormData,
} from "./add-product.schema";
import {
  BasicInformationSection,
  PricingSection,
  InventorySection,
  ShippingSection,
  VariantsSection,
  SeoSection,
} from "./add-product.chunks";

import type { CategoryOption, BrandOption } from "./add-product.schema";

interface AddProductProps {
  categories: CategoryOption[];
  brands: BrandOption[];
}

export default function AddProduct({ categories, brands }: AddProductProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductFormSchema),
    defaultValues: defaultValues as AddProductFormData,
    mode: "onChange",
  });

  const handleSubmit = (data: AddProductFormData) => {
    startTransition(async () => {
      try {
        const result = await createProduct(data);

        if (result.success) {
          toast.success("Product created successfully!");
          form.reset(defaultValues as AddProductFormData);
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

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-sm hover:bg-gray-100"
            >
              <Link href="/products">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-base font-semibold">Add product</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => form.reset(defaultValues as AddProductFormData)}
              className="text-sm"
            >
              Discard
            </Button>
            <Button
              type="submit"
              form="add-product-form"
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
                "Save"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
            id="add-product-form"
          >
              {/* Main Content */}
                <BasicInformationSection
                  categories={categories}
                  brands={brands}
                />
                <PricingSection />
                <InventorySection />
                <ShippingSection />
                <VariantsSection />
                <SeoSection /> 

          </form>
        </Form>
      </div>
    </div>
  );
}
