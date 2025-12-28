"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Edit, Languages } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import { TextInput } from "@workspace/ui/components/inputs/text-input";
import { TextareaInput } from "@workspace/ui/components/inputs/textarea-input";
import { SwitchInput } from "@workspace/ui/components/inputs/switch-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

import { brandSchema, brandDefaults, type BrandFormData } from "../brands.dto";
import { createBrand, updateBrand } from "@/actions/brands";
import { ImageUpload } from "@/components/forms/image-upload";
import { generateSlug, generateSlugAr } from "../brands.lib";
import type { Locale, Brand } from "../brands.types";

// Brand Form Component
interface BrandFormProps {
  initialData?: Partial<BrandFormData>;
  brandId?: string;
  locale: Locale;
  isArabicVersion?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const BrandForm = ({
  initialData,
  brandId,
  locale,
  isArabicVersion = false,
  onSuccess,
  onCancel,
}: BrandFormProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [selectedLocale, setSelectedLocale] = useState<Locale>(
    isArabicVersion ? "ar" : locale
  );

  const form = useForm({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      ...brandDefaults,
      ...initialData,
      locale: isArabicVersion ? "ar" : locale,
    },
  });

  // Update form locale when selectedLocale changes
  const handleLocaleChange = (newLocale: Locale) => {
    setSelectedLocale(newLocale);
    form.setValue("locale", newLocale);
  };

  const handleSubmit = (data: BrandFormData) => {
    startTransition(async () => {
      try {
        let result;

        if (brandId) {
          // Update existing brand
          result = await updateBrand(brandId, data);
        } else {
          // Create new brand with selected locale
          const brandData = {
            ...data,
            locale: selectedLocale,
            // If creating Arabic version, use name/slug/description as main fields
            ...(selectedLocale === "ar"
              ? {
                  slug: data.slug,
                  description: data.description,
                }
              : {}),
          } as BrandFormData;
          result = await createBrand(brandData);
        }
        if (result.success) {
          toast.success(
            brandId
              ? "Brand updated successfully!"
              : "Brand created successfully!"
          );
          form.reset();
          router.refresh();
          onSuccess?.();
        } else {
          toast.error(result.error || "Something went wrong");

          // Set server-side field errors
          if (result.error?.includes("slug")) {
            form.setError("slug", {
              type: "server",
              message: "This slug is already taken",
            });
          }
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const handleNameChange = (value: string, isArabic = false) => {
    if (isArabic) {
      const slug = generateSlugAr(value);
      form.setValue("slug", slug);
    } else {
      const slug = generateSlug(value);
      form.setValue("slug", slug);
    }
  };

  return (
    <Form {...(form as any)}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Locale Selector for Create Mode */}
        {!brandId && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Brand Locale
            </label>
            <Select
              value={selectedLocale}
              onValueChange={(value) => handleLocaleChange(value as Locale)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select locale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {selectedLocale === "ar"
                ? "Create an Arabic version of this brand"
                : "Create an English version of this brand"}
            </p>
          </div>
        )}

        <Tabs defaultValue={selectedLocale} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="ar">Arabic</TabsTrigger>
          </TabsList>

          {/* English Tab */}
          <TabsContent value="en" className="space-y-4 mt-4">
            {/* Brand Name */}
            <TextInput
              form={form as any}
              name="name"
              label="Brand Name (English)"
              placeholder="Enter brand name"
              required={selectedLocale === "en" || !!brandId}
              disabled={selectedLocale === "ar" && !brandId}
              onBlur={(e) => {
                if (e.target.value) {
                  handleNameChange(e.target.value, false);
                }
              }}
            />

            {/* Brand Slug */}
            <TextInput
              form={form as any}
              name="slug"
              label="Brand Slug (English)"
              placeholder="brand-slug"
              required={selectedLocale === "en" || !!brandId}
              disabled={selectedLocale === "ar" && !brandId}
              description="URL-friendly version of the brand name (auto-generated)"
            />

            {/* Description */}
            <TextareaInput
              form={form as any}
              name="description"
              label="Description (English)"
              placeholder="Enter brand description"
              rows={4}
              validation={{ maxLength: 500 }}
              showCharacterCount
            />
          </TabsContent>

          {/* Arabic Tab */}
          <TabsContent value="ar" className="space-y-4 mt-4">
            {/* Brand Name Arabic */}
            <TextInput
              form={form as any}
              name={selectedLocale === "ar" ? "name" : "nameAr"}
              label="Brand Name (Arabic)"
              placeholder="أدخل اسم العلامة التجارية"
              required={selectedLocale === "ar"}
              onBlur={(e) => {
                if (e.target.value) {
                  if (selectedLocale === "ar") {
                    handleNameChange(e.target.value, false);
                  } else {
                    handleNameChange(e.target.value, true);
                  }
                }
              }}
            />

            {/* Brand Slug Arabic */}
            <TextInput
              form={form as any}
              name={selectedLocale === "ar" ? "slug" : "slugAr"}
              label="Brand Slug (Arabic)"
              placeholder="اسم-العلامة-التجارية"
              required={selectedLocale === "ar"}
              description="URL-friendly version of the brand name in Arabic (auto-generated)"
            />

            {/* Description Arabic */}
            <TextareaInput
              form={form as any}
              name={selectedLocale === "ar" ? "description" : "descriptionAr"}
              label="Description (Arabic)"
              placeholder="أدخل وصف العلامة التجارية"
              rows={4}
              validation={{ maxLength: 500 }}
              showCharacterCount
            />
          </TabsContent>
        </Tabs>

        {/* Common Fields (outside tabs) */}
        <div className="space-y-4 pt-4 border-t">
          {/* Brand Logo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Brand Logo</label>
            <ImageUpload
              onChange={(urls) => form.setValue("logo_url", urls[0] || "")}
              value={form.watch("logo_url") ? [form.watch("logo_url")!] : []}
              form={form as any}
              bucket="brands"
              maxImages={1}
            />
            <p className="text-sm text-muted-foreground">
              Upload a logo for the brand (optional)
            </p>
          </div>

          {/* Website */}
          <TextInput
            form={form as any}
            name="website"
            label="Website"
            placeholder="https://example.com"
            type="url"
          />

          {/* Status Switches */}
          <div className="space-y-4">
            <SwitchInput
              form={form as any}
              name="isVerified"
              label="Verified Brand"
              description="Mark this brand as verified by platform administrators"
              labelPosition="right"
            />

            <SwitchInput
              form={form as any}
              name="isOfficial"
              label="Official Brand"
              description="Mark this as an official brand partner"
              labelPosition="right"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            disabled={isPending || !form.formState.isValid}
            className="flex-1"
          >
            {isPending
              ? brandId
                ? "Updating..."
                : "Creating..."
              : brandId
                ? "Update Brand"
                : "Create Brand"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

// Brand Dialog Component
interface BrandDialogProps {
  mode: "create" | "edit" | "create-arabic";
  brandData?: Partial<BrandFormData>;
  brandId?: string;
  locale: Locale;
  sourceBrand?: Brand;
  trigger?: React.ReactNode;
}

export const BrandDialog = ({
  mode,
  brandData,
  brandId,
  locale,
  sourceBrand,
  trigger,
}: BrandDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  // Prepare initial data for Arabic version
  const getInitialData = () => {
    if (mode === "create-arabic" && sourceBrand) {
      return {
        ...brandData,
        nameAr: sourceBrand.name,
        slugAr: sourceBrand.slug,
        descriptionAr: sourceBrand.description || "",
        logoUrl: sourceBrand.logoUrl || "",
        website: sourceBrand.website || "",
        isVerified: sourceBrand.isVerified || false,
        isOfficial: sourceBrand.isOfficial || false,
        locale: "ar" as Locale,
      };
    }
    return brandData;
  };

  const defaultTrigger =
    mode === "create" ? (
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add Brand
      </Button>
    ) : mode === "create-arabic" ? (
      <Button size="sm" variant="outline">
        <Languages className="h-4 w-4 mr-2" />
        Create Arabic Version
      </Button>
    ) : (
      <Button variant="ghost" size="sm">
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (defaultTrigger as any)}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Create New Brand"
              : mode === "create-arabic"
                ? "Create Arabic Version"
                : "Edit Brand"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <BrandForm
            initialData={getInitialData()}
            brandId={brandId}
            locale={mode === "create-arabic" ? "ar" : locale}
            isArabicVersion={mode === "create-arabic"}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
