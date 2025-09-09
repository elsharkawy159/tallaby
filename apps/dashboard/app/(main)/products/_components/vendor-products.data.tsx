import { getSellerProducts } from "@/actions/products";
import { VendorProductsSection } from "./vendor-products.section";

export async function VendorProductsData() {
  const { data, totalCount } = await getSellerProducts({
    // limit: 20,
    offset: 0,
  });
console.log("data", data);
  const rows = (data || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    sku: p.sku,
    images: Array.isArray(p.images) ? p.images : [],
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    quantity: typeof p.quantity === 'string' ? parseInt(p.quantity, 10) : (p.quantity ?? 0),
    basePrice: p.price?.base ?? null,
    salePrice: p.price?.final ?? null,
    brand: p.brand ? { name: p.brand.name } : null,
    category: p.category ? { name: p.category.name } : null,
  }))

  return <VendorProductsSection products={rows} total={totalCount || 0} />;
}
