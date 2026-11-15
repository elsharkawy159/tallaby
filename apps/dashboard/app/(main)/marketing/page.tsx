import { Suspense } from "react";
import { PageContainer } from "@/components/seller-ui";
import { AdvertiseData } from "./_components/advertise.data";
import { AdvertiseSkeleton } from "./_components/advertise.skeleton";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function AdvertisePage() {
  return (
    <PageContainer>
      <Suspense fallback={<AdvertiseSkeleton />}>
        <AdvertiseData />
      </Suspense>
    </PageContainer>
  );
}
