import { Suspense } from "react";
import { ProfileSidebar } from "./profile.chunks";
import { getUserAddresses } from "./profile.server";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generateNoIndexMetadata();

// Profile Layout Data Component (Server Component)
async function ProfileLayoutData({ children }: { children: React.ReactNode }) {
  // Fetch user addresses on the server
  const addresses = await getUserAddresses();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-4">
          <ProfileSidebar addresses={addresses} activeTab="profile" />
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">{children}</div>
    </div>
  );
}

// Loading fallback for sidebar
function ProfileLayoutSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Skeleton */}
      <div className="lg:col-span-1">
        <div className="space-y-6">
          {/* Profile Card Skeleton */}
          <div className="rounded-lg border bg-card p-6 animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-200 rounded w-48" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-2 bg-gray-200 rounded w-full" />
            </div>
          </div>

          {/* Navigation Skeleton */}
          <div className="rounded-lg border bg-card">
            <div className="p-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 px-4 py-3">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">{children}</div>
    </div>
  );
}

// Main Profile Layout Component
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Breadcrumbs */}
      <DynamicBreadcrumb
        customLabels={{
          orders: "My Orders",
          addresses: "My Addresses",
          wishlist: "My Wishlist",
          security: "Security Settings",
        }}
      />

      {/* Main Content */}
      <main className="container pb-8">
        <Suspense
          fallback={<ProfileLayoutSkeleton>{children}</ProfileLayoutSkeleton>}
        >
          <ProfileLayoutData>{children}</ProfileLayoutData>
        </Suspense>
      </main>
    </div>
  );
}
