"use client";

import { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Plus, MapPin } from "lucide-react";
import { toast } from "sonner";

import { AddressListStep } from "./address-dialog-steps/address-list-step";
import { AddressFormStep } from "./address-dialog-steps/address-form-step";
import type { AddressData } from "../address/address.schema";
import { MapLocationStep } from "./address-dialog-steps/map-location-step";

// Step types
type DialogStep = "list" | "map" | "form";

interface AddressDialogProps {
  address?: AddressData;
  addresses?: AddressData[];
  defaultAddress?: AddressData | null;
  trigger?: React.ReactNode;
  onSuccess?: (address: AddressData) => void;
  onAddressSelect?: (address: AddressData) => void;
  children?: React.ReactNode;
}

export const AddressDialog = ({
  address,
  addresses: initialAddresses = [],
  defaultAddress: initialDefaultAddress = null,
  trigger,
  onSuccess,
  onAddressSelect,
  children,
}: AddressDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<DialogStep>("list");
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(
    null
  );
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  } | null>(null);

  // Address selection state (no longer using provider)
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(
    null
  );

  const selectAddress = (address: AddressData | null) => {
    setSelectedAddress(address);
  };

  // Set initial address if provided
  useEffect(() => {
    if (address) {
      setEditingAddress(address);
    }
  }, [address]);

  // Reset to list step when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("list");
      // Only reset editing address if no address prop is provided
      if (!address) {
        setEditingAddress(null);
      }
      setSelectedLocation(null);
    }
  }, [isOpen, address]);

  // Reset state when dialog closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCurrentStep("list");
      setEditingAddress(null);
      setSelectedLocation(null);
    }
  };

  const handlePreviousStep = () => {
    switch (currentStep) {
      case "map":
        setCurrentStep("list");
        break;
      case "form":
        setCurrentStep("map");
        break;
      case "list":
        // Already at first step
        break;
    }
  };

  // Address selection from list
  const handleAddressSelect = (address: AddressData) => {
    selectAddress(address);
    onAddressSelect?.(address);
    toast.success("Address selected");
  };

  // Location selection from map
  const handleLocationConfirm = (location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }) => {
    setSelectedLocation(location);
    setCurrentStep("form");
  };

  // Form submission
  const handleFormSuccess = (addressData: AddressData) => {
    onSuccess?.(addressData);
    // Reset state before closing
    setCurrentStep("list");
    setEditingAddress(null);
    setSelectedLocation(null);
    setIsOpen(false);
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case "list":
        return "Manage Addresses";
      case "map":
        return "Select Location";
      case "form":
        return editingAddress?.id ? "Edit Address" : "Add New Address";
      default:
        return "Address";
    }
  };

  // Default trigger button
  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <MapPin className="h-4 w-4" />
      Manage Addresses
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || children || defaultTrigger}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] gap-0 overflow-y-auto p-0 bg-white">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            {getStepTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {currentStep === "list" && (
            <AddressListStep
              selectedAddress={selectedAddress}
              onAddressSelect={handleAddressSelect}
              onAddNewAddress={() => setCurrentStep("map")}
              onEditAddress={(address) => {
                setEditingAddress(address);
                setCurrentStep("form");
              }}
              onDeleteAddress={(addressId) => {
                // Handle delete and refresh list
                // This will be handled by the AddressListStep component
              }}
            />
          )}

          {currentStep === "map" && (
            <MapLocationStep
              onLocationConfirm={handleLocationConfirm}
              handlePreviousStep={handlePreviousStep}
              initialLocation={
                editingAddress?.latitude && editingAddress?.longitude
                  ? {
                      latitude: editingAddress.latitude,
                      longitude: editingAddress.longitude,
                    }
                  : undefined
              }
            />
          )}

          {currentStep === "form" && (
            <AddressFormStep
              address={editingAddress}
              selectedLocation={selectedLocation}
              onSuccess={handleFormSuccess}
              onCancel={() => setCurrentStep("list")}
            />
          )}
        </div>

        {/* Footer navigation */}

        {currentStep === "list" && (
          <div className="px-6 py-4 border-t bg-white">
            <div className="flex gap-5">
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setCurrentStep("map")}
                  className="flex-1 rounded"
                >
                  <Plus className="h-4 w-4" />
                  Add New Address
                </Button>
              </>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Convenience components for different use cases
export const AddressSelectorDialog = ({
  onAddressSelect,
  trigger,
}: Pick<AddressDialogProps, "onAddressSelect" | "trigger">) => (
  <AddressDialog onAddressSelect={onAddressSelect} trigger={trigger} />
);

export const AddressManagerDialog = ({
  onSuccess,
  trigger,
}: Pick<AddressDialogProps, "onSuccess" | "trigger">) => (
  <AddressDialog onSuccess={onSuccess} trigger={trigger} />
);

export const EditAddressDialog = ({
  address,
  onSuccess,
  trigger,
}: Pick<AddressDialogProps, "address" | "onSuccess" | "trigger">) => (
  <AddressDialog address={address} onSuccess={onSuccess} trigger={trigger} />
);
