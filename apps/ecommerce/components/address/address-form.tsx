"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";

// Import our reusable inputs
import { TextInput } from "@workspace/ui/components/inputs/text-input";
import { TextareaInput } from "@workspace/ui/components/inputs/textarea-input";
import { SelectInput } from "@workspace/ui/components/inputs/select-input";
import { SwitchInput } from "@workspace/ui/components/inputs/switch-input";

import {
  addressSchema,
  addressDefaults,
  countries,
  addressTypeOptions,
  type AddressData,
} from "./address.schema";
import { LocationMap } from "./location-map";
import { addAddress, updateAddress } from "@/actions/customer";
// Server actions will be imported from the consuming app

interface AddressFormProps {
  initialData?: Partial<AddressData>;
  onSuccess?: (address: AddressData) => void;
  onCancel?: () => void;
  mode?: "create" | "edit";
}

export const AddressForm = ({
  initialData,
  onSuccess,
  onCancel,
  mode = "create",
}: AddressFormProps) => {
  const [isPending, startTransition] = useTransition();

  // Handle location selection from map
  const handleLocationSelect = (locationData: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }) => {
    // Update form fields with map data
    if (locationData.address) {
      form.setValue("addressLine1", locationData.address);
    }
    if (locationData.city) {
      form.setValue("city", locationData.city);
    }
    if (locationData.state) {
      form.setValue("state", locationData.state);
    }
    if (locationData.country) {
      form.setValue("country", locationData.country);
    }
    if (locationData.postalCode) {
      form.setValue("postalCode", locationData.postalCode);
    }

    // Always set coordinates
    form.setValue("latitude", locationData.latitude);
    form.setValue("longitude", locationData.longitude);

    // Hide map after selection
  };

  // Setup form with react-hook-form
  const form = useForm<AddressData>({
    resolver: zodResolver(addressSchema) as any,
    defaultValues: {
      ...addressDefaults,
      ...initialData,
    },
  });

  // Handle form submission with useTransition
  const handleSubmit = (data: AddressData) => {
    startTransition(async () => {
      try {
        const result =
          mode === "create"
            ? await addAddress(data)
            : await updateAddress(data.id!, data);

        if (result.success) {
          toast.success(
            "Address " +
              (mode === "create" ? "added" : "updated") +
              " successfully"
          );
          form.reset();
          onSuccess?.(result.data as AddressData);
        } else {
          toast.error(
            result.error || "Something went wrong. Please try again."
          );

          // Set server-side field errors
          if (result.error) {
            Object.entries(result.error as any).forEach(([field, messages]) => {
              form.setError(field as keyof AddressData, {
                type: "server",
                message: Array.isArray(messages)
                  ? (messages[0] as string)
                  : String(messages),
              });
            });
          }
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <div className="p-4">
      <h2 className=" pb-4 font-bold">
        {mode === "create" ? "Add New Address" : "Edit Address"}
      </h2>
      <div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit as any)}
            className="space-y-6"
          >
            {/* Personal Information */}
            <div className="space-y-4 bg-white p-4 rounded-lg">
              <h3 className="font-semibold">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  form={form as any}
                  name="fullName"
                  label="Full Name"
                  placeholder="Enter your full name"
                  required
                />

                <TextInput
                  form={form as any}
                  name="phone"
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  type="tel"
                  required
                />
                {/* <SelectInput
                  name="addressType"
                  label="Address Type"
                  placeholder="Select address type"
                  options={addressTypeOptions}
                  required
                /> */}
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4 bg-white p-4 rounded-lg">
              <h3 className="font-semibold">Address Information</h3>

              <LocationMap
                onLocationSelect={handleLocationSelect}
                initialLocation={
                  form.getValues("latitude") && form.getValues("longitude")
                    ? {
                        latitude: form.getValues("latitude")!,
                        longitude: form.getValues("longitude")!,
                      }
                    : undefined
                }
                className="mb-4"
              />

              <TextInput
                form={form as any}
                name="addressLine1"
                label="Address Line 1"
                placeholder="Street address, P.O. box, company name, c/o"
                required
              />

              <TextInput
                form={form as any}
                name="addressLine2"
                label="Address Line 2 (Optional)"
                placeholder="Apartment, suite, unit, building, floor, etc."
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextInput
                  form={form as any}
                  name="city"
                  label="City"
                  placeholder="Enter city"
                  required
                />

                <TextInput
                  form={form as any}
                  name="state"
                  label="State/Province"
                  placeholder="Enter state or province"
                  required
                />

                <TextInput
                  form={form as any}
                  name="postalCode"
                  label="Postal Code"
                  placeholder="Enter postal code"
                  required
                />
              </div>

              {/* <SelectInput
                name="country"
                label="Country"
                placeholder="Select country"
                options={countries}
                required
              /> */}
            </div>

            {/* Company Name */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 min-h-20 rounded-lg">
              <SwitchInput
                name="isBusinessAddress"
                label="Business address"
                labelPosition="right"
                className="space-y-0"
              />
              <div className="flex-1 w-full">
                {form.watch("isBusinessAddress") && (
                  <TextInput
                    form={form as any}
                    name="company"
                    placeholder="Enter company name"
                    required
                    autoFocus
                  />
                )}
              </div>
            </div>

            {/* Delivery Instructions */}
            <div className="space-y-4 bg-white p-4 rounded-lg">
              <h3 className="font-semibold">Delivery Instructions</h3>

              <TextareaInput
                form={form as any}
                name="deliveryInstructions"
                label="Delivery Instructions (Optional)"
                placeholder="Special delivery instructions, gate codes, etc."
                showCharacterCount={true}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                // disabled={isPending || !form.formState.isValid}
                disabled={isPending}
                className="flex-1"
              >
                {isPending
                  ? mode === "create"
                    ? "Creating Address..."
                    : "Updating Address..."
                  : mode === "create"
                    ? "Create Address"
                    : "Update Address"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
