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

interface AddressListStepProps {
  addresses: AddressData[];
  isLoading: boolean;
  onAddressSelect?: (address: AddressData) => void;
  onAddNew: () => void;
  onEdit: (address: AddressData) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
}

export const AddressListStep = ({
  addresses,
  isLoading,
  onAddressSelect,
  onAddNew,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressListStepProps) => {
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
          <Button onClick={onAddNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Address
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3">
      {addresses.map((address) => {
        const isDefault = address.isDefault;

        return (
          <Card
            key={address.id}
            className={cn(
              "transition-all duration-200 cursor-pointer p-0",
              isDefault && "ring-2 ring-primary border-primary",
              !isDefault && "hover:ring-2 hover:ring-primary/20"
            )}
            onClick={() => {
              // Always set as default when clicking an address
              onSetDefault(address.id!);
              // Also call onAddressSelect if provided (for checkout selection)
              if (onAddressSelect) {
                onAddressSelect(address);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
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

                  <h4 className="font-medium text-sm mb-1">
                    {address.fullName}
                  </h4>

                  <p className="text-sm text-muted-foreground mb-2">
                    {getShortAddress(address)}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{address.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(address);
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
                        onDelete(address.id!);
                      }}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

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
