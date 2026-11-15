import { PageContainer } from "@/components/seller-ui";
import { ListPageSkeleton } from "./orders-page-frame";

export default function Loading() {
  return (
    <PageContainer>
      <ListPageSkeleton />
    </PageContainer>
  );
}
