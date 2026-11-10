import { redirect } from "next/navigation";
import { storeProductsHref } from "@/lib/products/product-routes.lib";
import { loadProductStorePage } from "@/lib/products/product-store.server";

/** The old combined page; categories and brands now have their own pages. */
export default async function CategoriesBrandsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { store } = await loadProductStorePage((await params).storeId);
  redirect(storeProductsHref(store.id, "/categories"));
}
