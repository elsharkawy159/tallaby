
"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Trash } from "lucide-react";
import { productSchema } from "../../_lib/validations/product-schema";
import { FormInputField } from "@/components/forms/form-field";
import { FormWrapper } from "@/components/forms/form-wrapper";

// Mock data for brands and categories
const brands = [
  { label: "TechBrand", value: "brand_01" },
  { label: "AudioTech", value: "brand_02" },
  { label: "FitWear", value: "brand_03" },
  { label: "HomeTech", value: "brand_04" },
  { label: "PhotoTech", value: "brand_05" },
  { label: "GameTech", value: "brand_06" },
  { label: "WearTech", value: "brand_07" },
];

const categories = [
  { label: "Electronics", value: "cat_01" },
  { label: "Wearables", value: "cat_02" },
  { label: "Smart Home", value: "cat_03" },
  { label: "Photography", value: "cat_04" },
  { label: "Gaming", value: "cat_05" },
  { label: "Audio", value: "cat_06" },
  { label: "Computers", value: "cat_07" },
];

interface ProductFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export function ProductForm({
  initialData,
  isEditing = false,
}: ProductFormProps) {
  const [bulletPoints, setBulletPoints] = useState<string[]>(
    initialData?.bulletPoints || [""]
  );

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      title: "",
      slug: "",
      description: "",
      brandId: "",
      mainCategoryId: "",
      basePrice: 0,
      listPrice: 0,
      isActive: true,
      isAdult: false,
      isPlatformChoice: false,
      isBestSeller: false,
      taxClass: "standard",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      searchKeywords: "",
    },
  });

  const { control, formState } = form;

  const addBulletPoint = () => {
    setBulletPoints([...bulletPoints, ""]);
  };

  const removeBulletPoint = (index: number) => {
    const newBulletPoints = [...bulletPoints];
    newBulletPoints.splice(index, 1);
    setBulletPoints(newBulletPoints);
  };

  const updateBulletPoint = (index: number, value: string) => {
    const newBulletPoints = [...bulletPoints];
    newBulletPoints[index] = value;
    setBulletPoints(newBulletPoints);
  };

  const onSubmit = async (data: any) => {
    // Include the bullet points
    const formData = {
      ...data,
      bulletPoints: bulletPoints.filter((bp) => bp.trim() !== ""),
    };

    console.log("Form submitted:", formData);

    // Here you would typically submit the data to your API
    // await createProduct(formData) or await updateProduct(id, formData)
  };

  // Auto-generate slug from title
  const title = useWatch({ control, name: "title" });
  const handleGenerateSlug = () => {
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      form.setValue("slug", slug);
    }
  };

  return (
    <FormWrapper
      schema={productSchema}
      defaultValues={form.formState.defaultValues}
      onSubmit={onSubmit}
      submitText={isEditing ? "Update Product" : "Create Product"}
      showReset
    >
      <Tabs defaultValue="basic">
        <TabsList className="mb-6">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
          <TabsTrigger value="description">Description & Features</TabsTrigger>
          <TabsTrigger value="seo">SEO & Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details of the product.
              </CardDescription>
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
                  name="mainCategoryId"
                  label="Main Category"
                  type="select"
                  options={categories}
                  placeholder="Select main category"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormInputField
                  control={control}
                  name="isActive"
                  label="Active Status"
                  type="switch"
                  placeholder="Product is active and visible to customers"
                />
                <FormInputField
                  control={control}
                  name="isAdult"
                  label="Adult Content"
                  type="switch"
                  placeholder="Product contains adult content"
                />
                <FormInputField
                  control={control}
                  name="taxClass"
                  label="Tax Class"
                  type="select"
                  options={[
                    { label: "Standard", value: "standard" },
                    { label: "Reduced", value: "reduced" },
                    { label: "Zero", value: "zero" },
                  ]}
                  placeholder="Select tax class"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
              <CardDescription>
                Set the pricing details for the product.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInputField
                  control={control}
                  name="basePrice"
                  label="Base Price"
                  type="number"
                  placeholder="0.00"
                  description="The regular selling price"
                />
                <FormInputField
                  control={control}
                  name="listPrice"
                  label="List Price (MSRP)"
                  type="number"
                  placeholder="0.00"
                  description="Manufacturer's suggested retail price"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInputField
                  control={control}
                  name="isPlatformChoice"
                  label="Platform Choice"
                  type="switch"
                  placeholder="Mark as a platform recommended product"
                />
                <FormInputField
                  control={control}
                  name="isBestSeller"
                  label="Best Seller"
                  type="switch"
                  placeholder="Mark as a best seller product"
                />
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
                        onChange={(e) =>
                          updateBulletPoint(index, e.target.value)
                        }
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

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO & Metadata</CardTitle>
              <CardDescription>
                Optimize your product for search engines.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <FormInputField
                  control={control}
                  name="metaTitle"
                  label="Meta Title"
                  placeholder="Product SEO title"
                  description="Title shown in search engine results"
                />
                <FormInputField
                  control={control}
                  name="metaDescription"
                  label="Meta Description"
                  type="textarea"
                  placeholder="Brief description for search results"
                  description="Short description shown in search engine results"
                />
                <FormInputField
                  control={control}
                  name="metaKeywords"
                  label="Meta Keywords"
                  placeholder="keyword1, keyword2, keyword3"
                  description="Comma-separated keywords (less important for modern SEO)"
                />
                <FormInputField
                  control={control}
                  name="searchKeywords"
                  label="Search Keywords"
                  placeholder="Additional search terms"
                  description="Additional keywords to help customers find this product in your store search"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </FormWrapper>
  );
}
