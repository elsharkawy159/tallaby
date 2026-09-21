import { ProductsClient } from "./products.client";

interface ProductsPageProps {
  searchParams?: Promise<{ seller?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { seller } = (await searchParams) ?? {};

  // `seller` may be a seller id (uuid) or slug.
  return <ProductsClient seller={seller?.trim() || undefined} />;
}
