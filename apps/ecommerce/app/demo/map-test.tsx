"use client";

import { useState } from "react";
import { LocationMap } from "@/components/address";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export default function MapTestPage() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Egypt Location Map Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the location map functionality for address selection in Egypt
          </p>
        </div>

        <LocationMap
          onLocationSelect={handleLocationSelect}
          className="w-full"
        />

        {selectedLocation && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Location Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <strong>Coordinates:</strong>{" "}
                  {selectedLocation.latitude.toFixed(6)},{" "}
                  {selectedLocation.longitude.toFixed(6)}
                </div>
                {selectedLocation.address && (
                  <div>
                    <strong>Address:</strong> {selectedLocation.address}
                  </div>
                )}
                {selectedLocation.city && (
                  <div>
                    <strong>City:</strong> {selectedLocation.city}
                  </div>
                )}
                {selectedLocation.state && (
                  <div>
                    <strong>State:</strong> {selectedLocation.state}
                  </div>
                )}
                {selectedLocation.country && (
                  <div>
                    <strong>Country:</strong> {selectedLocation.country}
                  </div>
                )}
                {selectedLocation.postalCode && (
                  <div>
                    <strong>Postal Code:</strong> {selectedLocation.postalCode}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>1. Click anywhere on the map to select a location in Egypt</p>
              <p>
                2. Use the "Use Current Location" button to get your GPS
                coordinates
              </p>
              <p>3. The selected location data will appear below the map</p>
              <p>4. This data can be used to populate address form fields</p>
              <p>
                5. Map is restricted to Egypt boundaries for better accuracy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
