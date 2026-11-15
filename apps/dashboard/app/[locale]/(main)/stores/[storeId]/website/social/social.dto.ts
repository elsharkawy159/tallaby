import type { SocialPlatformKey } from "@workspace/store-sections/social";

/** One row of the Social media page: every platform, linked or not. */
export type SocialRow = { platform: SocialPlatformKey; value: string; enabled: boolean };

/** Error keys live under `websiteSocial.errors`. */
export type SocialSaveError = "notFound" | "readOnly" | "invalidInput" | "rateLimited" | "generic";

export type SocialSaveResult = { success: true } | { success: false; error: SocialSaveError };

/** Rows → the payload `updateStoreSocialLinks` validates (empty rows are dropped; order = row order). */
export function toSocialPayload(rows: SocialRow[]) {
  return rows
    .filter((row) => row.value.trim())
    .map((row, order) => ({ platform: row.platform, value: row.value.trim(), enabled: row.enabled, order }));
}
