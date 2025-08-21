"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Package,
  Image as ImageIcon,
  DollarSign,
  Settings,
  Search,
  Truck,
  Loader,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormField,
  FormMessage,
} from "@workspace/ui/components/form";
import {
  TextInput,
  TextareaInput,
  SelectInput,
  CurrencyInput,
  DateInput,
  SwitchInput,
  ArrayInput,
} from "@workspace/ui/components";
import {
  addProductFormSchema,
  defaultValues,
  type AddProductFormData,
  type CategoryOption,
  type BrandOption,
  conditionOptions,
  fulfillmentOptions,
  taxClassOptions,
  dimensionUnits,
} from "./add-product.schema";
import { addProductAction } from "./add-product.server";
import { toast } from "sonner";
import { ImageUpload } from "@/components/inputs/image-upload";
import { useTransition } from "react";
import Link from "next/link";

// Utility to generate slug from string
const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

interface AddProductProps {
  categories?: CategoryOption[];
  brands?: BrandOption[];
  isEditMode?: boolean;
  productId?: string;
  initialData?: any;
}

export default function AddProduct({
  categories,
  brands,
  isEditMode = false,
  productId,
  initialData,
}: AddProductProps) {
  const [isSavingDraft, setIsSavingDraft] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductFormSchema),
    defaultValues: initialData || defaultValues,
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

  // Handler for onBlur of product name
  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (title) {
      const newSlug = slugify(title);
      form.setValue("slug", newSlug, { shouldValidate: true });
    }
  };

  const handleSubmit = (data: AddProductFormData) => {
    startTransition(async () => {
      // Check for validation errors
      const isValid = await form.trigger();
      if (!isValid) {
        toast.error("Please fix the form errors before submitting.");
        return;
      }
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
    setIsSavingDraft(true);
    try {
      toast.success("Draft saved successfully!");
    } catch (error) {
      toast.error("Failed to save draft.");
    } finally {
      setIsSavingDraft(false);
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
              <Link href="/products">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="h-10 flex items-center"
            >
              <Save className="size-4" />
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
                  <Loader className="animate-spin" />
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
            id="add-product-form"
          >
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column - Images */}
              <div className="xl:col-span-1">
                <div className="sticky top-28">
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
                            {/* <FormLabel
                              className={cn(
                                "text-foreground text-lg font-normal mb-8"
                              )}
                            >
                              Upload Images
                            </FormLabel> */}
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
                </div>
              </div>

              {/* Right Column - Form Content */}
              <div className="xl:col-span-2 space-y-8">
                {/* Basic Information */}
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
                              options={categories.map((cat) => ({
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
                              options={brands.map((brand) => ({
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

                {/* Pricing */}
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
                            showCurrencySymbol
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
                            showCurrencySymbol
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
                            showCurrencySymbol
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
                            showCurrencySymbol
                            currency="EGP"
                            helpText="Optional promotional price"
                          />
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Inventory & Stock */}
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
                        name="stockQuantity"
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

                    <FormField
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
                    />
                  </CardContent>
                </Card>

                {/* Product Settings */}
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
                      <FormField
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
                      />
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
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <TextInput
                        form={form}
                        name="handlingTime"
                        label="Handling Time (days)"
                        type="number"
                        placeholder="1"
                        required
                      />

                      <FormField
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
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      <FormField
                        name="isActive"
                        render={({ field }) => (
                          <SwitchInput {...field} label="Active Product" />
                        )}
                      />
                      <FormField
                        name="isFeatured"
                        render={({ field }) => (
                          <SwitchInput {...field} label="Featured" />
                        )}
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
                    </div>
                  </CardContent>
                </Card>

                {/* Physical Properties */}
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
                        name="weight"
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
                          label="Additional Notes"
                          placeholder="Any additional information about this product..."
                          rows={3}
                        />
                      )}
                    />
                  </CardContent>
                </Card>

                {/* SEO & Marketing */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <Search className="h-5 w-5 mr-2 text-teal-600" />
                      SEO & Marketing
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      Optimize your product for search engines and
                      discoverability
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
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
