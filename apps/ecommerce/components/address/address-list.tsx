"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { Label } from "@workspace/ui/components/label";
import {
  Edit,
  Trash2,
  MapPin,
  Building2,
  Home,
  Star,
  Phone,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { toast } from "sonner";

import { EditAddressDialog } from "./address-dialog";
import type { AddressData } from "./address.schema";

interface AddressListProps {
  addresses: AddressData[];
  userId: string;
  selectedAddressId?: string;
  onAddressSelect?: (address: AddressData) => void;
  onAddressUpdate?: (address: AddressData) => void;
  onAddressDelete?: (addressId: string) => void;
  showActions?: boolean;
  showDefaultToggle?: boolean;
  className?: string;
  deleteAddress?: (id: string, userId: string) => Promise<any>;
  setDefaultAddress?: (id: string, userId: string) => Promise<any>;
}

export const AddressList = ({
  addresses,
  userId,
  selectedAddressId,
  onAddressSelect,
  onAddressUpdate,
  onAddressDelete,
  showActions = true,
  showDefaultToggle = true,
  className,
  deleteAddress,
  setDefaultAddress,
}: AddressListProps) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    if (!deleteAddress) {
      toast.error("Delete function not available");
      return;
    }

    setIsDeleting(addressId);
    try {
      const result = await deleteAddress(addressId, userId);

      if (result.success) {
        toast.success(result.message);
        onAddressDelete?.(addressId);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Delete address error:", error);
      toast.error("Failed to delete address");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!setDefaultAddress) {
      toast.error("Set default function not available");
      return;
    }

    try {
      const result = await setDefaultAddress(addressId, userId);

      if (result.success) {
        toast.success(result.message);
        // Refresh the list or update the addresses
        window.location.reload(); // Simple refresh for now
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Set default address error:", error);
      toast.error("Failed to set default address");
    }
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "shipping":
        return <MapPin className="h-4 w-4" />;
      case "billing":
        return <Building2 className="h-4 w-4" />;
      case "both":
        return <Home className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case "shipping":
        return "Shipping";
      case "billing":
        return "Billing";
      case "both":
        return "Both";
      default:
        return "Address";
    }
  };

  if (addresses.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No addresses found</h3>
          <p className="text-muted-foreground text-center mb-4">
            You haven't added any addresses yet. Add your first address to get
            started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <RadioGroup
        value={selectedAddressId || ""}
        onValueChange={(value) => {
          const address = addresses.find((addr) => addr.id === value);
          if (address) {
            onAddressSelect?.(address);
          }
        }}
        className="grid lg:grid-cols-2 gap-4 grid-cols-1"
      >
        {addresses.map((address) => {
          const isSelected = selectedAddressId === address.id;
          const isDefault = address.isDefault;
          const isDeletingThis = isDeleting === address.id;

          return (
            <Label htmlFor={address.id} className="cursor-pointer">
              <Card
                key={address.id}
                className={cn(
                  "transition-all ring-1 h-full ring-gray-300 duration-200 p-0 flex-1",
                  isSelected && "ring-2 ring-primary border-primary",
                  isDeletingThis && "opacity-50 pointer-events-none"
                )}
              >
                <CardContent className="p-4">
                  <div>
                    {/* Radio Button */}
                    <RadioGroupItem
                      value={address.id!}
                      id={address.id}
                      className="hidden"
                    />

                    {/* Address Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {getAddressTypeIcon(address.addressType)}
                            <span>
                              {getAddressTypeLabel(address.addressType)}
                            </span>
                          </div>

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

                        {/* Actions */}
                        {showActions && (
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <EditAddressDialog
                              address={address}
                              onSuccess={onAddressUpdate}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </Button>
                              }
                            />

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(address.id!)}
                              disabled={isDeletingThis}
                              className="gap-1 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Address Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {address.fullName}
                          </span>
                          {address.company && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">
                                {address.company}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{address.phone}</span>
                        </div>

                        <div className="text-sm">
                          <div>{address.addressLine1}</div>
                          {address.addressLine2 && (
                            <div>{address.addressLine2}</div>
                          )}
                          <div>
                            {address.city}, {address.state} {address.postalCode}
                          </div>
                          <div>{address.country}</div>
                        </div>

                        {/* Delivery Instructions */}
                        {address.deliveryInstructions && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                            <div className="font-medium text-muted-foreground mb-1">
                              Delivery Instructions:
                            </div>
                            <div>{address.deliveryInstructions}</div>
                          </div>
                        )}
                      </div>

                      {/* Default Toggle */}
                      {showDefaultToggle && !isDefault && (
                        <div
                          className="mt-3 pt-3 border-t"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(address.id!)}
                            className="gap-1"
                          >
                            <Star className="h-4 w-4" />
                            Set as Default
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
};

// Simplified version for checkout
export const CheckoutAddressList = ({
  addresses,
  userId,
  selectedAddressId,
  onAddressSelect,
  className,
}: Omit<AddressListProps, "showActions" | "showDefaultToggle">) => (
  <AddressList
    addresses={addresses}
    userId={userId}
    selectedAddressId={selectedAddressId}
    onAddressSelect={onAddressSelect}
    showActions={false}
    showDefaultToggle={false}
    className={className}
  />
);

// Full management version for profile
export const ProfileAddressList = ({
  addresses,
  userId,
  onAddressUpdate,
  onAddressDelete,
  className,
}: Omit<
  AddressListProps,
  "selectedAddressId" | "onAddressSelect" | "showActions" | "showDefaultToggle"
>) => (
  <AddressList
    addresses={addresses}
    userId={userId}
    showActions={true}
    showDefaultToggle={true}
    onAddressUpdate={onAddressUpdate}
    onAddressDelete={onAddressDelete}
    className={className}
  />
);
