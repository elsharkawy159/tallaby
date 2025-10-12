"use client";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Edit,
  Trash2,
  MapPin,
  Building2,
  Star,
  Phone,
  Plus,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

import type { AddressData } from "../../address/address.schema";
import { useAddress } from "@/providers/address-provider";

interface AddressListStepProps {
  selectedAddress?: AddressData | null;
  onAddressSelect?: (address: AddressData) => void;
  onAddNewAddress: () => void;
  onEditAddress: (address: AddressData) => void;
  onDeleteAddress: (addressId: string) => void;
}

export const AddressListStep = ({
  selectedAddress,
  onAddressSelect,
  onAddNewAddress,
  onEditAddress,
  onDeleteAddress,
}: AddressListStepProps) => {
  // Use the AddressProvider
  const {
    addresses,
    isLoading,
    isDeletingAddress,
    isSettingDefault,
    deleteAddress: deleteAddressAction,
    setDefaultAddress: setDefaultAddressAction,
    refreshAddresses,
  } = useAddress();

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    const result = await deleteAddressAction(addressId);
    if (result.success) {
      onDeleteAddress(addressId);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    await setDefaultAddressAction(addressId);
  };

  const getShortAddress = (address: AddressData) => {
    return `${address.city}, ${address.addressLine1}`;
  };

  if (isLoading) {
    return <AddressListSkeleton />;
  }

  if (addresses.length === 0) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No addresses found</h3>
          <p className="text-muted-foreground text-center mb-6">
            You haven't added any addresses yet. Add your first address to get
            started.
          </p>
          <Button onClick={onAddNewAddress} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Address
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 bg-gray-50">
      {/* Address List */}
      <div className="space-y-3">
        {addresses.map((address: any) => {
          const isDefault = address.isDefault;
          const isDeletingThis = isDeletingAddress;

          return (
            <Card
              key={address.id}
              className={cn(
                "transition-all duration-200 cursor-pointer p-0",
                isDefault && "ring-2 ring-primary border-primary",
                isDeletingThis && "opacity-50 pointer-events-none",
                !isDefault && "hover:ring-2 hover:ring-primary/20",
                isSettingDefault && "opacity-80 pointer-events-none"
              )}
              onClick={() => handleSetDefault(address.id!)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  {/* Address Info */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      {/* <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {getAddressTypeIcon(address.addressType)}
                        <span>{getAddressTypeLabel(address.addressType)}</span>
                      </div> */}

                      {isDefault && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      )}

                      {address.isBusinessAddress && (
                        <Badge variant="outline" className="gap-1">
                          <Building2 className="h-3 w-3" />
                          Business
                        </Badge>
                      )}
                    </div>

                    {/* Address Title/Label */}
                    <h4 className="font-medium text-sm mb-1">
                      {address.fullName}
                    </h4>

                    {/* Short Address */}
                    <p className="text-sm text-muted-foreground mb-2">
                      {getShortAddress(address)}
                    </p>

                    {/* Phone */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{address.phone}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* {!isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(address.id!);
                        }}
                        disabled={setDefaultAddressMutation.isPending}
                        className="text-xs"
                      >
                        <Star className="h-3! w-3! fill-yellow-500 text-yellow-500" />
                        Set as Default
                      </Button>
                    )} */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditAddress(address as AddressData);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {addresses.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(address.id!);
                        }}
                        disabled={isDeletingThis}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Set as Default Button */}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Loading skeleton
const AddressListSkeleton = () => (
  <div className="p-6 space-y-4">
    {Array.from({ length: 2 }, (_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
