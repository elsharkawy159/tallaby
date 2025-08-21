import React from "react";
import { products } from "@workspace/db";
import { db } from "@workspace/db";
import type { ProductTableRow } from "./products-table.types";
import ProductsTable from "./products-table";

export default async function ProductsTableData() {
  // TODO: Filter by vendor when multi-vendor context is available
  const rows: ProductTableRow[] = await db
    .select({
      id: products.id,
      title: products.title,
      description: products.description,
      images: products.images,
      isActive: products.isActive,
    })
    .from(products)
    .then((results) =>
      results.map((row) => ({
        ...row,
        description: row.description ?? undefined,
        images: Array.isArray(row.images) ? (row.images as string[]) : [],
        isActive: row.isActive ?? false,
      }))
    );

  return <ProductsTable rows={rows} />;
}
