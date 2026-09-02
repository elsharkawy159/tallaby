"use client";

import { useMemo, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import type { Table } from "@tanstack/react-table";
import { Columns3Icon, GripVertical } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  columnLabel,
  FIXED_COLUMN_IDS,
} from "@workspace/ui/components/table-section";
import {
  reconcileColumnOrder,
  useProductColumnsStore,
} from "@/stores/product-columns.store";

/**
 * Column visibility + ordering for the products table. Writes straight to the
 * persisted store so the table updates live — no apply/cancel step.
 */
export function ManageColumnsDialog<TData>({
  table,
}: {
  table: Table<TData>;
}) {
  const [open, setOpen] = useState(false);
  const { order, visibility, setOrder, setVisibility, reset } =
    useProductColumnsStore();

  // Columns the user owns, in the order currently applied to the table.
  const orderedColumns = useMemo(() => {
    const columns = table
      .getAllLeafColumns()
      .filter((column) => !FIXED_COLUMN_IDS.includes(column.id));
    const byId = new Map(columns.map((column) => [column.id, column]));

    return reconcileColumnOrder(
      order,
      columns.map((column) => column.id)
    )
      .map((id) => byId.get(id))
      .filter((column) => column !== undefined);
  }, [table, order]);

  const reorderable = orderedColumns.filter((column) => column.getCanHide());

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index)
      return;

    const moved = reorderable.map((column) => column.id);
    const [dragged] = moved.splice(result.source.index, 1);
    if (!dragged) return;
    moved.splice(result.destination.index, 0, dragged);

    // Splice the reordered ids back into the slots reorderable columns already
    // occupy, so pinned columns (image, actions) keep their positions.
    let cursor = 0;
    const nextOrder = orderedColumns.map((column) =>
      column.getCanHide() ? (moved[cursor++] as string) : column.id
    );

    setOrder(nextOrder);
  };

  const toggle = (columnId: string, checked: boolean) => {
    setVisibility({ ...visibility, [columnId]: checked });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Columns3Icon
            className="-ms-1 opacity-60"
            size={16}
            aria-hidden="true"
          />
          Manage Columns
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage columns</DialogTitle>
          <DialogDescription>
            Show or hide columns, and drag them to change their order in the
            table.
          </DialogDescription>
        </DialogHeader>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="product-columns" direction="vertical">
            {(droppableProvided) => (
              <div
                className="space-y-1"
                {...droppableProvided.droppableProps}
                ref={droppableProvided.innerRef}
              >
                {reorderable.map((column, index) => (
                  <Draggable
                    key={column.id}
                    draggableId={column.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-3 rounded-md border px-3 py-2 transition-colors ${
                          snapshot.isDragging
                            ? "bg-accent shadow-md"
                            : "bg-background"
                        }`}
                      >
                        <span
                          {...provided.dragHandleProps}
                          className="text-muted-foreground cursor-grab active:cursor-grabbing"
                          aria-label={`Reorder ${columnLabel(column)}`}
                        >
                          <GripVertical size={16} />
                        </span>
                        <Checkbox
                          id={`manage-column-${column.id}`}
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            toggle(column.id, !!value)
                          }
                        />
                        <Label
                          htmlFor={`manage-column-${column.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          {columnLabel(column)}
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

        <DialogFooter>
          <Button variant="outline" onClick={reset}>
            Reset to default
          </Button>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
