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
      status: products.status,
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
        status: row.status ?? "pending",
      }))
    );

  return <ProductsTable rows={rows} />;
}
