import { ProductSkeleton } from "./product.skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen space-y-6 p-6 bg-gray-50">
      <ProductSkeleton />
    </div>
  );
}
