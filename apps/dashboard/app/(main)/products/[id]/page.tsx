import { Suspense } from "react";
import { ProductData } from "./product.data";
import { ProductSkeleton } from "./product.skeleton";

// Force dynamic rendering since this page uses cookies for authentication

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen space-y-6 p-6 bg-gray-50">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductData productId={id} />
      </Suspense>
    </div>
  );
}
