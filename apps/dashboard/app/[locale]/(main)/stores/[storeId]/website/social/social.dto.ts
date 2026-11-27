import { SOCIAL_PLATFORMS, type SocialPlatformKey } from "@workspace/store-sections/social";

/** One row of the Social media page: every platform, linked or not. */
export type SocialRow = { platform: SocialPlatformKey; value: string; enabled: boolean };

/**
 * Saved links (`readStoreSocialLinks`, in their order) → one row per platform:
 * the linked ones first, then the rest. Shared by Website › Social media and
 * Settings › General › Contact, so both show and save the same list.
 */
export function toSocialRows(saved: readonly { platform: SocialPlatformKey; value: string; enabled: boolean }[]): SocialRow[] {
  const linked = new Set(saved.map((link) => link.platform));
  return [
    ...saved.map((link) => ({ platform: link.platform, value: link.value, enabled: link.enabled })),
    ...SOCIAL_PLATFORMS.filter((p) => !linked.has(p.key)).map((p) => ({ platform: p.key, value: "", enabled: true })),
  ];
}

/** Error keys live under `websiteSocial.errors`. */
export type SocialSaveError = "notFound" | "readOnly" | "invalidInput" | "rateLimited" | "generic";

export type SocialSaveResult = { success: true } | { success: false; error: SocialSaveError };

/** Rows → the payload `updateStoreSocialLinks` validates (empty rows are dropped; order = row order). */
export function toSocialPayload(rows: SocialRow[]) {
  return rows
    .filter((row) => row.value.trim())
    .map((row, order) => ({ platform: row.platform, value: row.value.trim(), enabled: row.enabled, order }));
}
