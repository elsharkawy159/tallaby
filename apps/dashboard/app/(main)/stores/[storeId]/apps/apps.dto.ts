/** Error keys live under `storeApps.errors`. */
export type StoreAppsErrorKey =
  | "invalidId"
  | "notAvailable"
  | "readOnly"
  | "notFound"
  | "rateLimited"
  | "generic";

export type StoreAppsResult<T> = { success: true; data: T } | { success: false; error: StoreAppsErrorKey };
