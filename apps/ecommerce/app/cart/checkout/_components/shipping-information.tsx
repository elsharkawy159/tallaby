"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { MapPin, Check } from "lucide-react";
import { toast } from "sonner";

import type { AddressData } from "@/components/address/address.schema";
import { AddressSelectorDialog } from "@/components/shared/address-dialog";

interface ShippingInformationProps {
  addresses: AddressData[];
  userId: string;
  onAddressSelect?: (address: AddressData) => void;
  selectedAddressId?: string;
}

export const ShippingInformation = ({
  addresses,
  userId,
  onAddressSelect,
  selectedAddressId,
}: ShippingInformationProps) => {
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(
    addresses.find((addr) => addr.id === selectedAddressId) || null
  );

  const handleAddressSelect = (address: AddressData) => {
    setSelectedAddress(address);
    onAddressSelect?.(address);
    toast.success("Shipping address selected");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <MapPin className="h-5 w-5" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selected Address Display */}
        {selectedAddress && (
          <div className="space-y-4">
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">Selected Address</h4>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {selectedAddress.fullName}
                  </span>
                  {selectedAddress.company && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {selectedAddress.company}
                      </span>
                    </>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  {selectedAddress.phone}
                </div>

                <div className="text-sm space-y-1">
                  <div>{selectedAddress.addressLine1}</div>
                  {selectedAddress.addressLine2 && (
                    <div>{selectedAddress.addressLine2}</div>
                  )}
                  <div>
                    {selectedAddress.city}, {selectedAddress.state}{" "}
                    {selectedAddress.postalCode}
                  </div>
                  <div>{selectedAddress.country}</div>
                </div>

                {/* Delivery Instructions */}
                {selectedAddress.deliveryInstructions && (
                  <div className="mt-3 p-2 bg-background rounded border-l-2 border-primary">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Delivery Instructions:
                    </div>
                    <div className="text-sm">
                      {selectedAddress.deliveryInstructions}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Address Selector */}
        <AddressSelectorDialog
          onAddressSelect={handleAddressSelect}
          trigger={
            <div className="w-full p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">
                  {selectedAddress ? "Change Address" : "Select Address"}
                </span>
              </div>
            </div>
          }
        />

        {/* No Address Selected State */}
        {!selectedAddress && addresses.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Please select a shipping address</p>
          </div>
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
      </CardContent>
    </Card>
  );
};
