/** Website › Templates › "Request a theme" (F-77): shapes shared by the dialog, the list and the actions. */
import type { SellerThemeRequestView } from "@workspace/lib/theme-requests";

export type ThemeRequestErrorKey = "invalid" | "invalidImage" | "tooManyOpen" | "rateLimited" | "readOnly" | "notFound" | "generic";

export type ThemeRequestActionResult<T> = { success: true; data: T } | { success: false; error: ThemeRequestErrorKey };

export type ThemeRequestsView = {
  items: SellerThemeRequestView[];
  openCount: number;
  maxOpen: number;
};
