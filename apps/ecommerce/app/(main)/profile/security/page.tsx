"use client";

import { useAuth } from "@/providers/auth-provider";
import { Toaster } from "@workspace/ui/components/sonner";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { ProfileSidebar, SecurityForm } from "../profile.chunks";
import { getUserAddresses } from "../profile.server";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { UserAddress } from "../profile.types";

// Loading component for security settings
function SecurityLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Loading */}
      <div className="lg:col-span-1 space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>

      {/* Main Content Loading */}
      <div className="lg:col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>

            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main security page component
export default function SecurityPage() {
  const { userWithSeller, isLoadingUserWithSeller } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Fetch addresses when user is available
  useEffect(() => {
    async function fetchAddresses() {
      if (userWithSeller?.user) {
        try {
          const userAddresses = await getUserAddresses();
          setAddresses(userAddresses);
        } catch (error) {
          console.error("Error fetching addresses:", error);
        } finally {
          setLoadingAddresses(false);
        }
      }
    }

    fetchAddresses();
  }, [userWithSeller?.user]);

  // Show loading while checking auth or fetching data
  if (isLoadingUserWithSeller || loadingAddresses) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Toaster />
        <main className="container mx-auto px-4 py-8">
          <nav className="text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>{" "}
            /
            <Link href="/profile" className="hover:text-primary">
              My Account
            </Link>{" "}
            /<span className="text-primary font-medium"> Security</span>
          </nav>
          <SecurityLoading />
        </main>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!userWithSeller?.user) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster />
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>{" "}
          /
          <Link href="/profile" className="hover:text-primary">
            My Account
          </Link>{" "}
          /<span className="text-primary font-medium"> Security</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ProfileSidebar
              addresses={addresses}
              activeTab="security"
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <SecurityForm />
          </div>
        </div>
      </main>
    </div>
  );
}
