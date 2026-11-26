"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { Table } from "@tanstack/react-table";
import { Columns3Icon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
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

const loadColumnsList = () => import("./manage-columns-list.client");

// @hello-pangea/dnd loads with the list, only once the dialog opens (the
// trigger starts the download on hover/focus so it is usually ready).
const ManageColumnsList = dynamic(() => loadColumnsList().then((m) => m.ManageColumnsList), {
  ssr: false,
  loading: () => (
    <div className="space-y-1" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-[38px] rounded-md" />
      ))}
    </div>
  ),
});

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
  const t = useTranslations("products.columnsDialog");
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

  const handleMove = (from: number, to: number) => {
    const moved = reorderable.map((column) => column.id);
    const [dragged] = moved.splice(from, 1);
    if (!dragged) return;
    moved.splice(to, 0, dragged);

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

  const preload = () => {
    void loadColumnsList();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onPointerEnter={preload} onFocus={preload}>
          <Columns3Icon
            className="-ms-1 opacity-60"
            size={16}
            aria-hidden="true"
          />
          {t("trigger")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <ManageColumnsList
          columns={reorderable.map((column) => ({
            id: column.id,
            label: columnLabel(column),
            visible: column.getIsVisible(),
          }))}
          onMove={handleMove}
          onToggle={toggle}
        />

        <DialogFooter>
          <Button variant="outline" onClick={reset}>
            {t("reset")}
          </Button>
          <Button onClick={() => setOpen(false)}>{t("done")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
