"use client";

import { GripVertical } from "lucide-react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

/**
 * A vertical list the seller reorders by Drag & Drop (mouse, touch, or the
 * keyboard: focus the grip, Space, arrows, Space). Each item renders its own
 * content and places the `handle` (the grip) it is given; `handleLabel` names
 * the item for screen readers ("Drag Email"). Items keep their place until
 * `onReorder` returns the new order. Used by the form editors (Website ›
 * Forms, Store settings › Checkout).
 */
export function SortableList<T>({
  id,
  items,
  getId,
  handleLabel,
  onReorder,
  disabled = false,
  className,
  handleClassName,
  renderItem,
}: {
  /** Stable DndContext id (keeps server and client markup equal). */
  id: string;
  items: readonly T[];
  getId: (item: T) => string;
  handleLabel: (item: T) => string;
  onReorder: (next: T[]) => void;
  disabled?: boolean;
  className?: string;
  handleClassName?: string;
  renderItem: (item: T, index: number, state: { isDragging: boolean; handle: React.ReactNode }) => React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove([...items], from, to));
  };

  return (
    <DndContext id={id} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy} disabled={disabled}>
        <ol className={cn("flex flex-col gap-2.5", className)}>
          {items.map((item, index) => (
            <SortableItem
              key={ids[index]}
              id={ids[index]!}
              disabled={disabled}
              label={handleLabel(item)}
              handleClassName={handleClassName}
              render={(state) => renderItem(item, index, state)}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  id,
  disabled,
  label,
  handleClassName,
  render,
}: {
  id: string;
  disabled: boolean;
  label: string;
  handleClassName?: string;
  render: (state: { isDragging: boolean; handle: React.ReactNode }) => React.ReactNode;
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({ id, disabled });
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "grid size-8 shrink-0 touch-none place-items-center rounded-lg text-(--s-subtle) outline-none hover:bg-(--s-hover) focus-visible:ring-2 focus-visible:ring-ring enabled:cursor-grab enabled:active:cursor-grabbing disabled:opacity-40 max-[600px]:size-10",
        handleClassName,
      )}
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  );
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn("list-none", isDragging && "relative z-10")}>
      {render({ isDragging, handle })}
    </li>
  );
}
