import type { AddProductFormData } from "./add-product.schema";
import { addProduct } from "./add-product.server";

export type AddProductFormValues = AddProductFormData;

export async function submitProductForm(
  formData: AddProductFormValues,
  productId?: string
): Promise<boolean> {
  try {
    const result = await addProduct(formData);
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
