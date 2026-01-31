"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Edit, Plus, Trash2, MoreVertical, FolderTree } from "lucide-react";
import type { Category } from "../categories.types";
import { ImageUploadCell } from "@/components/image-upload-cell";
import { updateCategory } from "@/actions/categories";
import { CategoryEditDialog } from "./category-edit-dialog";
import { CategoryDeleteDialog } from "./category-delete-dialog";
import { CategoryAddDialog } from "./category-add-dialog";
import {
  useCategoryChildren,
  invalidateCategoryCache,
} from "./use-category-children";
import { cn } from "@workspace/ui/lib/utils";

interface CategoryItemProps {
  category: Category;
  locale: "en" | "ar";
  onRefresh: () => void;
  level?: number;
  expandedIds?: string[];
  scrollToCategoryId?: string | null;
}

/**
 * Category item component - renders a single category
 * Uses accordion only if category has children, otherwise renders as regular item
 */
export function CategoryItem({
  category,
  locale,
  onRefresh,
  level = 0,
  expandedIds = [],
  scrollToCategoryId,
}: CategoryItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const hasChildren = category.childrenCount > 0;
  const isScrollTarget = scrollToCategoryId === category.id;

  const isExpanded = expandedIds.includes(category.id);

  // Use the custom hook for fetching children with caching
  const { data: children, isLoading: isLoadingChildren } = useCategoryChildren({
    categoryId: category.id,
    locale,
    enabled: isExpanded && hasChildren,
  });

  const handleRefresh = useCallback(() => {
    // Invalidate cache for this category and parent
    invalidateCategoryCache(category.id, locale);
    if (category.parentId) {
      invalidateCategoryCache(category.parentId, locale);
    }
    onRefresh();
  }, [category.id, category.parentId, locale, onRefresh]);

  const CategoryContent = (
    <div className="flex items-center gap-3 group w-full">
      {/* Category Image - same reusable component as products row */}
      <ImageUploadCell
        value={category.imageUrl}
        bucket="categories"
        onSave={(path) => updateCategory(category.id, { imageUrl: path })}
        onSuccess={handleRefresh}
        alt={category.name || "Category"}
        size="sm"
      />

      {/* Category Info */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">
            {category.name || "Unnamed"}
          </span>
          {category.level === 1 && (
            <Badge variant="outline" className="text-xs shrink-0">
              Main
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs shrink-0">
            {category.productCount} products
          </Badge>
          {hasChildren && (
            <Badge
              variant="outline"
              className="text-xs shrink-0 bg-blue-50 text-blue-700 border-blue-200"
            >
              {category.childrenCount}{" "}
              {category.childrenCount === 1 ? "child" : "children"}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {category.slug || "—"}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            setIsAddOpen(true);
          }}
          title="Add subcategory"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditOpen(true);
          }}
          title="Edit category"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/withAuth/categories/${category.id}`}
                className="cursor-pointer"
              >
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsAddOpen(true)}
              className="cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add subcategory
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsEditOpen(true)}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit category
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsDeleteOpen(true)}
              className="cursor-pointer text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  // If category has children, use accordion
  if (hasChildren) {
    return (
      <>
        <AccordionItem value={category.id} className="border-none">
          <div
            ref={rowRef}
            data-category-id={category.id}
            className={cn(
              "flex items-center gap-3 transition-colors",
              isScrollTarget &&
                "rounded-lg bg-primary/5 ring-1 ring-primary/20",
            )}
          >
            <AccordionTrigger className="flex-1 hover:no-underline py-2 px-3 rounded-lg hover:bg-gray-50">
              {CategoryContent}
            </AccordionTrigger>
          </div>

          <AccordionContent className="pl-8 pt-2">
            {isLoadingChildren ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : children && children.length > 0 ? (
              <div className="space-y-1">
                {children.map((child) => (
                  <CategoryItem
                    key={child.id}
                    category={child}
                    locale={locale}
                    onRefresh={handleRefresh}
                    level={level + 1}
                    expandedIds={expandedIds}
                    scrollToCategoryId={scrollToCategoryId}
                  />
                ))}
              </div>
            ) : children && children.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2">
                No subcategories
              </div>
            ) : null}
          </AccordionContent>
        </AccordionItem>

        {/* Dialogs */}
        <CategoryEditDialog
          category={category}
          locale={locale}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSuccess={handleRefresh}
          allCategories={[]}
        />

        <CategoryAddDialog
          parentId={category.id}
          locale={locale}
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          onSuccess={handleRefresh}
          allCategories={[]}
        />

        <CategoryDeleteDialog
          category={category}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onSuccess={handleRefresh}
        />
      </>
    );
  }

  // If category has no children, render as regular item (no accordion)
  return (
    <>
      <div
        ref={rowRef}
        data-category-id={category.id}
        className={cn(
          "flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 group transition-colors",
          isScrollTarget && "bg-primary/5 ring-1 ring-primary/20",
        )}
      >
        {CategoryContent}
      </div>

      {/* Dialogs */}
      <CategoryEditDialog
        category={category}
        locale={locale}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={handleRefresh}
        allCategories={[]}
      />

      <CategoryAddDialog
        parentId={category.id}
        locale={locale}
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={handleRefresh}
        allCategories={[]}
      />

      <CategoryDeleteDialog
        category={category}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onSuccess={handleRefresh}
      />
    </>
  );
}

interface CategoryTreeProps {
  rootCategories: Category[];
  locale: "en" | "ar";
  onRefresh: () => void;
  expandedIds?: string[];
  onExpandedIdsChange?: (ids: string[]) => void;
  scrollToCategoryId?: string | null;
}

/**
 * Main category tree component
 * Renders root categories and handles lazy loading of children
 */
export function CategoryTree({
  rootCategories,
  locale,
  onRefresh,
  expandedIds: controlledExpandedIds,
  onExpandedIdsChange: controlledOnExpandedIdsChange,
  scrollToCategoryId,
}: CategoryTreeProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [internalExpandedIds, setInternalExpandedIds] = useState<string[]>([]);

  const expandedIds = controlledExpandedIds ?? internalExpandedIds;
  const setExpandedIds =
    controlledOnExpandedIdsChange ?? setInternalExpandedIds;

  if (rootCategories.length === 0) {
    return (
      <>
        <div className="text-center py-12 text-muted-foreground">
          <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No categories found</p>
          <p className="text-sm mb-4">
            Create your first category to get started
          </p>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Root Category
          </Button>
        </div>
        <CategoryAddDialog
          parentId={null}
          locale={locale}
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          onSuccess={onRefresh}
          allCategories={[]}
        />
      </>
    );
  }

  // Separate categories with and without children
  const categoriesWithChildren = rootCategories.filter(
    (cat) => cat.childrenCount > 0,
  );
  const categoriesWithoutChildren = rootCategories.filter(
    (cat) => cat.childrenCount === 0,
  );

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Root Category
        </Button>
      </div>

      <div className="space-y-1">
        {/* Categories with children - use accordion */}
        {categoriesWithChildren.length > 0 && (
          <Accordion
            type="multiple"
            value={expandedIds}
            onValueChange={setExpandedIds}
            className="space-y-1"
          >
            {categoriesWithChildren.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                locale={locale}
                onRefresh={onRefresh}
                expandedIds={expandedIds}
                scrollToCategoryId={scrollToCategoryId}
              />
            ))}
          </Accordion>
        )}

        {/* Categories without children - render as regular items */}
        {categoriesWithoutChildren.length > 0 && (
          <div className="space-y-1">
            {categoriesWithoutChildren.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                locale={locale}
                onRefresh={onRefresh}
                scrollToCategoryId={scrollToCategoryId}
              />
            ))}
          </div>
        )}
      </div>

      <CategoryAddDialog
        parentId={null}
        locale={locale}
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={onRefresh}
        allCategories={[]}
      />
    </>
  );
}
