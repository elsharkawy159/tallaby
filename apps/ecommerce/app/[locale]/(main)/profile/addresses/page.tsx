import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { getAddresses } from "@/actions/customer";
import { Plus, MapPin } from "lucide-react";
import { AddressManagerDialog } from "@/components/shared/address-dialog";
import type { AddressData } from "@/components/address/address.schema";
import { AddressesClient } from "./addresses.client";

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
export default async function AddressesPage() {
  const addressesResult = await getAddresses();
  const rawAddresses = addressesResult.success
    ? (addressesResult.data ?? [])
    : [];

  // Map addresses to match AddressData type
  const addresses = rawAddresses.map((addr: any) => ({
    ...addr,
    addressType: addr.addressType || "both",
  }));

  return <AddressesClient initialAddresses={addresses} />;
}
