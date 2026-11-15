import { VendorProductsSkeleton } from "./_components/vendor-products.skeleton";
import { PageContainer } from "@/components/seller-ui";

export default function Loading() {
  return (
    <PageContainer>
      <VendorProductsSkeleton />
    </PageContainer>
  );
}
