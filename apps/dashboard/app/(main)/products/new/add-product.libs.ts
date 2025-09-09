import { createProduct } from "@/actions/products";
import type { AddProductFormData } from "./add-product.schema";

export type AddProductFormValues = AddProductFormData;

export async function submitProductForm(
  formData: AddProductFormValues,
  productId?: string
): Promise<boolean> {
  try {
    const result = await createProduct(formData as any);
    return result.success;
  } catch (error) {
    console.error("Failed to submit product form:", error);
    throw error;
  }
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
