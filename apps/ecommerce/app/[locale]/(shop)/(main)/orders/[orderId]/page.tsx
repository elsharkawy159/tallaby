import { Suspense } from "react";
import type { Metadata } from "next";
import { OrderConfirmationData } from "./_components/order-confirmation.data";
import { OrderConfirmationSkeleton } from "./_components/order-confirmation.skeleton";
import { generateNoIndexMetadata } from "@/lib/metadata";
import { HostStoreTracking } from "@/components/storefront/host-store-tracking";

export const metadata: Metadata = generateNoIndexMetadata();

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ review?: string; access?: string }>;
}) {
  const { orderId } = await params;
  const { review: autoExpandReviewItemId, access: accessToken } = await searchParams;

  return (
    <div className="py-4 md:py-8">
      <Suspense fallback={<OrderConfirmationSkeleton />}>
        <OrderConfirmationData
          orderId={orderId}
          accessToken={accessToken}
          autoExpandReviewItemId={autoExpandReviewItemId}
        />
      </Suspense>
      <Suspense fallback={null}>
        <HostStoreTracking />
      </Suspense>
    </div>
  );
}
