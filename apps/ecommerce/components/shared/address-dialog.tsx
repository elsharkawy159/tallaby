"use client";

import { useState, useTransition } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { ArrowLeft, ArrowRight, Plus, MapPin } from "lucide-react";
import { toast } from "sonner";

import { AddressListStep } from "./address-dialog-steps/address-list-step";
import { AddressFormStep } from "./address-dialog-steps/address-form-step";
import type { AddressData } from "../address/address.schema";
import { MapLocationStep } from "./address-dialog-steps/map-location-step";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from "@/actions/customer";

// Step types
type DialogStep = "list" | "map" | "form";

interface AddressDialogProps {
  mode?: "create" | "edit" | "select";
  address?: AddressData;
  trigger?: React.ReactNode;
  onSuccess?: (address: AddressData) => void;
  onAddressSelect?: (address: AddressData) => void;
  children?: React.ReactNode;
}

export const AddressDialog = ({
  mode = "select",
  address,
  trigger,
  onSuccess,
  onAddressSelect,
  children,
}: AddressDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<DialogStep>("list");
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(
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

  // Reset state when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCurrentStep("list");
      //   setSelectedAddress(null);
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
    if (mode === "select") {
      setSelectedAddress(address);
      setIsOpen(false);
      toast.success("Address selected successfully");
    } else {
      setCurrentStep("form");
    }
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
    setIsOpen(false);
    toast.success(
      mode === "create"
        ? "Address added successfully"
        : mode === "edit"
          ? "Address updated successfully"
          : "Address saved successfully"
    );
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case "list":
        return mode === "select" ? "Select Address" : "Manage Addresses";
      case "map":
        return "Select Location";
      case "form":
        return mode === "edit" ? "Edit Address" : "Add New Address";
      default:
        return "Address";
    }
  };

  // Default trigger button
  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <MapPin className="h-4 w-4" />
      {mode === "select" ? "Select Address" : "Manage Addresses"}
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
              mode={mode}
              selectedAddress={selectedAddress}
              onAddressSelect={handleAddressSelect}
              onAddNewAddress={() => setCurrentStep("map")}
              onEditAddress={(address) => {
                setSelectedAddress(address);
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
                selectedAddress?.latitude && selectedAddress?.longitude
                  ? {
                      latitude: selectedAddress.latitude,
                      longitude: selectedAddress.longitude,
                    }
                  : undefined
              }
            />
          )}

          {currentStep === "form" && (
            <AddressFormStep
              mode={mode}
              address={selectedAddress}
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
  <AddressDialog
    mode="select"
    onAddressSelect={onAddressSelect}
    trigger={trigger}
  />
);

export const AddressManagerDialog = ({
  onSuccess,
  trigger,
}: Pick<AddressDialogProps, "onSuccess" | "trigger">) => (
  <AddressDialog mode="create" onSuccess={onSuccess} trigger={trigger} />
);

export const EditAddressDialog = ({
  address,
  onSuccess,
  trigger,
}: Pick<AddressDialogProps, "address" | "onSuccess" | "trigger">) => (
  <AddressDialog
    mode="edit"
    address={address}
    onSuccess={onSuccess}
    trigger={trigger}
  />
);
