"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Plus, Edit } from "lucide-react";

import { AddressForm } from "./address-form";
import type { AddressData } from "./address.schema";

interface AddressDialogProps {
  mode?: "create" | "edit";
  address?: AddressData;
  trigger?: React.ReactNode;
  onSuccess?: (address: AddressData) => void;
  children?: React.ReactNode;
}

export const AddressDialog = ({
  mode = "create",
  address,
  trigger,
  onSuccess,
  children,
}: AddressDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = (newAddress: AddressData) => {
    setIsOpen(false);
    onSuccess?.(newAddress);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  // Default trigger button
  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <Plus className="h-4 w-4" />
      Add New Address
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <AddressForm
            initialData={address}
            mode={mode}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
    </Dialog>
  );
};

// Convenience components for different use cases
export const AddAddressDialog = ({
  onSuccess,
  trigger,
}: Omit<AddressDialogProps, "mode">) => (
  <AddressDialog
    mode="create"
    onSuccess={onSuccess}
    trigger={trigger}
  />
);

export const EditAddressDialog = ({
  address,
  onSuccess,
  trigger,
}: Omit<AddressDialogProps, "mode">) => (
  <AddressDialog
    mode="edit"
    address={address}
    onSuccess={onSuccess}
    trigger={trigger}
  />
);

// Quick action buttons
export const AddAddressButton = ({
  onSuccess,
}: {
  onSuccess?: (address: AddressData) => void;
}) => (
  <AddAddressDialog
    onSuccess={onSuccess}
    trigger={
      <Button variant="outline" className="gap-2">
        <Plus className="h-4 w-4" />
        Add New Address
      </Button>
    }
  />
);

export const EditAddressButton = ({
  address,
  onSuccess,
}: {
  address: AddressData;
  onSuccess?: (address: AddressData) => void;
}) => (
  <EditAddressDialog
    address={address}
    onSuccess={onSuccess}
    trigger={
      <Button variant="ghost" size="sm" className="gap-2">
        <Edit className="h-4 w-4" />
        Edit
      </Button>
    }
  />
);
