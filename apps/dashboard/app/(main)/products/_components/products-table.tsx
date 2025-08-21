import React from "react";
import type { ProductTableRow } from "./products-table.types";
import {
  ProductImageCell,
  ProductTitleCell,
  ProductDescriptionCell,
  ProductActionsCell,
  ProductStatusCell,
} from "./products-table.chunks";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@workspace/ui/components/table";

interface ProductsTableProps {
  rows: ProductTableRow[];
}

export default function ProductsTable({ rows }: ProductsTableProps) {
  return (
    <Table>
      <TableCaption>List of your products.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-26">Image</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Actions</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <ProductImageCell images={row.images} title={row.title} />
            </TableCell>
            <TableCell>
              <ProductTitleCell title={row.title} />
            </TableCell>
            <TableCell>
              <ProductDescriptionCell description={row.description} />
            </TableCell>
            <TableCell>
              <ProductActionsCell id={row.id} isActive={row.isActive} />
            </TableCell>
            <TableCell>
              <ProductStatusCell status={row.isActive} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
