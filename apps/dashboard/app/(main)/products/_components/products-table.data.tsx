import React from "react";
import { products, productTranslations, db } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import type { ProductTableRow } from "./products-table.types";
import ProductsTable from "./products-table";

export default async function ProductsTableData() {
  const rows: ProductTableRow[] = await db
    .select({
      id: products.id,
      title: productTranslations.title,
      description: productTranslations.description,
      images: products.images,
      isActive: products.isActive,
    })
    .from(products)
    .leftJoin(
      productTranslations,
      and(
        eq(productTranslations.productId, products.id),
        eq(productTranslations.locale, "en")
      )
    )
    .then((results) =>
      results.map((row) => ({
        ...row,
        title: row.title ?? "",
        description: row.description ?? undefined,
        images: Array.isArray(row.images) ? (row.images as string[]) : [],
        isActive: row.isActive ?? false,
      }))
    );

  return <ProductsTable rows={rows} />;
}
