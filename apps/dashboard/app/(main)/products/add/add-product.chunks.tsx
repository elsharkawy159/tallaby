"use client";

import { useEffect } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
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
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from "@workspace/ui/components/form";
import { Button } from "@workspace/ui/components/button";
import slugify from "slugify";
import type {
  AddProductFormData,
  BrandOption,
  CategoryOption,
} from "./add-product.schema";
import { fulfillmentOptions } from "./add-product.schema";

interface BasicInformationSectionProps {
  categories: CategoryOption[];
  brands: BrandOption[];
}

export const BasicInformationSection = ({
  categories,
  brands,
}: BasicInformationSectionProps) => {
  const form = useFormContext<AddProductFormData>();

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (title) {
      const newSlug = slugify(title, { lower: true, strict: true });
      form.setValue("slug", newSlug, { shouldValidate: true });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <Accordion
        type="single"
        collapsible
        defaultValue="basic-info"
        className="w-full"
      >
        <AccordionItem value="basic-info" className="border-0">
          <AccordionTrigger className="px-6 py-3 text-sm font-semibold hover:no-underline">
            Basic Information
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
            {/* Title and Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                form={form}
                name="title"
                label="Title"
                placeholder="Short sleeve t-shirt"
                required
                onBlur={handleTitleBlur}
                className="text-sm"
              />
              <TextInput
                form={form}
                name="slug"
                label="Slug"
                placeholder="short-sleeve-t-shirt"
                disabled
                className="text-sm"
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <TextareaInput
                  {...field}
                  label="Description"
                  form={form}
                  placeholder="Product description..."
                  rows={6}
                  className="text-sm"
                />
              )}
            />

            {/* Category and Brand */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories && (
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        Category <span className="text-red-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <CategoryPopover
                          categories={categories}
                          value={field.value}
                          onChange={field.onChange}
                          form={form}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {brands && (
                <FormField
                  control={form.control}
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
                      className="text-sm"
                    />
                  )}
                />
              )}
            </div>

            {/* Key Features */}
            <FormField
              control={form.control}
              name="bulletPoints"
              render={({ field }) => (
                <ArrayInput
                  {...field}
                  label="Key Features"
                  addButtonText="Add Feature"
                  itemPlaceholder="Enter a key feature..."
                  maxItems={10}
                  // description="Add up to 10 key product features"
                  className="text-sm"
                />
              )}
            />

            {/* Media */}
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    Media <span className="text-red-600">*</span>
                  </FormLabel>
                  <FormControl>
                    <ImageUpload
                      bucket="products"
                      value={field.value || []}
                      onChange={field.onChange}
                      form={form}
                      maxImages={8}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">
                    Accepts images, videos, or 3D models
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export const PricingSection = () => {
  const form = useFormContext<AddProductFormData>();

  // Auto-calculate final price when list price changes (10% commission)
  const listPrice = form.watch("price.list");
  const discountValue = form.watch("price.discountValue");
  const discountType = form.watch("price.discountType");

  useEffect(() => {
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
  }, [form, listPrice, discountValue, discountType]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="pricing" className="border-0">
          <AccordionTrigger className="px-6 py-3 text-sm font-semibold hover:no-underline">
            Price
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CurrencyInput
                name="price.base"
                label="Base Price"
                placeholder="0.00"
                required
                currency="EGP"
                helpText="This is the standard retail price"
                className="text-sm"
              />
              <CurrencyInput
                name="price.list"
                label="List Price (MSRP)"
                placeholder="0.00"
                currency="EGP"
                helpText="Manufacturer's suggested retail price"
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CurrencyInput
                name="price.discountValue"
                label="Discount"
                placeholder="0.00"
                currency="EGP"
                helpText="Discount amount or percentage"
                className="text-sm"
              />
              <SelectInput
                name="price.discountType"
                label="Discount Type"
                options={[
                  { value: "amount", label: "Amount" },
                  { value: "percent", label: "Percent (%)" },
                ]}
                className="text-sm"
              />
            </div>

            <CurrencyInput
              name="price.final"
              label="Final Price"
              placeholder="0.00"
              currency="EGP"
              helpText="Product Display price (List Price + 10% commission)"
              disabled
              className="text-sm"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export const InventorySection = () => {
  const form = useFormContext<AddProductFormData>();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="inventory" className="border-0">
          <AccordionTrigger className="px-6 py-3 text-sm font-semibold hover:no-underline">
            Inventory
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextInput
                form={form}
                name="sku"
                label="SKU"
                placeholder="PROD-12345"
                required
                className="text-sm"
              />
              <TextInput
                form={form}
                name="quantity"
                label="Quantity"
                type="number"
                placeholder="0"
                required
                className="text-sm"
              />
              <TextInput
                form={form}
                name="maxOrderQuantity"
                label="Max Order Quantity"
                type="number"
                placeholder="No limit"
                className="text-sm"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export const ShippingSection = () => {
  const form = useFormContext<AddProductFormData>();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="shipping" className="border-0">
          <AccordionTrigger className="px-6 py-3 text-sm font-semibold hover:no-underline">
            Shipping
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectInput
                name="fulfillmentType"
                label="Fulfillment Method"
                placeholder="Select fulfillment"
                options={fulfillmentOptions}
                required
                className="text-sm"
              />
              <TextInput
                form={form}
                name="handlingTime"
                label="Handling Time (days)"
                type="number"
                placeholder="1"
                required
                className="text-sm"
              />
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <FormLabel className="text-sm">Product Weight</FormLabel>
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  form={form}
                  name="dimensions.weight"
                  label="Weight"
                  type="number"
                  placeholder="0.0"
                  className="text-sm"
                />
                <SelectInput
                  name="dimensions.weightUnit"
                  label="Unit"
                  placeholder="Select unit"
                  options={[
                    { value: "kg", label: "kg" },
                    { value: "g", label: "g" },
                    { value: "lb", label: "lb" },
                  ]}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <FormLabel className="text-sm">Dimensions</FormLabel>
              <div className="grid grid-cols-4 gap-4">
                <TextInput
                  form={form}
                  name="dimensions.length"
                  label="Length"
                  type="number"
                  placeholder="0"
                  className="text-sm"
                />
                <TextInput
                  form={form}
                  name="dimensions.width"
                  label="Width"
                  type="number"
                  placeholder="0"
                  className="text-sm"
                />
                <TextInput
                  form={form}
                  name="dimensions.height"
                  label="Height"
                  type="number"
                  placeholder="0"
                  className="text-sm"
                />
                <SelectInput
                  name="dimensions.unit"
                  label="Unit"
                  placeholder="Select unit"
                  options={[
                    { value: "cm", label: "cm" },
                    { value: "in", label: "in" },
                  ]}
                  className="text-sm"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export const VariantsSection = () => {
  const form = useFormContext<AddProductFormData>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="variants" className="border-0">
          <AccordionTrigger className="px-6 py-3 text-sm font-semibold hover:no-underline">
            Variants
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Add options like size or color
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    title: "",
                    sku: "",
                    price: 0,
                    stock: 0,
                    option1: "",
                    option2: "",
                    option3: "",
                  })
                }
                className="text-xs"
              >
                + Add Variant
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                No variants added. Use the button above to add one.
              </p>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-md border p-4 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <TextInput
                        form={form}
                        name={`variants.${index}.title`}
                        label="Title"
                        placeholder="Variant title"
                        required
                        className="text-sm"
                      />
                      <TextInput
                        form={form}
                        name={`variants.${index}.sku`}
                        label="SKU"
                        placeholder="SKU"
                        required
                        className="text-sm"
                      />
                      <CurrencyInput
                        name={`variants.${index}.price`}
                        label="Price"
                        placeholder="0.00"
                        currency="EGP"
                        required
                        className="text-sm"
                      />
                      <TextInput
                        form={form}
                        name={`variants.${index}.stock`}
                        label="Stock"
                        type="number"
                        placeholder="0"
                        className="text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TextInput
                        form={form}
                        name={`variants.${index}.option1`}
                        label="Option 1"
                        placeholder="e.g., Color"
                        className="text-sm"
                      />
                      <TextInput
                        form={form}
                        name={`variants.${index}.option2`}
                        label="Option 2"
                        placeholder="e.g., Size"
                        className="text-sm"
                      />
                      <TextInput
                        form={form}
                        name={`variants.${index}.option3`}
                        label="Option 3"
                        placeholder="e.g., Material"
                        className="text-sm"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-xs text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export const SeoSection = () => {
  const form = useFormContext<AddProductFormData>();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="seo" className="border-0">
          <AccordionTrigger className="px-6 py-3 text-sm font-semibold hover:no-underline">
            Search engine listing
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
            <p className="text-xs text-gray-500">
              Add a title and description to see how this product might appear
              in a search engine listing
            </p>
            <TextInput
              form={form}
              name="seo.metaTitle"
              label="Meta Title"
              placeholder="SEO-friendly title for search engines"
              className="text-sm"
            />
            <FormField
              control={form.control}
              name="seo.metaDescription"
              render={({ field }) => (
                <TextareaInput
                  {...field}
                  form={form}
                  name="seo.metaDescription"
                  label="Meta Description"
                  placeholder="Brief SEO description"
                  rows={3}
                  className="text-sm"
                />
              )}
            />
            <TextInput
              form={form}
              name="seo.metaKeywords"
              label="Meta Keywords"
              placeholder="keyword1, keyword2, keyword3"
              className="text-sm"
            />
            {/* <TextInput
              form={form}
              name="seo.searchKeywords"
              label="Search Keywords"
              placeholder="Additional search terms customers might use"
              className="text-sm"
            /> */}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
