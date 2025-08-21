import { Suspense } from "react";
import { ProfileSidebar, ProfileForm } from "./profile.chunks";
import { getUserAddresses } from "./profile.server";
import Link from "next/link";

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
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>{" "}
          /<span className="text-primary font-medium"> My Account</span>
        </nav>

        <Suspense fallback={null}>
          <ProfileData />
        </Suspense>
      </main>
    </div>
  );
}
