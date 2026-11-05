import { Suspense } from "react";
import { PageContainer } from "@/components/seller-ui";
import { AdvertiseData } from "./_components/advertise.data";
import { AdvertiseSkeleton } from "./_components/advertise.skeleton";

export default function AdvertisePage() {
  return (
    <PageContainer>
      <Suspense fallback={<AdvertiseSkeleton />}>
        <AdvertiseData />
      </Suspense>
    </PageContainer>
  );
}
