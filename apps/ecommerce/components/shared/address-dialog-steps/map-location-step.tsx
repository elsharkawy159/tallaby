"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { ArrowLeft, Check, Navigation, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  reverseGeocode,
  createPulsingDotMarker,
  MAP_ZOOM_LEVELS,
} from "./map-location-step.lib";

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  area?: string;
  street?: string;
  building?: string;
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
  const userLocationMarkerRef = useRef<any>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

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
          mapInstanceRef.current.setView(
            [lat, lng],
            MAP_ZOOM_LEVELS.SEARCH_RESULT
          );

          // Remove only the regular selection marker (keep user location dot if it exists)
          if (markerRef.current) {
            markerRef.current.remove();
          }

          // Dynamically import Leaflet
          const Leaflet = await import("leaflet");

          // Add new marker for search result
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

        const map = Leaflet.map(mapRef.current as HTMLElement).setView(
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

          // Remove only the regular selection marker (keep user location dot persistent)
          if (markerRef.current) {
            markerRef.current.remove();
          }

          // Add new marker for clicked location
          const marker = Leaflet.marker([lat, lng]).addTo(map);
          markerRef.current = marker;

          setSelectedCoordinates({ lat, lng });
          toast.success("Location selected!");
        });
      } catch (error) {
        console.error("Failed to initialize map:", error);
        // toast.error("Failed to load map");
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current = null;
      }
    };
  }, [initialLocation]);

  /**
   * Handles "Locate Me" button click
   * Gets user's current location using Geolocation API,
   * centers map, zooms in, adds pulsing dot marker,
   * and retrieves full address details via reverse geocoding
   */
  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by your browser";
      setLocationError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!isMapLoaded || !mapInstanceRef.current) {
      toast.error("Map is not ready. Please wait a moment and try again.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    // Geolocation options for better accuracy
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds timeout
      maximumAge: 0, // Don't use cached location
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Smoothly center and zoom map to user location
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(
              [latitude, longitude],
              MAP_ZOOM_LEVELS.USER_LOCATION,
              {
                animate: true,
                duration: 0.8, // Smooth animation duration
              }
            );

            // Remove existing markers (but keep user location marker separate)
            if (markerRef.current) {
              markerRef.current.remove();
            }
            if (userLocationMarkerRef.current) {
              userLocationMarkerRef.current.remove();
            }

            // Dynamically import Leaflet
            const Leaflet = await import("leaflet");

            // Create and add pulsing dot marker for user location
            const pulsingIcon = createPulsingDotMarker(Leaflet);
            const userMarker = Leaflet.marker([latitude, longitude], {
              icon: pulsingIcon,
            }).addTo(mapInstanceRef.current);

            userLocationMarkerRef.current = userMarker;

            // Update selected coordinates
            setSelectedCoordinates({ lat: latitude, lng: longitude });

            // Perform reverse geocoding to get full address details
            const addressDetails = await reverseGeocode(latitude, longitude);

            // Store address details (will be used when confirming location)
            if (addressDetails.formattedAddress || addressDetails.displayName) {
              toast.success("Location found! Full address details retrieved.");
            } else {
              toast.success("Location found! Address details may be limited.");
            }
          }

          setIsLocating(false);
        } catch (error) {
          console.error("Error processing location:", error);
          const errorMsg = "Failed to process your location";
          setLocationError(errorMsg);
          toast.error(errorMsg);
          setIsLocating(false);
        }
      },
      (error) => {
        // Handle different geolocation error types
        let errorMessage = "Unable to retrieve your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable location permissions in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
          default:
            errorMessage =
              "An unknown error occurred while retrieving location.";
            break;
        }

        setLocationError(errorMessage);
        toast.error(errorMessage);
        setIsLocating(false);
      },
      geoOptions
    );
  };

  /**
   * Handles location confirmation
   * Performs reverse geocoding to get full address details
   * and passes structured address data to parent component
   */
  const handleConfirmLocation = async () => {
    if (!selectedCoordinates) {
      toast.error("Please select a location on the map");
      return;
    }

    try {
      // Use enhanced reverse geocoding utility
      const addressDetails = await reverseGeocode(
        selectedCoordinates.lat,
        selectedCoordinates.lng
      );

      // Map enhanced address details to LocationData format
      const locationData: LocationData = {
        latitude: addressDetails.latitude,
        longitude: addressDetails.longitude,
        address:
          addressDetails.formattedAddress || addressDetails.displayName || "",
        country: addressDetails.country,
        state: addressDetails.state,
        city: addressDetails.city,
        area: addressDetails.area,
        street: addressDetails.street,
        building: addressDetails.building,
        postalCode: addressDetails.postalCode,
      };

      onLocationConfirm(locationData);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      toast.error("Failed to retrieve address details, using coordinates only");
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
        <div className="flex flex-col items-end gap-2 absolute md:bottom-6 md:right-6 bottom-4 right-3">
          <Button
            onClick={handleGetCurrentLocation}
            size="sm"
            disabled={isLocating || !isMapLoaded}
            className="gap-2 shadow-md"
            type="button"
          >
            <Navigation className="h-4 w-4" />
            {isLocating ? "Locating..." : "Locate Me"}
          </Button>
          {locationError && (
            <div className="text-xs text-red-600 bg-white px-2 py-1 rounded shadow-md max-w-[200px] text-right">
              {locationError}
            </div>
          )}
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
