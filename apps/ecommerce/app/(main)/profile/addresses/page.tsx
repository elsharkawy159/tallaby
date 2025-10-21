"use client";

import { useAuth } from "@/providers/auth-provider";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { getUserAddresses } from "../_components/profile.server";
import { useEffect, useState } from "react";
import { Plus, MapPin } from "lucide-react";
import type { UserAddress } from "../_components/profile.types";
import { AddressManagerDialog } from "@/components/shared/address-dialog";
import type { AddressData } from "@/components/address/address.schema";

// Loading component for addresses
function AddressesLoading() {
  return (
    <div className="space-y-6">
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
  );
}

// Add Address Button Component
function AddAddressButton({
  variant = "default",
  onSuccess,
}: {
  variant?: "default" | "outline";
  onSuccess: () => void;
}) {
  return (
    <AddressManagerDialog
      onSuccess={(address: AddressData) => {
        console.log("Address added:", address);
        onSuccess();
      }}
      trigger={
        <Button variant={variant}>
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      }
    />
  );
}

// Main addresses page component
export default function AddressesPage() {
  const { user, isLoading } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Fetch addresses when user is available
  const fetchAddresses = async () => {
    if (user) {
      try {
        const userAddresses = await getUserAddresses();
        setAddresses(userAddresses);
      } catch (error) {
        console.error("Error fetching addresses:", error);
      } finally {
        setLoadingAddresses(false);
      }
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  // Show loading while checking auth or fetching data
  if (isLoading || loadingAddresses) {
    return <AddressesLoading />;
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
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
            <AddAddressButton onSuccess={fetchAddresses} />
          </div>
        </CardHeader>
      </Card>

      {/* Addresses Grid */}
      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <AddressManagerDialog
              key={address.id}
              onSuccess={(updatedAddress: AddressData) => {
                console.log("Address updated:", updatedAddress);
                fetchAddresses();
              }}
              trigger={
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{address.fullName}</h4>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {address.phone}
                      </p>
                      <p className="text-sm">
                        {address.addressLine1}, {address.city}, {address.state}
                      </p>
                      {address.isDefault && (
                        <span className="inline-block px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              }
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
                <h3 className="text-lg font-semibold">No addresses yet</h3>
                <p className="text-muted-foreground">
                  Add your first delivery address to start shopping
                </p>
              </div>
              <AddAddressButton onSuccess={fetchAddresses} />
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
              <AddAddressButton variant="outline" onSuccess={fetchAddresses} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
