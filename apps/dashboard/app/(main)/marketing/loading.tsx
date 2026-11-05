import { PageContainer } from "@/components/seller-ui";
import { AdvertiseSkeleton } from "./_components/advertise.skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <AdvertiseSkeleton />
    </PageContainer>
  );
}
