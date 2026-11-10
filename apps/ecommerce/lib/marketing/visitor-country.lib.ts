/**
 * The visitor's country on tallaby.com, from Vercel's IP header
 * (`x-vercel-ip-country`). Outside production `?country=SE` stands in for the
 * header, so the language and currency rules can be tried locally. Shared by
 * `proxy.ts` (landing language, `Server-Timing: geo`) and `/api/geo`.
 *
 * Pure functions only.
 */

const COUNTRY = /^[A-Z]{2}$/;

/** An ISO country code in upper case, or null for a missing or malformed value. */
export function normalizeCountry(raw: string | null | undefined): string | null {
  const code = (raw ?? "").trim().toUpperCase();
  return COUNTRY.test(code) ? code : null;
}

/** The country of a request: the `?country=` override outside production, else the header. */
export function requestCountry({
  header,
  override,
  production,
}: {
  header: string | null | undefined;
  override: string | null | undefined;
  production: boolean;
}): string | null {
  const local = production ? null : normalizeCountry(override);
  return local ?? normalizeCountry(header);
}

/** The `Server-Timing` metric that carries the country to the page's script (`performance` navigation entry). */
export const GEO_SERVER_TIMING = "geo";

/** `geo;desc=SE`: the header value the proxy adds to tallaby.com pages when the country is known. */
export function geoServerTiming(country: string): string {
  return `${GEO_SERVER_TIMING};desc=${country}`;
}

/** The country from a navigation entry's `serverTiming` list, or null when it isn't there. */
export function countryFromServerTiming(entries: readonly { name: string; description: string }[] | null | undefined): string | null {
  const entry = entries?.find((item) => item.name === GEO_SERVER_TIMING);
  return entry ? normalizeCountry(entry.description) : null;
}
