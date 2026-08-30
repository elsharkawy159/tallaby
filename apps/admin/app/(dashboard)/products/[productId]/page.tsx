import { ProductDetailData } from "./product-detail.data";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const { productId } = await params;

  return <ProductDetailData productId={productId} />;
}
