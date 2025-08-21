"use server";
import { db } from "@workspace/db";
import { products } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function activateProduct(productId: string) {
  await db
    .update(products)
    .set({ isActive: true })
    .where(eq(products.id, productId));
}

export async function deactivateProduct(productId: string) {
  await db
    .update(products)
    .set({ isActive: false })
    .where(eq(products.id, productId));
}
