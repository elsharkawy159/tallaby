/** Error keys live under `stores.errors` in the messages. */
export type StoreErrorKey =
  | "limitReached"
  | "subdomainTaken"
  | "invalidSubdomain"
  | "invalidInput"
  | "primaryStore"
  | "notFound"
  | "forbidden"
  | "rateLimited"
  | "generic";

export type StoreActionResult<T> = { success: true; data: T } | { success: false; error: StoreErrorKey };

/** What the /stores page renders for one store (no internal fields). */
export type StoreCardData = {
  id: string;
  name: string;
  subdomain: string;
  customDomain: string | null;
  isPrimary: boolean;
  status: string;
  siteStatus: string;
  logoUrl: string | null;
  createdAt: string;
};
