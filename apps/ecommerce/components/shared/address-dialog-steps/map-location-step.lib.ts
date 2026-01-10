/**
 * Enhanced reverse geocoding utility
 * Converts coordinates to full address details using Nominatim API
 */

export interface EnhancedAddressDetails {
  // Core coordinates
  latitude: number;
  longitude: number;

  // Address components
  country?: string;
  state?: string;
  city?: string;
  area?: string; // Neighborhood, district, or suburb
  street?: string;
  building?: string; // House number, building number
  postalCode?: string;

  // Formatted address strings
  displayName?: string; // Full readable address from API
  formattedAddress?: string; // Custom formatted address string
}

/**
 * Reverse geocodes coordinates to get full address details
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Enhanced address details with structured and formatted address
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<EnhancedAddressDetails> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const result = await response.json();

    if (!result || result.error) {
      throw new Error(result.error || "No address data returned");
    }

    const address = result.address || {};

    // Extract address components with fallbacks for different naming conventions
    const country = address.country || "";
    const state = address.state || address.region || address.province || "";
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      "";
    const area =
      address.suburb ||
      address.neighbourhood ||
      address.district ||
      address.quarter ||
      "";
    const street =
      address.road ||
      address.street ||
      address.street_name ||
      address.pedestrian ||
      "";
    const building =
      address.house_number ||
      address.building ||
      address.house ||
      address.housenumber ||
      "";

    const postalCode = address.postcode || address.postal_code || "";

    // Create formatted address string
    const addressParts: string[] = [];

    if (building) addressParts.push(building);
    if (street) addressParts.push(street);
    if (area) addressParts.push(area);
    if (city) addressParts.push(city);
    if (state) addressParts.push(state);
    if (postalCode) addressParts.push(postalCode);
    if (country) addressParts.push(country);

    const formattedAddress = addressParts.join(", ");

    return {
      latitude: lat,
      longitude: lng,
      country,
      state,
      city,
      area,
      street,
      building,
      postalCode,
      displayName: result.display_name || formattedAddress,
      formattedAddress: formattedAddress || result.display_name || "",
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    // Return coordinates only if geocoding fails
    return {
      latitude: lat,
      longitude: lng,
    };
  }
}

/**
 * Creates a pulsing dot marker for user location
 * Uses Leaflet DivIcon with CSS animation for pulsing effect
 * @param Leaflet - Leaflet library instance
 * @returns Leaflet DivIcon configured for pulsing dot
 */
export function createPulsingDotMarker(Leaflet: any) {
  // Create HTML for pulsing dot
  const iconHtml = `
    <div class="location-pulse-container">
      <div class="location-pulse-dot"></div>
      <div class="location-pulse-ring"></div>
      <div class="location-pulse-ring location-pulse-ring-delay-1"></div>
      <div class="location-pulse-ring location-pulse-ring-delay-2"></div>
    </div>
  `;

  // Create custom icon with pulsing dot
  return Leaflet.divIcon({
    className: "location-pulse-marker",
    html: iconHtml,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

/**
 * Map zoom levels for different scenarios
 */
export const MAP_ZOOM_LEVELS = {
  DEFAULT: 10,
  SEARCH_RESULT: 15,
  USER_LOCATION: 17, // Higher zoom for precise user location (16-18 range)
  DETAILED: 18,
} as const;
