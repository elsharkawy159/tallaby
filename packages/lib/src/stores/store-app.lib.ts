/**
 * Store app (PWA) settings and helpers (ROADMAP.md F-36). Pure, safe on the
 * client. Stored in `stores.settings.app`; no migration.
 *
 * Installing a store website gives an app with the store's name and its
 * favicon (else logo, else initials). The store footer shows a "Download
 * application" button unless the seller hides it (Store settings › App).
 */

export type StoreAppSettings = {
  /** The footer's "Download application" button (on by default). */
  showDownloadButton: boolean;
};

export function parseStoreApp(settings: unknown): StoreAppSettings {
  const app = (settings as { app?: unknown } | null)?.app;
  const show = (app as { showDownloadButton?: unknown } | null | undefined)?.showDownloadButton;
  return { showDownloadButton: show !== false };
}

/** The home-screen label: the name, or its first words up to 12 characters. */
export function appShortName(name: string): string {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) return "Store";
  if (clean.length <= 12) return clean;
  let out = "";
  for (const word of clean.split(" ")) {
    const next = out ? `${out} ${word}` : word;
    if (next.length > 12) break;
    out = next;
  }
  return out || clean.slice(0, 12);
}

/** Up to two initials for the fallback icon ("Sara Home" → "SH"). */
export function appInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words
    .slice(0, 2)
    .map((word) => Array.from(word)[0]!)
    .join("")
    .toUpperCase();
}

/** Short cache-busting version of the icon inputs (changes when the image or name changes). */
export function appIconVersion(image: string | null | undefined, name: string): string {
  let hash = 5381;
  for (const ch of `${image ?? ""}|${name}`) hash = ((hash * 33) ^ ch.codePointAt(0)!) >>> 0;
  return hash.toString(36);
}

/** Icon sizes the store manifest and pages use. */
export const STORE_APP_ICON_SIZES = [180, 192, 512] as const;
export type StoreAppIconSize = (typeof STORE_APP_ICON_SIZES)[number];
