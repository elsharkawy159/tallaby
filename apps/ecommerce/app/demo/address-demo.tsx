"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import Link from "next/link";

import {
  ProfileAddressManager,
  CheckoutAddressSelector,
  AddAddressButton,
  type AddressData,
} from "@/components/address";
import {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/actions/address";

// Demo component to showcase address management
export const AddressDemo = () => {
  const userId = "demo-user-123";
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(
    null
  );
  const [mode, setMode] = useState<"profile" | "checkout">("profile");

  const handleAddressSelect = (address: AddressData) => {
    setSelectedAddress(address);
    console.log("Selected address:", address);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Address Management System</h1>
        <p className="text-muted-foreground mb-6">
          Comprehensive address management with CRUD operations and radio group
          selection
        </p>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={mode === "profile" ? "default" : "outline"}
            onClick={() => setMode("profile")}
          >
            Profile Mode
          </Button>
          <Button
            variant={mode === "checkout" ? "default" : "outline"}
            onClick={() => setMode("checkout")}
          >
            Checkout Mode
          </Button>
        </div>
      </div>

      {/* Selected Address Display */}
      {selectedAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Selected Address
              <Badge variant="secondary">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium">{selectedAddress.fullName}</div>
              <div className="text-sm text-muted-foreground">
                {selectedAddress.phone}
              </div>
              <div className="text-sm">
                {selectedAddress.addressLine1}
                {selectedAddress.addressLine2 &&
                  `, ${selectedAddress.addressLine2}`}
              </div>
              <div className="text-sm">
                {selectedAddress.city}, {selectedAddress.state}{" "}
                {selectedAddress.postalCode}
              </div>
              <div className="text-sm">{selectedAddress.country}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Main Address Management */}
      {mode === "profile" ? (
        <ProfileAddressManager
          userId={userId}
          getUserAddresses={getUserAddresses}
          createAddress={createAddress}
          updateAddress={updateAddress}
          deleteAddress={deleteAddress}
          setDefaultAddress={setDefaultAddress}
        />
      ) : (
        <CheckoutAddressSelector
          userId={userId}
          selectedAddressId={selectedAddress?.id}
          onAddressSelect={handleAddressSelect}
          getUserAddresses={getUserAddresses}
          createAddress={createAddress}
          updateAddress={updateAddress}
          deleteAddress={deleteAddress}
          setDefaultAddress={setDefaultAddress}
        />
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <AddAddressButton
              userId={userId}
              onSuccess={(address) => {
                console.log("New address added:", address);
              }}
              createAddress={createAddress}
              updateAddress={updateAddress}
            />

            <Button variant="outline" onClick={() => setSelectedAddress(null)}>
              Clear Selection
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>• Profile Mode: Full CRUD operations with edit/delete actions</p>
            <p>• Checkout Mode: Address selection only with radio group</p>
            <p>• Selected addresses show with primary color border</p>
            <p>• Default addresses are marked with star badges</p>
            <p>• Map integration available in address forms</p>
          </div>

          <div className="pt-4 border-t">
            <Link href="/demo/map-test">
              <Button variant="outline" className="gap-2">
                Test Map Integration
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
