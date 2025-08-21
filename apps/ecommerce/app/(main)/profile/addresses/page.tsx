"use client";

import { useAuth } from "@/providers/auth-provider";
import { Toaster } from "@workspace/ui/components/sonner";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { ProfileSidebar, AddressCard, AddressForm } from "../profile.chunks";
import { getUserAddresses } from "../profile.server";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { UserAddress } from "../profile.types";

// Loading component for addresses
function AddressesLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Loading */}
      <div className="lg:col-span-1 space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>

      {/* Main Content Loading */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Add Address Button Component
function AddAddressButton({
  variant = "default",
}: {
  variant?: "default" | "outline";
}) {
  return (
    <Button variant={variant} asChild>
      <Link href="/profile/addresses/new">
        <Plus className="h-4 w-4 mr-2" />
        Add Address
      </Link>
    </Button>
  );
}

// Main addresses page component
export default function AddressesPage() {
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
            /<span className="text-primary font-medium"> Addresses</span>
          </nav>
          <AddressesLoading />
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
          /<span className="text-primary font-medium"> Addresses</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ProfileSidebar addresses={addresses} activeTab="addresses" />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Delivery Addresses</CardTitle>
                    <CardDescription>
                      Manage your shipping and billing addresses
                    </CardDescription>
                  </div>
                  <AddAddressButton />
                </div>
              </CardHeader>
            </Card>

            {/* Addresses Grid */}
            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    onEdit={(addr) => {
                      // Handle edit - this would open a modal or navigate to edit page
                      console.log("Edit address:", addr);
                    }}
                    onDelete={(addressId) => {
                      // Handle delete - this is already implemented in AddressCard
                      console.log("Delete address:", addressId);
                      // Refresh addresses after delete
                      setAddresses(
                        addresses.filter((addr) => addr.id !== addressId)
                      );
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        No addresses yet
                      </h3>
                      <p className="text-muted-foreground">
                        Add your first delivery address to start shopping
                      </p>
                    </div>
                    <AddAddressButton />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Address Hint */}
            {addresses.length > 0 && addresses.length < 10 && (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Need another address? You can add up to 10 addresses.
                    </p>
                    <AddAddressButton variant="outline" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
