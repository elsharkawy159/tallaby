"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
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
  DateInput,
  SwitchInput,
  ArrayInput,
} from "@workspace/ui/components";
import { ImageUpload } from "@/components/inputs/image-upload";
import {
  Package,
  Image as ImageIcon,
  DollarSign,
  Settings,
  Search,
  Truck,
} from "lucide-react";
import type {
  AddProductFormData,
  BrandOption,
  CategoryOption,
} from "./add-product.schema";
import {
  conditionOptions,
  fulfillmentOptions,
  taxClassOptions,
  dimensionUnits,
} from "./add-product.schema";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@workspace/ui/components/form";

// Utility to generate slug from string
const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// Basic Information Step
export const BasicInformationStep = ({
  categories,
  brands,
}: {
  categories: CategoryOption[];
  brands: BrandOption[];
}) => {
  const form = useFormContext<AddProductFormData>();

  // Handler for onBlur of product name
  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (title) {
      const newSlug = slugify(title);
      form.setValue("slug", newSlug, { shouldValidate: true });
    }
  };

  return (
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
              name="mainCategoryId"
              render={({ field }) => (
                <SelectInput
                  {...field}
                  label="Main Category"
                  placeholder="Select a category"
                  options={categories.map((cat: any) => ({
                    value: cat.id,
                    label: cat.name,
                  }))}
                />
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
                  options={brands.map((brand: any) => ({
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
  );
};

// Product Images Step
export const ProductImagesStep = () => {
  const form = useFormContext<AddProductFormData>();

  return (
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
  );
};

// Pricing Step
export const PricingStep = () => {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
          Pricing
        </CardTitle>
        <p className="text-sm text-gray-500">
          Set your product pricing structure
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            name="basePrice"
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
          <FormField
            name="listPrice"
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            name="price"
            render={({ field }) => (
              <CurrencyInput
                {...field}
                label="Your Selling Price"
                placeholder="0.00"
                required
                currency="EGP"
                helpText="The price customers will pay"
              />
            )}
          />
          <FormField
            name="salePrice"
            render={({ field }) => (
              <CurrencyInput
                {...field}
                label="Sale Price"
                placeholder="0.00"
                currency="EGP"
                helpText="Optional promotional price"
              />
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Inventory & Stock Step
export const InventoryStep = () => {
  const form = useFormContext<AddProductFormData>();

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <Package className="h-5 w-5 mr-2 text-purple-600" />
          Inventory & Stock Management
        </CardTitle>
        <p className="text-sm text-gray-500">
          Manage your product inventory and stock levels
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {/* <FormField
          name="restockDate"
          render={({ field }) => (
            <DateInput
              {...field}
              label="Restock Date"
              onChange={(date) =>
                field.onChange(date ? date.toISOString() : "")
              }
            />
          )}
        /> */}
      </CardContent>
    </Card>
  );
};

// Product Settings Step
export const ProductSettingsStep = () => {
  const form = useFormContext<AddProductFormData>();

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <Settings className="h-5 w-5 mr-2 text-orange-600" />
          Product Settings
        </CardTitle>
        <p className="text-sm text-gray-500">
          Configure product condition, fulfillment, and status
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
{/* 
        <FormField
          name="conditionDescription"
          render={({ field }) => (
            <TextareaInput
              {...field}
              label="Condition Description"
              placeholder="Describe the item's condition in detail..."
              rows={3}
            />
          )}
        /> */}

        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
          <TextInput
            form={form}
            name="handlingTime"
            label="Handling Time (days)"
            type="number"
            placeholder="1"
            required
          />

          {/* <FormField
            name="taxClass"
            render={({ field }) => (
              <SelectInput
                {...field}
                label="Tax Class"
                placeholder="Select tax class"
                options={taxClassOptions}
                required
              />
            )}
          /> */}
        {/* </div> */}

        {/* <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <FormField
            name="isActive"
            render={({ field }) => (
              <SwitchInput {...field} label="Active Product" />
            )}
          />
          <FormField
            name="isFeatured"
            render={({ field }) => <SwitchInput {...field} label="Featured" />}
          />
          <FormField
            name="isBestSeller"
            render={({ field }) => (
              <SwitchInput {...field} label="Best Seller" />
            )}
          />
          <FormField
            name="isPlatformChoice"
            render={({ field }) => (
              <SwitchInput {...field} label="Platform Choice" />
            )}
          />
          <FormField
            name="isAdult"
            render={({ field }) => (
              <SwitchInput {...field} label="Adult Content" />
            )}
          />
        </div> */}
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
            name="dimensionUnits.weight"
            label="Weight (kg)"
            type="number"
            placeholder="0.0"
          />

          <FormField
            name="dimensionUnits.unit"
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
            name="dimensionUnits.length"
            label="Length"
            type="number"
            placeholder="0.0"
          />

          <TextInput
            form={form}
            name="dimensionUnits.width"
            label="Width"
            type="number"
            placeholder="0.0"
          />

          <TextInput
            form={form}
            name="dimensionUnits.height"
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
export const SeoMarketingStep = () => {
  const form = useFormContext<AddProductFormData>();

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <Search className="h-5 w-5 mr-2 text-teal-600" />
          SEO & Marketing
        </CardTitle>
        <p className="text-sm text-gray-500">
          Optimize your product for search engines and discoverability
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <TextInput
          form={form}
          name="metaTitle"
          label="Meta Title"
          placeholder="SEO-friendly title for search engines"
        />

        <FormField
          name="metaDescription"
          render={({ field }) => (
            <TextareaInput
              {...field}
              label="Meta Description"
              placeholder="Brief description that appears in search results"
              rows={3}
            />
          )}
        />

        <TextInput
          form={form}
          name="metaKeywords"
          label="Meta Keywords"
          placeholder="keyword1, keyword2, keyword3"
        />

        <TextInput
          form={form}
          name="searchKeywords"
          label="Search Keywords"
          placeholder="Additional search terms customers might use"
        />
      </CardContent>
    </Card>
  );
};
