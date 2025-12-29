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
      <Card className="rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden pt-0!">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
          <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
            <MapPin className="h-4 w-4 md:h-5 md:w-5" />
            Shipping Information
          </CardTitle>
        </div>
        <CardContent className="p-4 md:p-6">
          <div className="text-center py-6 md:py-8 text-muted-foreground">
            <MapPin className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 opacity-50 animate-pulse" />
            <p className="text-xs md:text-sm">Loading addresses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden p-0 gap-0">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200">
        <CardTitle className="flex items-center gap-2 text-sm md:text-xl font-bold text-gray-900">
          <MapPin className="h-4 w-4 md:h-5 md:w-5" />
          Shipping Information
        </CardTitle>
      </div>
      <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
        {/* Selected Address Display */}
        {selectedAddress ? (
          <div className="space-y-3 md:space-y-4">
            <h4 className="text-xs md:text-sm font-semibold text-foreground">
              Selected Address
            </h4>

            <div className="p-3 md:p-5 bg-gray-50 rounded-lg md:rounded-xl border border-gray-200 space-y-2 md:space-y-3">
              <div className="font-semibold text-gray-900 text-sm md:text-base">
                {selectedAddress.fullName}
              </div>

              <div className="text-xs md:text-sm text-gray-600">
                {selectedAddress.phone}
              </div>

              <div className="text-xs md:text-sm text-gray-700 space-y-1">
                {formatAddressLines(selectedAddress).map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>

              {/* Delivery Instructions */}
              {selectedAddress.deliveryInstructions && (
                <div className="mt-3 md:mt-4 p-2 md:p-3 bg-white rounded-lg border-l-4 border-green-500">
                  <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                    Delivery Instructions:
                  </div>
                  <div className="text-xs md:text-sm text-gray-900">
                    {selectedAddress.deliveryInstructions}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          addresses.length > 0 && (
            <div className="text-center py-6 md:py-8 text-muted-foreground">
              <MapPin className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs md:text-sm">
                Please select a shipping address
              </p>
            </div>
          )
        )}

        {/* No Addresses Available */}
        {addresses.length === 0 && (
          <div className="text-center py-6 md:py-8 text-muted-foreground">
            <MapPin className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs md:text-sm mb-3 md:mb-4">
              No addresses found
            </p>
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
              className="w-full h-9 md:h-11 text-xs md:text-sm border-2 hover:bg-gray-50 transition-colors"
            >
              <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              Change Address
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
};
