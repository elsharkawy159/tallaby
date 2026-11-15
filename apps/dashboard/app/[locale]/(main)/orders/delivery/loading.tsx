import { PageContainer } from "@/components/seller-ui";
import { ShippingSkeleton } from "./shipping.skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <ShippingSkeleton />
    </PageContainer>
  );
}
