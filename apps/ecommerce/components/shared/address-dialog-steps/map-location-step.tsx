"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { ArrowLeft, Check, Navigation, Plus, Search } from "lucide-react";
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

interface MapLocationStepProps {
  onLocationConfirm: (location: LocationData) => void;
  handlePreviousStep: () => void;
  initialLocation?: { latitude: number; longitude: number };
}

export const MapLocationStep = ({
  onLocationConfirm,
  handlePreviousStep,
  initialLocation,
}: MapLocationStepProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Default to Cairo center
  const EGYPT_CENTER = { lat: 30.0444, lng: 31.2357 };

  const searchLocation = async (query: string) => {
    if (!query.trim() || !isMapLoaded) return;

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

          // Dynamically import Leaflet
          const Leaflet = await import("leaflet");

          // Add new marker
          const marker = Leaflet.marker([lat, lng]).addTo(
            mapInstanceRef.current
          );
          markerRef.current = marker;
        }

        setSelectedCoordinates({ lat, lng });
        toast.success("Location found!");
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

    const initializeMap = async () => {
      try {
        // Dynamically import Leaflet and CSS
        const Leaflet = await import("leaflet");
        await import("leaflet/dist/leaflet.css");

        // Fix for Leaflet marker icons
        Leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
          iconUrl: "/leaflet/images/marker-icon.png",
          shadowUrl: "/leaflet/images/marker-shadow.png",
        });

        const map = Leaflet.map(mapRef.current).setView(
          initialLocation
            ? [initialLocation.latitude, initialLocation.longitude]
            : [EGYPT_CENTER.lat, EGYPT_CENTER.lng],
          10
        );

        Leaflet.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        ).addTo(map);

        mapInstanceRef.current = map;
        setIsMapLoaded(true);

        // Add initial marker if location provided
        if (initialLocation) {
          const marker = Leaflet.marker([
            initialLocation.latitude,
            initialLocation.longitude,
          ]).addTo(map);
          markerRef.current = marker;
          setSelectedCoordinates({
            lat: initialLocation.latitude,
            lng: initialLocation.longitude,
          });
        }

        // Handle click events to select location
        map.on("click", async (e: any) => {
          const { lat, lng } = e.latlng;

          // Remove old marker
          if (markerRef.current) {
            markerRef.current.remove();
          }

          // Add new marker
          const marker = Leaflet.marker([lat, lng]).addTo(map);
          markerRef.current = marker;

          setSelectedCoordinates({ lat, lng });
          toast.success("Location selected!");
        });
      } catch (error) {
        console.error("Failed to initialize map:", error);
        toast.error("Failed to load map");
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialLocation]);

  // Get current location
  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation || !isMapLoaded) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Center map and add marker
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 13);

          if (markerRef.current) {
            markerRef.current.remove();
          }

          // Dynamically import Leaflet
          const Leaflet = await import("leaflet");

          const marker = Leaflet.marker([latitude, longitude]).addTo(
            mapInstanceRef.current
          );
          markerRef.current = marker;
        }

        setSelectedCoordinates({ lat: latitude, lng: longitude });
        toast.success("Current location found!");
        setIsLocating(false);
      },
      () => {
        toast.error("Unable to retrieve your location");
        setIsLocating(false);
      }
    );
  };

  // Handle location confirmation
  const handleConfirmLocation = async () => {
    if (!selectedCoordinates) {
      toast.error("Please select a location on the map");
      return;
    }

    try {
      // Try to get address details for the selected location
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedCoordinates.lat}&lon=${selectedCoordinates.lng}&addressdetails=1`
      );
      const result = await response.json();

      const locationData: LocationData = {
        latitude: selectedCoordinates.lat,
        longitude: selectedCoordinates.lng,
        address: result.display_name,
        city:
          result.address?.city ||
          result.address?.town ||
          result.address?.village,
        state: result.address?.state,
        country: result.address?.country,
        postalCode: result.address?.postcode,
      };

      onLocationConfirm(locationData);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      // Still proceed with coordinates only
      const locationData: LocationData = {
        latitude: selectedCoordinates.lat,
        longitude: selectedCoordinates.lng,
      };

      onLocationConfirm(locationData);
    }
  };

  return (
    <>
      <div className="relative">
        <div ref={mapRef} className="h-[50vh] w-full z-0" />

        <div className="flex items-center gap-2 absolute top-2.5 lg:w-6/7 w-3/4 left-1/2 -translate-x-1/2">
          <div className="relative w-full">
            <Input
              placeholder="Search for address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchLocation(searchQuery);
                }
              }}
              className="flex-1 shadow-md"
            />
            <Button
              onClick={() => searchLocation(searchQuery)}
              disabled={isSearching || !searchQuery.trim()}
              className="gap-2 h-8 absolute rounded-md right-1 top-1"
              type="button"
              size="sm"
            >
              <Search className="h-4 w-4" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        {/* Location Tools */}
        <div className="flex items-center justify-between absolute md:bottom-6  md:right-6 bottom-4 right-3">
          <Button
            onClick={handleGetCurrentLocation}
            size="sm"
            disabled={isLocating}
            className="gap-2 shadow-md"
            type="button"
          >
            <Navigation className="h-4 w-4" />
            {isLocating ? "Locating..." : "Locate Me"}
          </Button>
        </div>
      </div>

      <div className="px-6 py-4 border-t bg-white">
        <div className="flex gap-5">
          <>
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              className="flex-1 rounded"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleConfirmLocation}
              disabled={!selectedCoordinates}
              className="flex-1 rounded"
            >
              Confirm
            </Button>
          </>
        </div>
      </div>
    </>
  );
};
