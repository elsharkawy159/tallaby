"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Edit } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import { TextInput } from "@workspace/ui/components/inputs/text-input";
import { TextareaInput } from "@workspace/ui/components/inputs/textarea-input";
import { SwitchInput } from "@workspace/ui/components/inputs/switch-input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";

import {
  brandSchema,
  brandDefaults,
  generateSlug,
  type BrandFormData,
} from "./brands.dto";
import { createBrand, updateBrand } from "@/actions/brands";
import { ImageUpload } from "@/components/forms/image-upload";

// Brand Form Component
interface BrandFormProps {
  initialData?: Partial<BrandFormData>;
  brandId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const BrandForm = ({
  initialData,
  brandId,
  onSuccess,
  onCancel,
}: BrandFormProps) => {
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      ...brandDefaults,
      ...initialData,
    },
  });

  const handleSubmit = (data: any) => {
    startTransition(async () => {
      try {
        let result;

        if (brandId) {
          // Update existing brand
          result = await updateBrand(brandId, data);
        } else {
          // Create new brand
          result = await createBrand(data);
        }

        if (result.success) {
          toast.success(
            brandId
              ? "Brand updated successfully!"
              : "Brand created successfully!"
          );
          form.reset();
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

  const handleNameChange = (value: string) => {
    const slug = generateSlug(value);
    form.setValue("slug", slug);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{brandId ? "Edit Brand" : "Create New Brand"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Brand Name */}
            <TextInput
              form={form as any}
              name="name"
              label="Brand Name"
              placeholder="Enter brand name"
              required
              onBlur={(e) => {
                if (e.target.value) {
                  handleNameChange(e.target.value);
                }
              }}
            />

            {/* Brand Slug */}
            <TextInput
              form={form as any}
              name="slug"
              label="Brand Slug"
              placeholder="brand-slug"
              required
              description="URL-friendly version of the brand name (auto-generated)"
            />

            {/* Brand Logo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand Logo</label>
              <ImageUpload
                onChange={(urls) => form.setValue("logoUrl", urls[0] || "")}
                value={form.watch("logoUrl") ? [form.watch("logoUrl")!] : []}
                form={form as any}
                bucket="brand-logos"
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

            {/* Description */}
            <TextareaInput
              form={form as any}
              name="description"
              label="Description"
              placeholder="Enter brand description"
              rows={4}
              validation={{ maxLength: 500 }}
              showCharacterCount
            />

            {/* Status Switches */}
            <div className="space-y-4">
              <SwitchInput
                name="isVerified"
                label="Verified Brand"
                description="Mark this brand as verified by platform administrators"
                labelPosition="right"
              />

              <SwitchInput
                name="isOfficial"
                label="Official Brand"
                description="Mark this as an official brand partner"
                labelPosition="right"
              />
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
      </CardContent>
    </Card>
  );
};

// Brand Dialog Component
interface BrandDialogProps {
  mode: "create" | "edit";
  brandData?: Partial<BrandFormData>;
  brandId?: string;
  trigger?: React.ReactNode;
}

export const BrandDialog = ({
  mode,
  brandData,
  brandId,
  trigger,
}: BrandDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const defaultTrigger =
    mode === "create" ? (
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add Brand
      </Button>
    ) : (
      <Button variant="ghost" size="sm">
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Brand" : "Edit Brand"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <BrandForm
            initialData={brandData}
            brandId={brandId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
