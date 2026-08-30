"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { DataTable } from "@/app/(dashboard)/_components/data-table/data-table";
import { formatProductPrice } from "../products.lib";
import type { ProductVariantRow } from "../products.types";

interface ProductVariantsTableProps {
  variants: ProductVariantRow[];
  readOnly?: boolean;
}

function buildAttributes(variant: ProductVariantRow): Record<string, string> {
  const attributes: Record<string, string> = {};
  if (variant.option1) attributes.option1 = variant.option1;
  if (variant.option2) attributes.option2 = variant.option2;
  if (variant.option3) attributes.option3 = variant.option3;
  return attributes;
}

export function ProductVariantsTable({
  variants,
  readOnly = false,
}: ProductVariantsTableProps) {
  const columns: ColumnDef<ProductVariantRow>[] = [
    {
      accessorKey: "title",
      header: "Variant",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.title ?? "Untitled"}</div>
      ),
    },
    {
      accessorKey: "sku",
      header: "SKU",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => formatProductPrice(row.original.price),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const stock = row.original.stock;
        return (
          <Badge
            variant="outline"
            className={
              stock === 0
                ? "bg-red-50 text-red-700 border-red-200"
                : stock < 10
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-green-50 text-green-700 border-green-200"
            }
          >
            {stock}
          </Badge>
        );
      },
    },
    {
      id: "attributes",
      header: "Options",
      cell: ({ row }) => {
        const attributes = buildAttributes(row.original);
        const entries = Object.entries(attributes);
        if (entries.length === 0) return <span className="text-muted-foreground">—</span>;

        return (
          <div className="flex flex-wrap gap-1">
            {entries.map(([key, value]) => (
              <Badge key={key} variant="outline" className="bg-gray-50">
                {key}: {value}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "position",
      header: "Position",
    },
  ];

  if (variants.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {readOnly
          ? "No variants for this product."
          : "No variants yet. Add variants in the edit form."}
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={variants}
      searchableColumns={[
        { id: "title", title: "Variant Name" },
        { id: "sku", title: "SKU" },
      ]}
    />
  );
}
