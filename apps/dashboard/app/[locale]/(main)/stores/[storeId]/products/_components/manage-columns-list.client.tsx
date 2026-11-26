"use client";

import { useTranslations } from "next-intl";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";

export type ManageColumnsItem = { id: string; label: string; visible: boolean };

/**
 * The drag-and-drop column list of `ManageColumnsDialog`, loaded as its own
 * chunk the first time the dialog opens (docs/plans/dashboard-performance.md A6),
 * so `@hello-pangea/dnd` stays out of the products page bundle.
 */
export function ManageColumnsList({
  columns,
  onMove,
  onToggle,
}: {
  columns: ManageColumnsItem[];
  /** A column was dragged from one index of `columns` to another. */
  onMove: (from: number, to: number) => void;
  onToggle: (columnId: string, checked: boolean) => void;
}) {
  const t = useTranslations("products.columnsDialog");

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    onMove(result.source.index, result.destination.index);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="product-columns" direction="vertical">
        {(droppableProvided) => (
          <div className="space-y-1" {...droppableProvided.droppableProps} ref={droppableProvided.innerRef}>
            {columns.map((column, index) => (
              <Draggable key={column.id} draggableId={column.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2 transition-colors ${
                      snapshot.isDragging ? "bg-accent shadow-md" : "bg-background"
                    }`}
                  >
                    <span
                      {...provided.dragHandleProps}
                      className="text-muted-foreground cursor-grab active:cursor-grabbing"
                      aria-label={t("reorder", { column: column.label })}
                    >
                      <GripVertical size={16} />
                    </span>
                    <Checkbox
                      id={`manage-column-${column.id}`}
                      checked={column.visible}
                      onCheckedChange={(value) => onToggle(column.id, !!value)}
                    />
                    <Label htmlFor={`manage-column-${column.id}`} className="flex-1 cursor-pointer">
                      {column.label}
                    </Label>
                  </div>
                )}
              </Draggable>
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
