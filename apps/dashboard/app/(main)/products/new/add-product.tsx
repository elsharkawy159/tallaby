"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft, Save, Trash2, Upload, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { FormField } from "@workspace/ui/components/forms/form-field";
import { FormWrapper } from "@workspace/ui/components/forms/form-wrapper";
import {
  addProductFormSchema,
  defaultValues,
  type AddProductFormData,
  type CategoryOption,
  type BrandOption,
} from "./add-product.schema";
import { addProductAction } from "./add-product.server";
import { toast } from "sonner";

interface AddProductProps {
  categories?: CategoryOption[];
  brands?: BrandOption[];
}

export default function AddProduct({ categories, brands }: AddProductProps) {
  const router = useRouter();
  const [isSavingDraft, setIsSavingDraft] = React.useState(false);

  const handleSubmit = async (data: AddProductFormData) => {
    try {
      const result = await addProductAction(data);

      if (result.success) {
        toast("Success");
        router.push("/products");
      } else {
        toast(result.message);
      }
    } catch (error) {
      toast("Something went wrong. Please try again.");
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      // This would need access to form values - we'll implement this differently
      toast("Draft saved");
    } catch (error) {
      toast("Failed to save draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const conditionOptions = [
    { value: "new", label: "New" },
    { value: "renewed", label: "Renewed" },
    { value: "refurbished", label: "Refurbished" },
    { value: "used_like_new", label: "Used - Like New" },
    { value: "used_very_good", label: "Used - Very Good" },
    { value: "used_good", label: "Used - Good" },
    { value: "used_acceptable", label: "Used - Acceptable" },
  ];

  const fulfillmentOptions = [
    { value: "seller_fulfilled", label: "Seller Fulfilled" },
    { value: "platform_fulfilled", label: "Platform Fulfilled" },
    { value: "fba", label: "FBA" },
    { value: "digital", label: "Digital" },
  ];

  const taxClassOptions = [
    { value: "standard", label: "Standard Tax" },
    { value: "reduced", label: "Reduced Tax" },
    { value: "zero", label: "Zero Tax" },
    { value: "exempt", label: "Tax Exempt" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left side - Back button and title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="h-10 text-sm hover:bg-transparent"
            >
              <ArrowLeft className="h-5 w-5" />
              Cancel
            </Button>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
            >
              <Save className="h-4 w-4" />
              Save as Draft
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <FormWrapper
          schema={addProductFormSchema}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          submitText="Create Product"
          showCard={false}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="mb-6">
                <FormField
                  name="images"
                  label="Product Images"
                  type="image"
                  multiple
                  description="Upload up to 10 images for your product"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-gray-200">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    name="title"
                    label="Product's Name"
                    type="text"
                    placeholder="White Blouse"
                    required
                  />
                  <FormField
                    name="slug"
                    label="Product's Slug"
                    type="text"
                    placeholder="white-blouse"
                    disabled
                    helpText="Auto-generated from product name"
                  />
                </div>

                <FormField
                  name="description"
                  label="Description"
                  type="textarea"
                  placeholder="Lorem ipsum dolor sit amet consectetur. Nulla eu elit sem ac massa vestibulum gravida viverra. Sit maecenas nullam neque ac mi ac lorem nec id. Ultricies commodo id platea gravida eget nulla vitae. Tempus dictumst et tellus amet in ullamcorper."
                  rows={6}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    name="basePrice"
                    label="Amount"
                    type="currency"
                    placeholder="500"
                    required
                    showCurrency
                  />
                  <FormField
                    name="salePrice"
                    label="Offer"
                    type="currency"
                    placeholder="350"
                    showCurrency
                  />
                  <FormField
                    name="stockQuantity"
                    label="Pieces"
                    type="number"
                    placeholder="7"
                    min={0}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories && brands && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  name="mainCategoryId"
                  label="Category"
                  type="select"
                  placeholder="Select category"
                  options={categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  }))}
                  required
                />
                <FormField
                  name="brandId"
                  label="Sub category"
                  type="select"
                  placeholder="Select sub category"
                  options={brands.map((brand) => ({
                    value: brand.id,
                    label: brand.name,
                  }))}
                />
              </div>
            )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-3 space-y-6">
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="mt-6 space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                      <span>penatibus</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Settings */}
            <Card className="border-gray-200">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Product Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    name="condition"
                    label="Condition"
                    type="select"
                    placeholder="Select condition"
                    options={conditionOptions}
                  />
                  <FormField
                    name="fulfillmentType"
                    label="Fulfillment"
                    type="select"
                    placeholder="Select fulfillment"
                    options={fulfillmentOptions}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    name="handlingTime"
                    label="Handling Time (days)"
                    type="number"
                    placeholder="1"
                    min={1}
                  />
                  <FormField
                    name="taxClass"
                    label="Tax Class"
                    type="select"
                    placeholder="Select tax class"
                    options={taxClassOptions}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    name="isActive"
                    label="Active Product"
                    type="switch"
                  />
                  <FormField
                    name="isBestSeller"
                    label="Best Seller"
                    type="switch"
                  />
                  <FormField
                    name="isPlatformChoice"
                    label="Platform Choice"
                    type="switch"
                  />
                  <FormField
                    name="isAdult"
                    label="Adult Content"
                    type="switch"
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card className="border-gray-200">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  SEO & Marketing
                </h3>

                <FormField
                  name="metaTitle"
                  label="Meta Title"
                  type="text"
                  placeholder="SEO title for search engines"
                />

                <FormField
                  name="metaDescription"
                  label="Meta Description"
                  type="textarea"
                  placeholder="SEO description for search engines"
                  rows={3}
                />

                <FormField
                  name="searchKeywords"
                  label="Search Keywords"
                  type="text"
                  placeholder="Comma-separated keywords"
                />
              </CardContent>
            </Card>
          </div>
        </FormWrapper>
      </div>
    </div>
  );
}
