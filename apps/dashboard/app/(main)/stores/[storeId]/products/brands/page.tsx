import { redirect } from "next/navigation";
import { storeProductsHref } from "@/lib/products/product-routes.lib";
import { loadProductStorePage } from "@/lib/products/product-store.server";

/** The brands list is gone from the dashboard (products no longer have a brand field); old links land on Categories. */
export default async function SellerBrandsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { store } = await loadProductStorePage((await params).storeId);
  redirect(storeProductsHref(store.id, "/categories"));
}
