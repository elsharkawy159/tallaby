/**
 * Google Maps deep link for a delivery destination. Coordinates win when
 * present (exact pin); otherwise falls back to the formatted address so the
 * rider always has something to tap — never a hardcoded location.
 */
export function getGoogleMapsUrl(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  fallbackAddress: string
): string {
  const destination =
    typeof latitude === "number" && typeof longitude === "number"
      ? `${latitude},${longitude}`
      : fallbackAddress;

  const params = new URLSearchParams({
    api: "1",
    destination,
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
