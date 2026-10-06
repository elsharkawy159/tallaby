import { Suspense } from "react";
import { AdvertiseData } from "./_components/advertise.data";
import { AdvertiseSkeleton } from "./_components/advertise.skeleton";

export default function AdvertisePage() {
  return (
    <section className="p-4 sm:p-6">
      <Suspense fallback={<AdvertiseSkeleton />}>
        <AdvertiseData />
      </Suspense>
    </section>
  );
}
