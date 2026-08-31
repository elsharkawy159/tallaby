export type MapsLinkType = "navigation" | "location";

export function hasValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): boolean {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  );
}

/**
 * Build a Google Maps deep link for a lat/lng pair.
 * - navigation: opens turn-by-turn directions to the point
 * - location: opens the place/pin view
 */
export function getGoogleMapsUrl(
  latitude: number,
  longitude: number,
  type: MapsLinkType
): string {
  if (type === "navigation") {
    return (
      "https://www.google.com/maps/dir//" +
      latitude +
      "," +
      longitude +
      "/@" +
      latitude +
      "," +
      longitude +
      ",17z"
    );
  }

  return (
    "https://www.google.com/maps/place/" +
    latitude +
    "," +
    longitude +
    "/@" +
    latitude +
    "," +
    longitude +
    ",17z"
  );
}
