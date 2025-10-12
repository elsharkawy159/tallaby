"use client";

import { useEffect, useRef, useState } from "react";
import Leaflet from 'leaflet';
import "leaflet/dist/leaflet.css";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Info, MapPin, Navigation, Search } from "lucide-react";
import { toast } from "sonner";

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface LocationMapProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: { latitude: number; longitude: number };
  className?: string;
  form?: any; // Form instance to directly update fields
}

Leaflet.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
  iconUrl: "/leaflet/images/marker-icon.png",
  shadowUrl: "/leaflet/images/marker-shadow.png",
});

export const LocationMap = ({
  onLocationSelect,
  initialLocation,
  className,
}: LocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Default to Cairo center
  const EGYPT_CENTER = { lat: 30.0444, lng: 31.2357 };

  // Search for location using Nominatim API
  const searchLocation = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=eg&limit=5&addressdetails=1`
      );
      const results = await response.json();

      if (results.length > 0) {
        const location = results[0];
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);

        // Center map on found location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);

          // Remove old marker
          if (markerRef.current) {
            markerRef.current.remove();
          }

          // Add new marker
          const marker = Leaflet.marker([lat, lng]).addTo(mapInstanceRef.current);
          markerRef.current = marker;
        }

        setSelectedCoordinates({ lat, lng });

        // Create location data with address details
        const locationData: LocationData = {
          latitude: lat,
          longitude: lng,
          address: location.display_name,
          city:
            location.address?.city ||
            location.address?.town ||
            location.address?.village,
          state: location.address?.state,
          country: location.address?.country,
          postalCode: location.address?.postcode,
        };

        onLocationSelect(locationData);
        toast.success("Location found and selected!");
      } else {
        toast.error("No locations found for your search");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search for location");
    } finally {
      setIsSearching(false);
    }
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = Leaflet.map(mapRef.current).setView(
      initialLocation
        ? [initialLocation.latitude, initialLocation.longitude]
        : [EGYPT_CENTER.lat, EGYPT_CENTER.lng],
      10
    );

    Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );

    mapInstanceRef.current = map;

    // Add initial marker if location provided
    if (initialLocation) {
      const marker = Leaflet.marker([
        initialLocation.latitude,
        initialLocation.longitude,
      ]).addTo(map);
      markerRef.current = marker;
    }

    // Handle click events to select location
    map.on("click", async (e: Leaflet.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Remove old marker
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Add new marker
      const marker = Leaflet.marker([lat, lng]).addTo(map);
      markerRef.current = marker;

      setSelectedCoordinates({ lat, lng });

      // Try to get address details for the clicked location
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
        const result = await response.json();

        const locationData: LocationData = {
          latitude: lat,
          longitude: lng,
          address: result.display_name,
          city:
            result.address?.city ||
            result.address?.town ||
            result.address?.village,
          state: result.address?.state,
          country: result.address?.country,
          postalCode: result.address?.postcode,
        };

        onLocationSelect(locationData);
        toast.success("Location selected!");
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        const locationData: LocationData = {
          latitude: lat,
          longitude: lng,
        };

        onLocationSelect(locationData);
        toast.success("Location selected!");
      }
    });
  }, [initialLocation, onLocationSelect]);

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Center map and add marker
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 13);

          if (markerRef.current) {
            markerRef.current.remove();
          }

          const marker = Leaflet.marker([latitude, longitude]).addTo(
            mapInstanceRef.current
          );
          markerRef.current = marker;
        }

        setSelectedCoordinates({ lat: latitude, lng: longitude });

        // Try to get address details for current location
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const result = await response.json();

          const locationData: LocationData = {
            latitude,
            longitude,
            address: result.display_name,
            city:
              result.address?.city ||
              result.address?.town ||
              result.address?.village,
            state: result.address?.state,
            country: result.address?.country,
            postalCode: result.address?.postcode,
          };

          onLocationSelect(locationData);
          toast.success("Current location selected!");
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          const locationData: LocationData = { latitude, longitude };

          onLocationSelect(locationData);
          toast.success("Current location selected!");
        }
      },
      () => {
        toast.error("Unable to retrieve your location");
      }
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" /> Click anywhere on the map to
          select a location, or use your current location.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search for address, landmark, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchLocation(searchQuery);
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={() => searchLocation(searchQuery)}
              disabled={isSearching || !searchQuery.trim()}
              size="sm"
              className="gap-2"
              type="button"
            >
              <Search className="h-4 w-4" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button
            onClick={handleGetCurrentLocation}
            variant="outline"
            size="sm"
            className="gap-2"
            type="button"
          >
            <Navigation className="h-4 w-4" />
            Use Current Location
          </Button>
          {selectedCoordinates && (
            <div className="text-sm text-muted-foreground">
              Selected: {selectedCoordinates.lat.toFixed(6)},{" "}
              {selectedCoordinates.lng.toFixed(6)}
            </div>
          )}
        </div>

        <div ref={mapRef} className="h-64 w-full rounded-lg border" />
      </CardContent>
    </Card>
  );
};
