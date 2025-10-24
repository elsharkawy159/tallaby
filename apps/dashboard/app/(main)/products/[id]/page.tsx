import { Suspense } from "react";
import { ProductEditData } from "./product-edit.data";
import { ProductEditSkeleton } from "./product-edit.skeleton";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-gray-50/30">
      <Suspense fallback={<ProductEditSkeleton />}>
        <ProductEditData productId={id} />
      </Suspense>
    </div>
  );
}

// Metadata for the page
export const metadata = {
  title: "Edit Product | Dashboard",
  description: "Edit your product listing",
};
