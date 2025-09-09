"use client";

import React from "react";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  TextInput,
  TextareaInput,
  SelectInput,
  CurrencyInput,
  ArrayInput,
  CategoryPopover,
} from "@workspace/ui/components";
import { ImageUpload } from "@/components/inputs/image-upload";
import {
  Package,
  Image as ImageIcon,
  Settings,
  Search,
  Truck,
} from "lucide-react";
import type {
  AddProductFormData,
  BrandOption,
  CategoryOption,
} from "./add-product.schema";
import { fulfillmentOptions, dimensionUnits } from "./add-product.schema";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from "@workspace/ui/components/form";
import slugify from "slugify";

// Basic Information Step
export const BasicInformationStep = ({
  categories,
  brands,
}: {
  categories: CategoryOption[];
  brands: BrandOption[];
}) => {
  const form = useFormContext<AddProductFormData>();

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (title) {
      const newSlug = slugify(title);
      form.setValue("slug", newSlug, { shouldValidate: true });
    }
  };

  return (
    <>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <ImageIcon className="h-5 w-5 mr-2 text-blue-600" />
            Product Images
          </CardTitle>
          <p className="text-sm text-gray-500">
            Upload high-quality images of your product
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="images"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormControl>
                  <ImageUpload
                    bucket="products"
                    value={field.value}
                    onChange={field.onChange}
                    form={form}
                    maxImages={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Package className="h-5 w-5 mr-2 text-blue-600" />
            Basic Information
          </CardTitle>
          <p className="text-sm text-gray-500">
            Essential product details and description
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              form={form}
              name="title"
              label="Product Name"
              placeholder="e.g., Wireless Bluetooth Headphone"
              required
              onBlur={handleTitleBlur}
            />

            <TextInput
              form={form}
              name="slug"
              label="Product Slug"
              placeholder="e.g., wireless-bluetooth-headphone"
              disabled
            />
          </div>

          <FormField
            name="description"
            render={({ field }) => (
              <TextareaInput
                {...field}
                label="Product Description"
                form={form}
                placeholder="Detailed description of your product, including features, benefits, and specifications..."
                rows={6}
              />
            )}
          />

          <FormField
            name="bulletPoints"
            render={({ field }) => (
              <ArrayInput
                {...field}
                label="Key Features"
                addButtonText="Add Feature"
                itemPlaceholder="Enter a key feature..."
                maxItems={10}
                description="Add up to 10 key product features"
              />
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories && (
              <FormField
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <CategoryPopover
                      categories={categories}
                      value={field.value}
                      onChange={field.onChange}
                      form={form}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {brands && (
              <FormField
                name="brandId"
                render={({ field }) => (
                  <SelectInput
                    {...field}
                    label="Brand"
                    placeholder="Select a brand"
                    options={brands.map((brand: BrandOption) => ({
                      value: brand.id,
                      label: brand.name,
                    }))}
                  />
                )}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// Product Settings Step
export const ListingStep = () => {
  const form = useFormContext<AddProductFormData>();

  // Auto-calculate final price when list price changes (10% commission)
  const listPrice = form.watch("price.list");
  const discountValue = form.watch("price.discountValue");
  const discountType = form.watch("price.discountType");

  React.useEffect(() => {
    const commissionRate = 0.1;
    const numericList = typeof listPrice === "number" ? listPrice : 0;
    let finalPrice = 0;

    if (numericList <= 0) {
      form.setValue("price.final", 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    // Apply discount if present
    let discountedPrice = numericList;
    if (discountValue && Number(discountValue) > 0) {
      if (discountType === "percent") {
        discountedPrice =
          numericList - (numericList * Number(discountValue)) / 100;
      } else if (discountType === "amount") {
        discountedPrice = numericList - Number(discountValue);
      }
      // Prevent negative price
      if (discountedPrice < 0) discountedPrice = 0;
    }

    // Add commission
    finalPrice = parseFloat(
      (discountedPrice * (1 + commissionRate)).toFixed(2)
    );

    form.setValue("price.final", finalPrice, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [listPrice, discountValue, discountType]);

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <Settings className="h-5 w-5 mr-2 text-orange-600" />
          Listing
        </CardTitle>
        <p className="text-sm text-gray-500">
          Configure fulfillment, handling time, and listing settings
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Base Price */}
          <FormField
            name="price.base"
            render={({ field }) => (
              <CurrencyInput
                {...field}
                label="Base Price"
                placeholder="0.00"
                required
                currency="EGP"
                helpText="This is the standard retail price"
              />
            )}
          />
          {/* List Price */}
          <FormField
            name="price.list"
            render={({ field }) => (
              <CurrencyInput
                {...field}
                label="List Price (MSRP)"
                placeholder="0.00"
                currency="EGP"
                helpText="Manufacturer's suggested retail price"
              />
            )}
          />
          {/* Discount */}
          <div className="flex gap-2">
            <FormField
              name="price.discountValue"
              render={({ field }) => (
                <CurrencyInput
                  {...field}
                  label="Discount"
                  placeholder="0.00"
                  currency="EGP"
                  helpText="Discount amount or percentage"
                />
              )}
            />
            <FormField
              name="price.discountType"
              render={({ field }) => (
                <SelectInput
                  {...field}
                  label="Discount Type"
                  options={[
                    { value: "amount", label: "Amount" },
                    { value: "percent", label: "%" },
                  ]}
                />
              )}
            />
          </div>
          {/* Final Price */}
          <FormField
            name="price.final"
            render={({ field }) => (
              <CurrencyInput
                {...field}
                label="Final Price"
                placeholder="0.00"
                currency="EGP"
                helpText="Product Display price (List Price + 10% commission)"
                disabled
              />
            )}
          />
        </div>

        {/* Inventory */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TextInput
            form={form}
            name="sku"
            label="SKU"
            placeholder="PROD-12345"
            required
          />
          <TextInput
            form={form}
            name="quantity"
            label="Stock Quantity"
            type="number"
            placeholder="0"
            required
          />
          <TextInput
            form={form}
            name="maxOrderQuantity"
            label="Max Order Quantity"
            type="number"
            placeholder="No limit"
          />
        </div>

        {/* Condition & Fulfillment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Handling & Tax */}
          <TextInput
            form={form}
            name="handlingTime"
            label="Handling Time (days)"
            type="number"
            placeholder="1"
            required
          />

          {/* <FormField
            name="condition"
            render={({ field }) => (
              <SelectInput
                {...field}
                label="Condition"
                placeholder="Select condition"
                options={conditionOptions}
                required
              />
            )}
          /> */}

          <FormField
            name="fulfillmentType"
            render={({ field }) => (
              <SelectInput
                {...field}
                label="Fulfillment Method"
                placeholder="Select fulfillment"
                options={fulfillmentOptions}
                required
              />
            )}
          />
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <TextInput
            form={form}
            name="dimensions.length"
            label="Length"
            type="number"
            placeholder="60"
          />
          <TextInput
            form={form}
            name="dimensions.width"
            label="Width"
            type="number"
            placeholder="40"
          />
          <TextInput
            form={form}
            name="dimensions.height"
            label="Height"
            type="number"
            placeholder="70"
          />
          <FormField
            name="dimensions.unit"
            render={({ field }) => (
              <SelectInput
                {...field}
                label="Unit"
                placeholder="Select unit"
                options={[
                  { label: "Pixel", value: "px" },
                  { label: "Centimeter", value: "cm" },
                  { label: "Meter", value: "m" },
                ]}
              />
            )}
          />
          <TextInput
            form={form}
            name="dimensions.weight"
            label="Weight"
            type="number"
            placeholder="0.2"
          />
          <FormField
            name="dimensions.weightUnit"
            render={({ field }) => (
              <SelectInput
                {...field}
                label="Weight Unit"
                placeholder="Select unit"
                options={[
                  { label: "Kilograms (kg)", value: "kg" },
                  { label: "Grams (g)", value: "g" },
                ]}
              />
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Physical Properties Step
export const PhysicalPropertiesStep = () => {
  const form = useFormContext<AddProductFormData>();

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <Truck className="h-5 w-5 mr-2 text-indigo-600" />
          Physical Properties
        </CardTitle>
        <p className="text-sm text-gray-500">
          Product dimensions and weight for shipping calculations
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput
            form={form}
            name="dimensions.weight"
            label="Weight (kg)"
            type="number"
            placeholder="0.0"
          />

          <FormField
            name="dimensions.unit"
            render={({ field }) => (
              <SelectInput
                {...field}
                label="Dimension Unit"
                options={dimensionUnits}
                placeholder="Select unit"
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TextInput
            form={form}
            name="dimensions.length"
            label="Length"
            type="number"
            placeholder="0.0"
          />

          <TextInput
            form={form}
            name="dimensions.width"
            label="Width"
            type="number"
            placeholder="0.0"
          />

          <TextInput
            form={form}
            name="dimensions.height"
            label="Height"
            type="number"
            placeholder="0.0"
          />
        </div>

        <FormField
          name="notes"
          render={({ field }) => (
            <TextareaInput
              {...field}
              form={form}
              label="Additional Notes"
              placeholder="Any additional information about this product..."
              rows={3}
            />
          )}
        />
      </CardContent>
    </Card>
  );
};

// SEO & Marketing Step
export const VariantsSeoStep = () => {
  const form = useFormContext<AddProductFormData>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants" as const,
  });

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <Search className="h-5 w-5 mr-2 text-teal-600" />
          Variants & SEO
        </CardTitle>
        <p className="text-sm text-gray-500">
          Add product variants and SEO settings
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Variants</h4>
            <button
              type="button"
              onClick={() => append({ title: "", sku: "", price: 0, stock: 0 })}
              className="text-sm text-blue-600"
            >
              + Add Variant
            </button>
          </div>
          {fields.length === 0 ? (
            <p className="text-sm text-gray-500">
              No variants added. Use the button above to add one.
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-md border p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <TextInput
                      form={form}
                      name={`variants.${index}.title`}
                      label="Title"
                      placeholder="Variant title"
                    />
                    <TextInput
                      form={form}
                      name={`variants.${index}.sku`}
                      label="SKU"
                      placeholder="SKU"
                    />
                    <FormField
                      name={`variants.${index}.price`}
                      render={({ field }) => (
                        <CurrencyInput
                          {...field}
                          label="Price"
                          placeholder="0.00"
                          currency="EGP"
                        />
                      )}
                    />
                    <TextInput
                      form={form}
                      name={`variants.${index}.stock`}
                      label="Stock"
                      type="number"
                      placeholder="0"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <TextInput
                      form={form}
                      name={`variants.${index}.option1`}
                      label="Option 1"
                      placeholder="e.g., Color"
                    />
                    <TextInput
                      form={form}
                      name={`variants.${index}.option2`}
                      label="Option 2"
                      placeholder="e.g., Size"
                    />
                    <TextInput
                      form={form}
                      name={`variants.${index}.option3`}
                      label="Option 3"
                      placeholder="e.g., Material"
                    />
                    <TextInput
                      form={form}
                      name={`variants.${index}.imageUrl`}
                      label="Image URL"
                      placeholder="https://..."
                    />
                    {/* <FormField
            control={form.control}
            name={`variants.${index}.imageUrl`}
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormControl>
                  <ImageUpload
                    bucket="variants"
                    value={field.value}
                    onChange={field.onChange}
                    form={form}
                    maxImages={1}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}
                  </div>
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      className="text-sm text-red-600"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <TextInput
          form={form}
          name="seo.metaTitle"
          label="Meta Title"
          placeholder="SEO-friendly title for search engines"
        />
        <FormField
          name="seo.metaDescription"
          render={({ field }) => (
            <TextareaInput
              {...field}
              form={form}
              label="Meta Description"
              placeholder="Brief SEO description"
              rows={3}
            />
          )}
        />
        <TextInput
          form={form}
          name="seo.metaKeywords"
          label="Meta Keywords"
          placeholder="keyword1, keyword2, keyword3"
        />
        <TextInput
          form={form}
          name="seo.searchKeywords"
          label="Search Keywords"
          placeholder="Additional search terms customers might use"
        />
      </CardContent>
    </Card>
  );
};
