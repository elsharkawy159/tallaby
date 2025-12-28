"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { updateCategory } from "@/actions/categories";
import { toast } from "sonner";
import { generateCategorySlug } from "../categories.lib";
import type { Category } from "../categories.types";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  parentId: z.string().nullable(),
});

interface CategoryEditDialogProps {
  category: Category;
  locale: "en" | "ar";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  allCategories: Category[];
}

export function CategoryEditDialog({
  category,
  locale,
  open,
  onOpenChange,
  onSuccess,
  allCategories,
}: CategoryEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name || "",
      slug: category.slug || "",
      parentId: category.parentId,
    },
  });

  // Reset form when category changes
  useEffect(() => {
    if (open && category) {
      form.reset({
        name: category.name || "",
        slug: category.slug || "",
        parentId: category.parentId,
      });
    }
  }, [open, category, form]);

  const onSubmit = async (values: z.infer<typeof categorySchema>) => {
    setIsSubmitting(true);
    try {
      const result = await updateCategory(category.id, {
        name: values.name,
        slug: values.slug,
        parentId: values.parentId,
        locale,
      });

      if (result.success) {
        toast.success("Category updated successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to update category");
      }
    } catch (error) {
      toast.error("Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate slug from name
  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    if (!form.getValues("slug")) {
      form.setValue("slug", generateCategorySlug(name));
    }
  };

  // Get available parent categories (exclude current category)
  const availableParents = allCategories.filter((cat) => {
    // Don't allow selecting the current category as parent
    if (cat.id === category.id) return false;
    // For now, we'll allow all other categories as potential parents
    // In a production app, you'd want to check for circular references
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>Update category information.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleNameChange(e.target.value);
                      }}
                      placeholder="Enter category name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="category-slug"
                      onChange={(e) => {
                        field.onChange(e);
                        form.setValue(
                          "slug",
                          generateCategorySlug(e.target.value)
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : value)
                    }
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None (Root Category)</SelectItem>
                      {availableParents.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
