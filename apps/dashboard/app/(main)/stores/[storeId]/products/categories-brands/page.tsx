import { redirect } from "next/navigation";
import { storeProductsHref } from "@/lib/products/product-routes.lib";
import { loadProductStorePage } from "@/lib/products/product-store.server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** The old combined page; categories and brands now have their own pages. */
export default async function CategoriesBrandsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { store } = await loadProductStorePage((await params).storeId);
  redirect(storeProductsHref(store.id, "/categories"));
}
