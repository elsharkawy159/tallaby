import { Suspense } from "react";
import { Metadata } from "next";

import {
  HeroSection,
  StatsSection,
  PricingSection,
  TestimonialsSection,
  ApplicationFormSection,
} from "./become-seller.chunks";
import {
  getBenefitsData,
  getStatsData,
  getTestimonialsData,
  getPricingPlansData,
} from "./become-seller.lib";
import { getSellerApplicationStatus } from "./become-seller.server";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import Link from "next/link";

// Metadata for SEO
export const metadata: Metadata = {
  title: "Become a Seller | Join Our Marketplace",
  description:
    "Start selling on our platform and reach millions of customers. Apply now to become a verified seller with competitive rates and powerful tools.",
  keywords: [
    "become seller",
    "sell online",
    "marketplace",
    "ecommerce",
    "vendor",
  ],
  openGraph: {
    title: "Become a Seller | Join Our Marketplace",
    description:
      "Start selling on our platform and reach millions of customers.",
    type: "website",
  },
};

export default async function BecomeSeller() {
  // Get static data for sections
  const benefits = getBenefitsData();
  const stats = getStatsData();
  const testimonials = getTestimonialsData();
  const plans = getPricingPlansData();

  // Check if user already has a seller application
  const sellerStatus = await getSellerApplicationStatus();
  return (
    <div className="min-h-screen flex flex-col">
      {/* <DynamicBreadcrumb
        customLabels={{ "become-seller": "Become a Seller" }}
      /> */}
      <main className="flex-1">
        <HeroSection />

        {/* <StatsSection stats={stats} /> */}

        {/* <BenefitsSection benefits={benefits} /> */}

        {/* <PricingSection plans={plans} /> */}

        {/* <TestimonialsSection testimonials={testimonials} /> */}

        <Suspense
          fallback={
            <div className="py-20 bg-gray-50">
              <div className="container">
                <div className="max-w-2xl mx-auto">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-12"></div>
                    <div className="bg-white rounded-lg p-8">
                      <div className="space-y-4">
                        {Array.from({ length: 8 }, (_, i) => (
                          <div
                            key={i}
                            className="h-12 bg-gray-200 rounded"
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          {sellerStatus.exists ? (
            <section className="py-20 bg-gray-50" id="become-seller-section">
              <div className="container">
                <div className="max-w-2xl mx-auto text-center">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Application Status
                  </h2>
                  <div className="bg-white rounded-lg p-8 shadow-sm">
                    <p className="text-lg mb-4">
                      You already have a seller application for{" "}
                      <strong>{(sellerStatus as any).businessName}</strong>
                    </p>
                    <p className="text-gray-600 mb-6">
                      Status:{" "}
                      <span className="font-medium capitalize">
                        {(sellerStatus as any).status}
                      </span>
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                      >
                        Home
                      </Link>
                      <Link
                        href="/profile"
                        className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <ApplicationFormSection user={sellerStatus?.user} />
          )}
        </Suspense>
      </main>
    </div>
  );
}
