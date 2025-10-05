import { Suspense } from "react";
import { ProfileSidebar, ProfileForm } from "./profile.chunks";
import { getUserAddresses } from "./profile.server";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import Link from "next/link";
import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generateNoIndexMetadata();

async function ProfileData() {
  // Fetch addresses on server
  const addresses = await getUserAddresses();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <ProfileSidebar addresses={addresses} activeTab="profile" />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        <ProfileForm />
      </div>
    </div>
  );
}

// Main page component
export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DynamicBreadcrumb customLabels={{ profile: "My Account" }} />
      <main className="container py-8">
        <Suspense fallback={null}>
          <ProfileData />
        </Suspense>
      </main>
    </div>
  );
}
