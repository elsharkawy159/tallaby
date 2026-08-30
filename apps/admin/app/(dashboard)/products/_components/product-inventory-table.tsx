"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { DataTable } from "@/app/(dashboard)/_components/data-table/data-table";
import type { ProductInventoryRow } from "../products.types";

interface ProductInventoryTableProps {
  rows: ProductInventoryRow[];
  readOnly?: boolean;
}

const statusLabels: Record<ProductInventoryRow["status"], string> = {
  in_stock: "In Stock",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
};

const statusClasses: Record<ProductInventoryRow["status"], string> = {
  in_stock: "bg-green-50 text-green-700 border-green-200",
  low_stock: "bg-amber-50 text-amber-700 border-amber-200",
  out_of_stock: "bg-red-50 text-red-700 border-red-200",
};

export function ProductInventoryTable({
  rows,
  readOnly = false,
}: ProductInventoryTableProps) {
  const columns: ColumnDef<ProductInventoryRow>[] = [
    {
      accessorKey: "variantName",
      header: "Variant",
    },
    {
      accessorKey: "sku",
      header: "SKU",
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.quantity}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant="outline" className={statusClasses[status]}>
            {statusLabels[status]}
          </Badge>
        );
      },
    },
  ];

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No inventory data available.
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchableColumns={[
        { id: "variantName", title: "Variant" },
        { id: "sku", title: "SKU" },
      ]}
      filterableColumns={[
        {
          id: "status",
          title: "Status",
          options: [
            { label: "In Stock", value: "in_stock" },
            { label: "Low Stock", value: "low_stock" },
            { label: "Out of Stock", value: "out_of_stock" },
          ],
        },
      ]}
    />
  );
}
