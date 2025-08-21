import { Suspense } from "react";
import { VendorProfileData } from "./_components/vendor-profile.data";
import { VendorProfileSkeleton } from "./_components/vendor-profile.skeleton";

export default function VendorProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your business profile and store information
        </p>
      </div>

      <Suspense fallback={<VendorProfileSkeleton />}>
        <VendorProfileData />
      </Suspense>
    </div>
  );
}
