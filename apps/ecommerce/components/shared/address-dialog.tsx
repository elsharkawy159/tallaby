"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { MapLocationStep } from "./address-dialog-steps/map-location-step";
import type { AddressData } from "../address/address.schema";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/actions/customer";

type DialogStep = "list" | "map" | "form";

interface AddressDialogProps {
  address?: AddressData;
  trigger?: React.ReactElement;
  onSuccess?: (address: AddressData) => void;
  onAddressSelect?: (address: AddressData) => void;
}

export const AddressDialog = ({
  address,
  trigger,
  onSuccess,
  onAddressSelect,
}: AddressDialogProps) => {
  const router = useRouter();
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
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load addresses when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadAddresses();
    }
  }, [isOpen]);

  // Set editing address if provided
  useEffect(() => {
    if (address) {
      setEditingAddress(address);
    }
  }, [address]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("list");
      if (!address) {
        setEditingAddress(null);
      }
      setSelectedLocation(null);
    }
  }, [isOpen, address]);

  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const result = await getAddresses();
      if (result.success && result.data) {
        setAddresses(result.data as AddressData[]);
      }
    } catch (error) {
      console.error("Failed to load addresses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCurrentStep("list");
      setEditingAddress(null);
      setSelectedLocation(null);
    }
  };

  // Handle address selection
  const handleAddressSelect = (selectedAddress: AddressData) => {
    onAddressSelect?.(selectedAddress);
    toast.success("Address selected");
    setIsOpen(false);
  };

  // Handle add new address
  const handleAddNew = () => {
    setEditingAddress(null);
    setSelectedLocation(null);
    setCurrentStep("map");
  };

  // Handle location confirmation from map
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

  // Handle previous step navigation
  const handlePreviousStep = () => {
    if (currentStep === "map") {
      setCurrentStep("list");
      setSelectedLocation(null);
    } else if (currentStep === "form") {
      setCurrentStep("map");
    }
  };

  // Handle edit address
  const handleEdit = (addr: AddressData) => {
    setEditingAddress(addr);
    setCurrentStep("form");
  };

  // Handle delete address
  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      const result = await deleteAddress(addressId);
      if (result.success) {
        toast.success("Address deleted");
        await loadAddresses();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete address");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete address");
    }
  };

  // Handle set default address
  const handleSetDefault = async (addressId: string) => {
    try {
      const result = await setDefaultAddress(addressId);
      if (result.success) {
        toast.success("Default address updated");
        await loadAddresses();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to set default address");
      }
    } catch (error) {
      console.error("Set default error:", error);
      toast.error("Failed to set default address");
    }
  };

  // Handle form success
  const handleFormSuccess = async (addressData: AddressData) => {
    // Reload addresses to get fresh data
    await loadAddresses();
    router.refresh();

    onSuccess?.(addressData);
    setCurrentStep("list");
    setEditingAddress(null);
    setSelectedLocation(null);
    setIsOpen(false);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    if (editingAddress) {
      // If editing, go back to list
      setCurrentStep("list");
      setEditingAddress(null);
      setSelectedLocation(null);
    } else {
      // If adding new, go back to map
      setCurrentStep("map");
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "list":
        return "Manage Addresses";
      case "map":
        return "Select Location";
      case "form":
        return editingAddress?.id ? "Edit Address" : "Add New Address";
      default:
        return "Manage Addresses";
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <MapPin className="h-4 w-4" />
      Manage Addresses
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] gap-0 overflow-y-auto p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            {getStepTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {currentStep === "list" && (
            <AddressListStep
              addresses={addresses}
              isLoading={isLoading}
              onAddressSelect={handleAddressSelect}
              onAddNew={handleAddNew}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
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
              onCancel={handleFormCancel}
            />
          )}
        </div>

        {currentStep === "list" && (
          <div className="px-6 py-4 border-t bg-white">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button onClick={handleAddNew} className="flex-1 gap-2">
                <Plus className="h-4 w-4" />
                Add New Address
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Simple wrapper for address selection (checkout use case)
export const AddressSelectorDialog = ({
  onAddressSelect,
  trigger,
}: Pick<AddressDialogProps, "onAddressSelect" | "trigger">) => (
  <AddressDialog onAddressSelect={onAddressSelect} trigger={trigger} />
);

// Simple wrapper for address management (profile use case)
export const AddressManagerDialog = ({
  onSuccess,
  trigger,
}: Pick<AddressDialogProps, "onSuccess" | "trigger">) => (
  <AddressDialog onSuccess={onSuccess} trigger={trigger} />
);
