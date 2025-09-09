"use client";

import { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Plus, MapPin, AlertCircle, Edit } from "lucide-react";
import { toast } from "sonner";

import { ProfileAddressList, CheckoutAddressList } from "./address-list";
import { AddAddressDialog, AddAddressButton } from "./address-dialog";
// Server actions will be imported from the consuming app
import type { AddressData } from "./address.schema";
import Link from "next/link";

interface AddressManagementProps {
  userId: string;
  mode?: "profile" | "checkout";
  selectedAddressId?: string;
  onAddressSelect?: (address: AddressData) => void;
  className?: string;
  getUserAddresses?: (userId: string) => Promise<any>;
  deleteAddress?: (id: string, userId: string) => Promise<any>;
  setDefaultAddress?: (id: string, userId: string) => Promise<any>;
}

export const AddressManagement = ({
  userId,
  mode = "profile",
  selectedAddressId,
  onAddressSelect,
  className,
  getUserAddresses,
  deleteAddress,
  setDefaultAddress,
}: AddressManagementProps) => {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load addresses on mount
  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!getUserAddresses) {
        setError("Get addresses function not available");
        return;
      }

      const result = await getUserAddresses(userId);

      if (result.success) {
        setAddresses(result.data || []);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error("Load addresses error:", error);
      setError("Failed to load addresses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressUpdate = (updatedAddress: AddressData) => {
    setAddresses((prev) =>
      prev.map((addr) =>
        addr.id === updatedAddress.id ? updatedAddress : addr
      )
    );
    toast.success("Address updated successfully");
  };

  const handleAddressDelete = (addressId: string) => {
    setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
    toast.success("Address deleted successfully");
  };

  const handleAddressAdd = (newAddress: AddressData) => {
    setAddresses((prev) => [newAddress, ...prev]);
    toast.success("Address added successfully");
  };

  if (isLoading) {
    return <AddressManagementSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      {mode === "profile" ? (
        <ProfileAddressManagement
          addresses={addresses}
          userId={userId}
          onAddressUpdate={handleAddressUpdate}
          onAddressDelete={handleAddressDelete}
          onAddressAdd={handleAddressAdd}
          deleteAddress={deleteAddress}
          setDefaultAddress={setDefaultAddress}
        />
      ) : (
        <CheckoutAddressManagement
          addresses={addresses}
          userId={userId}
          selectedAddressId={selectedAddressId}
          onAddressSelect={onAddressSelect}
          onAddressAdd={handleAddressAdd}
          deleteAddress={deleteAddress}
          setDefaultAddress={setDefaultAddress}
        />
      )}
    </div>
  );
};

// Profile mode - full management
const ProfileAddressManagement = ({
  addresses,
  userId,
  onAddressUpdate,
  onAddressDelete,
  onAddressAdd,
  deleteAddress,
  setDefaultAddress,
}: {
  addresses: AddressData[];
  userId: string;
  onAddressUpdate: (address: AddressData) => void;
  onAddressDelete: (addressId: string) => void;
  onAddressAdd: (address: AddressData) => void;
  deleteAddress?: (id: string, userId: string) => Promise<any>;
  setDefaultAddress?: (id: string, userId: string) => Promise<any>;
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Management
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your shipping and billing addresses
          </p>
        </div>
        <AddAddressButton onSuccess={onAddressAdd} />
      </div>
    </CardHeader>
    <CardContent>
      <ProfileAddressList
        addresses={addresses}
        userId={userId}
        onAddressUpdate={onAddressUpdate}
        onAddressDelete={onAddressDelete}
        deleteAddress={deleteAddress}
        setDefaultAddress={setDefaultAddress}
      />
    </CardContent>
  </Card>
);

// Checkout mode - selection only
const CheckoutAddressManagement = ({
  addresses,
  userId,
  selectedAddressId,
  onAddressSelect,
  onAddressAdd,
  deleteAddress,
  setDefaultAddress,
}: {
  addresses: AddressData[];
  userId: string;
  selectedAddressId?: string;
  onAddressSelect?: (address: AddressData) => void;
  onAddressAdd: (address: AddressData) => void;
  deleteAddress?: (id: string, userId: string) => Promise<any>;
  setDefaultAddress?: (id: string, userId: string) => Promise<any>;
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Select Address</h3>

      <AddAddressDialog
        onSuccess={onAddressAdd}
        trigger={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Address
          </Button>
        }
      />
    </div>

    <CheckoutAddressList
      addresses={addresses}
      userId={userId}
      selectedAddressId={selectedAddressId}
      onAddressSelect={onAddressSelect}
      deleteAddress={deleteAddress}
      setDefaultAddress={setDefaultAddress}
    />
    <Button className="flex" asChild size="sm" variant="outline">
      <Link href="/profile/addresses/new">
        Manage Addresses
        <Edit />
      </Link>
    </Button>
  </div>
);

// Loading skeleton
const AddressManagementSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {Array.from({ length: 2 }, (_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-4 w-4 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </CardContent>
  </Card>
);

// Export convenience components
export const ProfileAddressManager = ({
  userId,
  getUserAddresses,
  deleteAddress,
  setDefaultAddress,
}: {
  userId: string;
  getUserAddresses?: (userId: string) => Promise<any>;
  deleteAddress?: (id: string, userId: string) => Promise<any>;
  setDefaultAddress?: (id: string, userId: string) => Promise<any>;
}) => (
  <AddressManagement
    userId={userId}
    mode="profile"
    getUserAddresses={getUserAddresses}
    deleteAddress={deleteAddress}
    setDefaultAddress={setDefaultAddress}
  />
);

export const CheckoutAddressSelector = ({
  userId,
  selectedAddressId,
  onAddressSelect,
  getUserAddresses,
  deleteAddress,
  setDefaultAddress,
}: {
  userId: string;
  selectedAddressId?: string;
  onAddressSelect?: (address: AddressData) => void;
  getUserAddresses?: (userId: string) => Promise<any>;
  deleteAddress?: (id: string, userId: string) => Promise<any>;
  setDefaultAddress?: (id: string, userId: string) => Promise<any>;
}) => (
  <AddressManagement
    userId={userId}
    mode="checkout"
    selectedAddressId={selectedAddressId}
    onAddressSelect={onAddressSelect}
    getUserAddresses={getUserAddresses}
    deleteAddress={deleteAddress}
    setDefaultAddress={setDefaultAddress}
  />
);
