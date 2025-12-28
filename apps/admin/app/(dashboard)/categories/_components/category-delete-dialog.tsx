"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { AlertTriangle } from "lucide-react";
import { deleteCategory } from "@/actions/categories";
import { toast } from "sonner";
import type { Category } from "../categories.types";

interface CategoryDeleteDialogProps {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CategoryDeleteDialog({
  category,
  open,
  onOpenChange,
  onSuccess,
}: CategoryDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteCategory(category.id);

      if (result.success) {
        toast.success("Category deleted successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to delete category");
      }
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  const hasChildren = category.childrenCount > 0;
  const hasProducts = category.productCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Category
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this category? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-medium text-red-900 mb-2">
              Category: {category.name}
            </p>
            {hasChildren && (
              <p className="text-sm text-red-700">
                ⚠️ This category has {category.childrenCount} subcategory(ies).
                You must delete or move them first.
              </p>
            )}
            {hasProducts && (
              <p className="text-sm text-red-700">
                ⚠️ This category has {category.productCount} product(s). You
                must reassign or remove them first.
              </p>
            )}
          </div>

          {!hasChildren && !hasProducts && (
            <p className="text-sm text-muted-foreground">
              This will permanently delete the category. All associated data
              will be removed.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || hasChildren || hasProducts}
          >
            {isDeleting ? "Deleting..." : "Delete Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
