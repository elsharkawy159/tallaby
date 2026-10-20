import { cacheProfiles, createCachedQuery, searchTags } from "@workspace/cache";
import { PHOTO_ID_RE, STOCK_PAGE_SIZE, toStockPhoto, type PexelsPhoto, type StockPhotoPage } from "./stock-photos.lib";

/**
 * Pexels API client (server only). PEXELS_API_KEY never leaves the server:
 * the browser gets mapped results, and imports go through the editor action.
 * Searches are public data, cached for a day (Pexels allows 200 requests an
 * hour by default).
 */

const API = "https://api.pexels.com/v1";

export class PexelsUnavailable extends Error {}

function apiKey(): string {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new PexelsUnavailable("PEXELS_API_KEY is not set");
  return key;
}

async function pexels<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { headers: { Authorization: apiKey() }, cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`pexels ${response.status}`);
  return (await response.json()) as T;
}

export const pexelsConfigured = () => Boolean(process.env.PEXELS_API_KEY);

export const searchPexels = createCachedQuery<[query: string, page: number], StockPhotoPage>({
  // Bump the version whenever StockPhoto changes shape: cached pages live for a day (v2 added previewUrl).
  name: "stock:pexels-search:v2",
  ttl: cacheProfiles.taxonomy,
  tags: () => [searchTags.stockPhotos()],
  query: async (query: string, page: number): Promise<StockPhotoPage> => {
    const params = new URLSearchParams({ query, page: String(page), per_page: String(STOCK_PAGE_SIZE) });
    const data = await pexels<{ photos?: PexelsPhoto[]; next_page?: string }>(`/search?${params}`);
    return {
      photos: (data.photos ?? []).map(toStockPhoto).filter((p) => p !== null),
      hasMore: Boolean(data.next_page),
    };
  },
});

/** One photo by id (not cached: only used when importing). */
export async function getPexelsPhoto(id: string): Promise<PexelsPhoto | null> {
  if (!PHOTO_ID_RE.test(id)) return null;
  try {
    return await pexels<PexelsPhoto>(`/photos/${id}`);
  } catch (error) {
    if (error instanceof PexelsUnavailable) throw error;
    return null;
  }
}
