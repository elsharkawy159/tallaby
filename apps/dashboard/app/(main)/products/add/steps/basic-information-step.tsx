"use client";

import { useFormContext } from "react-hook-form";
import {
  TextInput,
  TextareaInput,
  SelectInput,
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
import slugify from "slugify";
import { useDebounce } from "@/hooks/use-debounce";
import { CategorySuggestions } from "../category-suggestions";
import type {
  AddProductFormData,
  BrandOption,
  CategoryOption,
} from "../add-product.schema";

interface BasicInformationStepProps {
  categories: CategoryOption[];
  brands: BrandOption[];
}

export function BasicInformationStep({
  categories,
  brands,
}: BasicInformationStepProps) {
  const form = useFormContext<AddProductFormData>();
  const productTitle = form.watch("title");
  const debouncedTitle = useDebounce(productTitle || "", 300);
  const selectedCategoryId = form.watch("categoryId");

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (title) {
      const newSlug = slugify(title, { lower: true, strict: true });
      form.setValue("slug", newSlug, { shouldValidate: true });
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    form.setValue("categoryId", categoryId, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
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
                maxImages={5}
              />
            </FormControl>
            <p className="text-xs text-gray-500 mt-1">
              Accepts images, videos, or 3D models
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

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
      <div className="flex flex-col md:flex-row gap-4">
        {categories && (
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-sm">
                  Category <span className="text-red-600">*</span>
                </FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <CategoryPopover
                      categories={categories}
                      value={field.value}
                      onChange={field.onChange}
                      form={form}
                    />
                    <CategorySuggestions
                      categories={categories}
                      productName={debouncedTitle}
                      selectedCategoryId={selectedCategoryId}
                      onSelect={handleCategorySelect}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
        {brands && (
          <FormField
            control={form.control}
            name="brandId"
            render={({ field }) => (
              <FormItem className="max-w-80">
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
              </FormItem>
            )}
          />
        )}

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
            description="Add up to 10 key product features"
            className="text-sm"
          />
        )}
      />
    </div>
  );
}
