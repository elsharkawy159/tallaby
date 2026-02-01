import { getSellerProducts } from "@/actions/products";
import { VendorProductsSection } from "./vendor-products.section";

export async function VendorProductsData() {
  const { data, totalCount } = await getSellerProducts({
    offset: 0,
  });

  const rows = (data || []).map((p: {
    id: string
    title: string
    sku?: string
    images?: string[]
    isActive?: boolean
    isFeatured?: boolean
    quantity?: string | number
    price?: { base?: number; final?: number }
    brand?: { name: string } | null
    category?: { name?: string | null; nameAr?: string | null } | null
  }) => ({
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
    category: p.category ? { name: p.category.name ?? p.category.nameAr ?? null } : null,
  }));

  return <VendorProductsSection products={rows} total={totalCount || 0} />;
}
