"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Trash, Plus } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { productSchema } from "../../_lib/validations/product-schema";
import { FormWrapper } from "@/components/forms/form-wrapper";
import { FormInputField } from "@/components/forms/form-field";
import { updateProduct } from "@/actions/products";
import { ImageUploadCell } from "@/components/image-upload-cell";

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  isEditing?: boolean;
  productId?: string;
  brands?: Array<{ label: string; value: string }>;
  categories?: Array<{ label: string; value: string }>;
}

function ProductFormFields({
  brands,
  categories,
  onBulletPointsChange,
}: {
  brands: Array<{ label: string; value: string }>;
  categories: Array<{ label: string; value: string }>;
  onBulletPointsChange: (points: string[]) => void;
}) {
  const form = useFormContext<ProductFormData>();
  const { control, watch, setValue } = form;
  const title = watch("title");
  const images = watch("images") ?? [];

  const [bulletPoints, setBulletPoints] = useState<string[]>(() => {
    const initial = form.getValues("bulletPoints");
    return initial?.length ? initial : [""];
  });

  const syncBulletPoints = (points: string[]) => {
    setBulletPoints(points);
    onBulletPointsChange(points.filter((point) => point.trim() !== ""));
  };

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray<ProductFormData, "variants">({
    control,
    name: "variants",
  });

  const addBulletPoint = () => syncBulletPoints([...bulletPoints, ""]);

  const removeBulletPoint = (index: number) => {
    const next = bulletPoints.filter((_, i) => i !== index);
    syncBulletPoints(next.length > 0 ? next : [""]);
  };

  const updateBulletPoint = (index: number, value: string) => {
    const next = [...bulletPoints];
    next[index] = value;
    syncBulletPoints(next);
  };

  useEffect(() => {
    onBulletPointsChange(bulletPoints.filter((point) => point.trim() !== ""));
  }, [bulletPoints, onBulletPointsChange]);

  const handleGenerateSlug = () => {
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      setValue("slug", slug);
    }
  };

  const handleImageSave = async (index: number, path: string | null) => {
    const current = [...(form.getValues("images") ?? [])];
    if (path === null) {
      current.splice(index, 1);
    } else {
      current[index] = path;
    }
    setValue("images", current.filter(Boolean), { shouldValidate: true });
    return { success: true };
  };

  const handleAddImageSlot = () => {
    setValue("images", [...images, ""], { shouldValidate: true });
  };

  return (
    <Tabs defaultValue="basic">
      <TabsList className="mb-6 flex flex-wrap h-auto">
        <TabsTrigger value="basic">Basic Information</TabsTrigger>
        <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
        <TabsTrigger value="description">Description & Features</TabsTrigger>
        <TabsTrigger value="images">Images</TabsTrigger>
        <TabsTrigger value="seo">SEO & Metadata</TabsTrigger>
      </TabsList>

      <TabsContent value="basic">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details of the product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInputField
                control={control}
                name="title"
                label="Product Title"
                placeholder="Enter product title"
              />
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <FormInputField
                      control={control}
                      name="slug"
                      label="Slug"
                      placeholder="product-url-slug"
                      description="URL-friendly version of the product name"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateSlug}
                    className="mb-2"
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInputField
                control={control}
                name="brandId"
                label="Brand"
                type="select"
                options={brands}
                placeholder="Select brand"
              />
              <FormInputField
                control={control}
                name="categoryId"
                label="Main Category"
                type="select"
                options={categories}
                placeholder="Select main category"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInputField
                control={control}
                name="sku"
                label="SKU"
                placeholder="Product SKU"
              />
              <FormInputField
                control={control}
                name="status"
                label="Status"
                type="select"
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Pending", value: "pending" },
                  { label: "Active", value: "active" },
                  { label: "Rejected", value: "rejected" },
                ]}
                placeholder="Product review status"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormInputField
                control={control}
                name="condition"
                label="Condition"
                type="select"
                options={[
                  { label: "New", value: "new" },
                  { label: "Renewed", value: "renewed" },
                  { label: "Refurbished", value: "refurbished" },
                  { label: "Used - Like New", value: "used_like_new" },
                  { label: "Used - Very Good", value: "used_very_good" },
                  { label: "Used - Good", value: "used_good" },
                  { label: "Used - Acceptable", value: "used_acceptable" },
                ]}
              />
              <FormInputField
                control={control}
                name="fulfillmentType"
                label="Fulfillment"
                type="select"
                options={[
                  { label: "Seller Fulfilled", value: "seller_fulfilled" },
                  { label: "Platform Fulfilled", value: "platform_fulfilled" },
                  { label: "FBA", value: "fba" },
                  { label: "Digital", value: "digital" },
                ]}
              />
              <FormInputField
                control={control}
                name="handlingTime"
                label="Handling Time (days)"
                type="number"
                placeholder="1"
              />
              <FormInputField
                control={control}
                name="freeDelivery"
                label="Free Delivery"
                type="switch"
              />
              <FormInputField
                control={control}
                name="maxOrderQuantity"
                label="Max Order Qty"
                type="number"
                placeholder="Optional"
              />
            </div>

            <FormInputField
              control={control}
              name="conditionDescription"
              label="Condition Description"
              type="textarea"
              placeholder="Optional condition notes"
            />

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Merchandising</h3>
                <p className="text-sm text-muted-foreground">
                  How this product is promoted — separate from its category.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormInputField
                  control={control}
                  name="isTrending"
                  label="Trending Now"
                  type="switch"
                />
                <FormInputField
                  control={control}
                  name="isSeasonal"
                  label="Seasonal"
                  type="switch"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Platform badges</h3>
                <p className="text-sm text-muted-foreground">
                  Admin-curated storefront badges.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormInputField
                  control={control}
                  name="taxClass"
                  label="Tax Class"
                  type="select"
                  options={[
                    { label: "Standard", value: "standard" },
                    { label: "Reduced", value: "reduced" },
                    { label: "Zero", value: "zero" },
                    { label: "Exempt", value: "exempt" },
                  ]}
                />
                <FormInputField
                  control={control}
                  name="isPlatformChoice"
                  label="Platform Choice"
                  type="switch"
                />
                <FormInputField
                  control={control}
                  name="isBestSeller"
                  label="Best Seller"
                  type="switch"
                />
                <FormInputField
                  control={control}
                  name="isFeatured"
                  label="Featured"
                  type="switch"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pricing">
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
            <CardDescription>Set pricing and stock for the product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInputField
                control={control}
                name="basePrice"
                label="Base Price"
                type="number"
                placeholder="0.00"
              />
              <FormInputField
                control={control}
                name="listPrice"
                label="List Price (MSRP)"
                type="number"
                placeholder="0.00"
              />
              <FormInputField
                control={control}
                name="finalPrice"
                label="Final Price"
                type="number"
                placeholder="0.00"
                description="Price shown on the storefront"
              />
            </div>

            <FormInputField
              control={control}
              name="quantity"
              label="Product Quantity"
              type="number"
              placeholder="0"
              description="Used when the product has no variants"
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Variants</h3>
                  <p className="text-sm text-muted-foreground">
                    Add variant options with individual pricing and stock.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendVariant({
                      title: "",
                      sku: "",
                      price: 0,
                      stock: 0,
                      position: variantFields.length + 1,
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variant
                </Button>
              </div>

              {variantFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No variants. Product-level quantity and pricing will be used.
                </p>
              ) : (
                <div className="space-y-4">
                  {variantFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg"
                    >
                      <FormInputField
                        control={control}
                        name={`variants.${index}.title`}
                        label="Title"
                        placeholder="Black / 128GB"
                      />
                      <FormInputField
                        control={control}
                        name={`variants.${index}.sku`}
                        label="SKU"
                        placeholder="SKU"
                      />
                      <FormInputField
                        control={control}
                        name={`variants.${index}.price`}
                        label="Price"
                        type="number"
                        placeholder="0.00"
                      />
                      <FormInputField
                        control={control}
                        name={`variants.${index}.stock`}
                        label="Stock"
                        type="number"
                        placeholder="0"
                      />
                      <FormInputField
                        control={control}
                        name={`variants.${index}.option1`}
                        label="Option 1"
                        placeholder="Color"
                      />
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeVariant(index)}
                          aria-label="Remove variant"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="description">
        <Card>
          <CardHeader>
            <CardTitle>Description & Features</CardTitle>
            <CardDescription>
              Provide detailed product description and key features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormInputField
              control={control}
              name="description"
              label="Product Description"
              type="textarea"
              placeholder="Enter product description"
            />

            <div>
              <Label>Key Features (Bullet Points)</Label>
              <div className="mt-2 space-y-3">
                {bulletPoints.map((point, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={point}
                      onChange={(e) => updateBulletPoint(index, e.target.value)}
                      placeholder={`Feature ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeBulletPoint(index)}
                      disabled={bulletPoints.length <= 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={addBulletPoint}
              >
                Add Bullet Point
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="images">
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
            <CardDescription>
              Upload product images. At least one image is required for active products.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {images.map((image, index) => (
                <ImageUploadCell
                  key={`${index}-${image}`}
                  value={image || null}
                  bucket="products"
                  onSave={(path) => handleImageSave(index, path)}
                  alt={`Product image ${index + 1}`}
                  size="md"
                />
              ))}
              <button
                type="button"
                onClick={handleAddImageSlot}
                className="size-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center hover:border-muted-foreground/50"
                aria-label="Add image slot"
              >
                <Plus className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="seo">
        <Card>
          <CardHeader>
            <CardTitle>SEO & Metadata</CardTitle>
            <CardDescription>Optimize your product for search engines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormInputField
              control={control}
              name="metaTitle"
              label="Meta Title"
              placeholder="Product SEO title"
            />
            <FormInputField
              control={control}
              name="metaDescription"
              label="Meta Description"
              type="textarea"
              placeholder="Brief description for search results"
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export function ProductForm({
  initialData,
  isEditing = false,
  productId,
  brands = [],
  categories = [],
}: ProductFormProps) {
  const router = useRouter();
  const bulletPointsRef = useRef<string[]>([]);

  const onSubmit = async (data: ProductFormData) => {
    if (!isEditing || !productId) {
      toast.error("Product ID is required for editing");
      return;
    }

    const bulletPoints = bulletPointsRef.current.filter((bp) => bp.trim() !== "");

    try {
      const result = await updateProduct(productId, {
        title: data.title,
        slug: data.slug,
        description: data.description,
        bulletPoints,
        brandId: data.brandId || undefined,
        categoryId: data.categoryId,
        sku: data.sku,
        basePrice: data.basePrice,
        listPrice: data.listPrice,
        finalPrice: data.finalPrice,
        quantity: data.quantity,
        images: (data.images ?? []).filter(Boolean),
        status: data.status,
        isPlatformChoice: data.isPlatformChoice,
        isMostSelling: data.isBestSeller,
        isFeatured: data.isFeatured,
        isTrending: data.isTrending,
        isSeasonal: data.isSeasonal,
        freeDelivery: data.freeDelivery,
        condition: data.condition,
        conditionDescription: data.conditionDescription,
        fulfillmentType: data.fulfillmentType,
        handlingTime: data.handlingTime,
        maxOrderQuantity: data.maxOrderQuantity,
        taxClass: data.taxClass,
        dimensions: data.dimensions,
        variants: data.variants,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      });

      if (result.success) {
        toast.success("Product updated successfully");
        router.push(`/products/${productId}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update product");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update product"
      );
    }
  };

  return (
    <FormWrapper
      schema={productSchema}
      defaultValues={{
        title: "",
        slug: "",
        description: "",
        brandId: "",
        categoryId: "",
        sku: "",
        basePrice: 0,
        listPrice: undefined,
        finalPrice: 0,
        quantity: 0,
        images: [],
        bulletPoints: [],
        status: "pending",
        isPlatformChoice: false,
        isBestSeller: false,
        isFeatured: false,
        isTrending: false,
        isSeasonal: false,
        freeDelivery: false,
        condition: "new",
        fulfillmentType: "seller_fulfilled",
        handlingTime: 1,
        taxClass: "standard",
        variants: [],
        metaTitle: "",
        metaDescription: "",
        locale: "en",
        ...initialData,
      }}
      onSubmit={onSubmit}
      submitText={isEditing ? "Update Product" : "Create Product"}
      showReset
    >
      <ProductFormFields
        brands={brands}
        categories={categories}
        onBulletPointsChange={(points) => {
          bulletPointsRef.current = points;
        }}
      />
    </FormWrapper>
  );
}
