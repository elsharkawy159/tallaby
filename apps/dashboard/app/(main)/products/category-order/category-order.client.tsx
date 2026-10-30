"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowUpToLine, GripVertical, LoaderCircle, RotateCcw } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { FieldHint } from "@/components/form/form-ui";
import { RemoteImage } from "@/components/media/remote-image";
import { cn, getPublicUrl } from "@/lib/utils";
import { CATEGORY_ORDER_MAX_PRODUCTS, type CategoryOrderError, type CategoryOrderProduct } from "./category-order.dto";
import { moveItem } from "./category-order.lib";
import { loadCategoryProductOrder, resetCategoryProductOrder, saveCategoryProductOrder } from "./category-order.server";

/**
 * Products › Categories › "Arrange products" (ROADMAP.md F-24d): drag one
 * category's products into the order its store category page shows them.
 * Saving stores the whole list as the seller sees it.
 */
export function CategoryOrderDialog({
  category,
  onClose,
}: {
  /** The category being arranged; null keeps the dialog closed. */
  category: { id: string; label: string } | null;
  onClose: () => void;
}) {
  const t = useTranslations("categoryOrder");
  const [items, setItems] = useState<CategoryOrderProduct[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const categoryId = category?.id ?? null;

  const showError = (error: CategoryOrderError) => {
    toast.error(t(`errors.${error}`));
  };

  useEffect(() => {
    if (!categoryId) return;
    let live = true;
    setItems(null);
    setDirty(false);
    loadCategoryProductOrder(categoryId).then((result) => {
      if (!live) return;
      if (!result.success) {
        showError(result.error);
        onClose();
        return;
      }
      setItems(result.products);
      setTruncated(result.truncated);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when another category opens
  }, [categoryId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const move = (from: number, to: number) => {
    if (!items) return;
    setItems(moveItem(items, from, to));
    setDirty(true);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!items || !over || active.id === over.id) return;
    move(
      items.findIndex((i) => i.id === active.id),
      items.findIndex((i) => i.id === over.id),
    );
  };

  const save = () => {
    if (!categoryId || !items) return;
    startSaving(async () => {
      const result = await saveCategoryProductOrder({ categoryId, productIds: items.map((i) => i.id) });
      if (!result.success) {
        showError(result.error);
        return;
      }
      toast.success(t("saved"));
      onClose();
    });
  };

  const reset = () => {
    if (!categoryId) return;
    startSaving(async () => {
      const result = await resetCategoryProductOrder(categoryId);
      if (!result.success) {
        showError(result.error);
        return;
      }
      toast.success(t("resetDone"));
      onClose();
    });
  };

  const hasPlaced = items?.some((i) => i.placed) ?? false;

  return (
    <Dialog open={!!category} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title", { name: category?.label ?? "" })}</DialogTitle>
          <DialogDescription className="text-pretty">{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {items === null ? (
            <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              {t("loading")}
            </p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="space-y-2">
              {truncated && <FieldHint>{t("truncated", { max: CATEGORY_ORDER_MAX_PRODUCTS })}</FieldHint>}
              <DndContext id="category-order" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  <ol className="divide-y rounded-xl border">
                    {items.map((item, index) => (
                      <ProductRow
                        key={item.id}
                        item={item}
                        index={index}
                        disabled={isSaving || items.length < 2}
                        label={item.title || t("untitled")}
                        onMoveTop={() => move(index, 0)}
                      />
                    ))}
                  </ol>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={reset} disabled={isSaving || !hasPlaced}>
            <RotateCcw className="size-4" />
            {t("reset")}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={save} disabled={isSaving || !items?.length || (!dirty && hasPlaced)}>
              {isSaving && <LoaderCircle className="size-4 animate-spin" />}
              {t("save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductRow({
  item,
  index,
  disabled,
  label,
  onMoveTop,
}: {
  item: CategoryOrderProduct;
  index: number;
  disabled: boolean;
  label: string;
  onMoveTop: () => void;
}) {
  const t = useTranslations("categoryOrder");
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });
  const src = item.image ? getPublicUrl(item.image, "products") : "";
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("flex items-center gap-3 bg-card px-3 py-2", isDragging && "relative z-10 rounded-lg shadow-md")}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label={t("dragHandle", { name: label })}
        className="-ms-1 flex size-8 shrink-0 touch-none items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring enabled:cursor-grab enabled:active:cursor-grabbing disabled:opacity-40"
      >
        <GripVertical className="size-4" />
      </button>
      <span className="w-6 shrink-0 text-center text-xs tabular-nums text-muted-foreground">{index + 1}</span>
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
        {src ? <RemoteImage src={src} alt="" width={40} height={40} className="size-full object-cover" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {item.price != null && <span className="tabular-nums">{item.price.toLocaleString()}</span>}
          {item.status !== "active" && <Badge variant="muted">{t("draft")}</Badge>}
          {!item.placed && <span>{t("unplaced")}</span>}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onMoveTop}
        disabled={disabled || index === 0}
        aria-label={t("moveTop", { name: label })}
      >
        <ArrowUpToLine className="size-4" />
      </Button>
    </li>
  );
}
