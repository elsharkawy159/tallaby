import { z } from "zod";

/** Where a seller heard about Tallaby (sellers.heard_about_us, 0099). Order is the pop-up order. */
export const HEARD_ABOUT_US_SOURCES = [
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "google",
  "friend",
  "other",
] as const;

export type HeardAboutUsSource = (typeof HEARD_ABOUT_US_SOURCES)[number];

export const HEARD_ABOUT_US_LABELS: Record<HeardAboutUsSource, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  google: "Google",
  friend: "Friend",
  other: "Other",
};

export const HEARD_ABOUT_US_OTHER_MAX = 120;

export function isHeardAboutUsSource(value: unknown): value is HeardAboutUsSource {
  return typeof value === "string" && (HEARD_ABOUT_US_SOURCES as readonly string[]).includes(value);
}

/** The pop-up answer. `other` text is kept only for the "other" source. */
export const heardAboutUsInputSchema = z
  .object({
    source: z.enum(HEARD_ABOUT_US_SOURCES),
    other: z.string().trim().max(HEARD_ABOUT_US_OTHER_MAX).optional().nullable(),
  })
  .transform(({ source, other }) => ({
    source,
    other: source === "other" && other ? other : null,
  }));

export type HeardAboutUsInput = z.output<typeof heardAboutUsInputSchema>;
