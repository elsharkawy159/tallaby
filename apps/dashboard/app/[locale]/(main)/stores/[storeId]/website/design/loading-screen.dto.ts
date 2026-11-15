import type { StoreLoadingScreen } from "@workspace/lib/stores/loading-screen";

/** Result of `saveLoadingScreen` (each error has a `websiteDesign.loading.errors.*` string). */
export type LoadingScreenResult =
  | { success: true; settings: StoreLoadingScreen }
  | {
      success: false;
      error: "empty" | "invalidInput" | "invalidMedia" | "tooLarge" | "invalidType" | "readOnly" | "notFound" | "rateLimited" | "generic";
    };
