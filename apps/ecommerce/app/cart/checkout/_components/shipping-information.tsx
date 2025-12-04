"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { MapPin } from "lucide-react";

import type { AddressData } from "@/components/address/address.schema";
import { AddressSelectorDialog } from "@/components/shared/address-dialog";

interface ShippingInformationProps {
  addresses: AddressData[];
  userId: string;
  onAddressSelect?: (address: AddressData) => void;
  selectedAddressId?: string;
  isLoading?: boolean;
}

export const ShippingInformation = ({
  addresses,
  userId,
  onAddressSelect,
  selectedAddressId,
  isLoading = false,
}: ShippingInformationProps) => {
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(
    addresses.find((addr) => addr.id === selectedAddressId) ||
      addresses[0] ||
      null
  );

  // Update selected address when selectedAddressId or addresses change
  useEffect(() => {
    const address =
      addresses.find((addr) => addr.id === selectedAddressId) ||
      addresses[0] ||
      null;
    setSelectedAddress(address);
  }, [selectedAddressId, addresses]);

  const handleAddressSelect = (address: AddressData) => {
    setSelectedAddress(address);
    onAddressSelect?.(address);
  };

  // Format address for display - returns array of address lines
  const formatAddressLines = (address: AddressData) => {
    const lines: string[] = [];

    // Main address line
    if (address.addressLine1) {
      lines.push(address.addressLine1);
    }

    // Secondary address line
    if (address.addressLine2) {
      lines.push(address.addressLine2);
    }

    // City, state, and postal code
    const cityStatePostal = [address.city, address.state, address.postalCode]
      .filter(Boolean)
      .join(", ");
    if (cityStatePostal) {
      lines.push(cityStatePostal);
    }

    // Country
    if (address.country) {
      lines.push(address.country);
    }

    return lines;
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <MapPin className="h-5 w-5" />
            Shipping Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
            <p className="text-sm">Loading addresses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <MapPin className="h-5 w-5" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Address Display */}
        {selectedAddress ? (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">
              Selected Address
            </h4>

            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="font-semibold text-foreground">
                {selectedAddress.fullName}
              </div>

              <div className="text-sm text-muted-foreground">
                {selectedAddress.phone}
              </div>

              <div className="text-sm text-foreground space-y-1">
                {formatAddressLines(selectedAddress).map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>

              {/* Delivery Instructions */}
              {selectedAddress.deliveryInstructions && (
                <div className="mt-3 p-2 bg-background rounded border-l-2 border-green-500">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Delivery Instructions:
                  </div>
                  <div className="text-sm text-foreground">
                    {selectedAddress.deliveryInstructions}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          addresses.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Please select a shipping address</p>
            </div>
          )
        )}

        {/* No Addresses Available */}
        {addresses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-4">No addresses found</p>
            <p className="text-xs">
              Add your first address to continue with checkout
            </p>
          </div>
        )}

        {/* Change Address Button */}
        <AddressSelectorDialog
          onAddressSelect={handleAddressSelect}
          trigger={
            <Button
              variant="outline"
              className="w-full border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Change Address
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
};
