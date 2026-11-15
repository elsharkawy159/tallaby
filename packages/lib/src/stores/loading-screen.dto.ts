import { z } from "zod";
import { checkMediaPath, mediaPublicUrl, parseMediaPath } from "../media/media.lib";

/**
 * Store loading screen (ROADMAP.md F-96): an optional full-screen cover the
 * store website shows while its first page loads, set on Website › Design ›
 * Loading screen. Pure and safe on the client: the dashboard form, its save
 * action and the storefront reader all use this file.
 *
 * Saved in `stores.settings.loadingScreen` (other keys kept); no migration.
 * The media is a `store-media` object path in the seller's own folder (never
 * a URL), so the storefront only ever loads our own bucket.
 */

/** Types the seller may upload: raster images incl. animated GIF. No SVG (a public bucket would serve script). */
export const LOADING_SCREEN_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type LoadingScreenMediaType = (typeof LOADING_SCREEN_MEDIA_TYPES)[number];
export const LOADING_SCREEN_ACCEPT_ATTR = LOADING_SCREEN_MEDIA_TYPES.join(",");
const MEDIA_EXTENSIONS: Record<LoadingScreenMediaType, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
};

/** Upload limit (stricter than the media library's 5 MB: it blocks the first paint). */
export const LOADING_SCREEN_MAX_BYTES = 2 * 1024 * 1024;
export const LOADING_SCREEN_PX = { min: 40, max: 400, default: 160 } as const;
export const LOADING_SCREEN_BLUR_MAX = 24;
/** Shown at least this long, and never longer than the max (storefront script + CSS fallback). */
export const LOADING_SCREEN_MIN_MS = 400;
export const LOADING_SCREEN_MAX_MS = 2500;

export function isLoadingScreenMediaType(value: unknown): value is LoadingScreenMediaType {
  return typeof value === "string" && (LOADING_SCREEN_MEDIA_TYPES as readonly string[]).includes(value);
}

/** True when the path is a store-media object whose extension is an allowed loading-screen type. */
export function isLoadingScreenMediaPath(path: unknown): path is string {
  const parsed = parseMediaPath(path);
  return Boolean(parsed && Object.values(MEDIA_EXTENSIONS).some((exts) => exts.includes(parsed.ext)));
}

/** The declared (or stored) type is allowed and matches the path's extension. */
export function loadingScreenTypeMatchesPath(mime: unknown, path: string): boolean {
  const parsed = parseMediaPath(path);
  return Boolean(parsed && isLoadingScreenMediaType(mime) && MEDIA_EXTENSIONS[mime].includes(parsed.ext));
}

const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export const loadingScreenSizeSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("px"), px: z.number().int().min(LOADING_SCREEN_PX.min).max(LOADING_SCREEN_PX.max) }).strict(),
  z.object({ mode: z.literal("full") }).strict(),
]);

export const loadingScreenSchema = z
  .object({
    enabled: z.boolean(),
    /** `store-media` object path, or null for a background-only screen. */
    mediaPath: z.string().max(200).refine(isLoadingScreenMediaPath, "invalid_media").nullable(),
    size: loadingScreenSizeSchema,
    background: z
      .object({
        color: z.string().regex(HEX_RE).transform((value) => value.toLowerCase()),
        /** 0–100 %. */
        opacity: z.number().int().min(0).max(100),
        /** Backdrop blur of the page behind, 0–24 px. */
        blur: z.number().int().min(0).max(LOADING_SCREEN_BLUR_MAX),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, ctx) => {
    // On with nothing to see: no media and a see-through background.
    if (value.enabled && !value.mediaPath && value.background.opacity === 0) {
      ctx.addIssue({ code: "custom", message: "empty", path: ["background", "opacity"] });
    }
  });

export type StoreLoadingScreen = z.output<typeof loadingScreenSchema>;
export type StoreLoadingScreenInput = z.input<typeof loadingScreenSchema>;

export const LOADING_SCREEN_DEFAULTS: StoreLoadingScreen = {
  enabled: false,
  mediaPath: null,
  size: { mode: "px", px: LOADING_SCREEN_PX.default },
  background: { color: "#ffffff", opacity: 100, blur: 0 },
};

const defaults = (): StoreLoadingScreen => ({
  ...LOADING_SCREEN_DEFAULTS,
  size: { ...LOADING_SCREEN_DEFAULTS.size },
  background: { ...LOADING_SCREEN_DEFAULTS.background },
});

/** The store's loading screen from `stores.settings`; anything old or broken is the (off) default. */
export function parseStoreLoadingScreen(settings: unknown): StoreLoadingScreen {
  const raw = (settings as { loadingScreen?: unknown } | null | undefined)?.loadingScreen;
  const parsed = loadingScreenSchema.safeParse(raw);
  return parsed.success ? parsed.data : defaults();
}

/** What a renderer needs: a public image URL and ready CSS values. Null = no loading screen. */
export type LoadingScreenView = {
  mediaUrl: string | null;
  size: StoreLoadingScreen["size"];
  /** `rgba(r, g, b, a)` from the colour and opacity. */
  background: string;
  blur: number;
};

/** `rgba(r, g, b, a)` of a #rgb / #rrggbb colour at 0–100 % opacity. */
export function loadingScreenBackground(hex: string, opacity: number): string {
  const digits = hex.slice(1);
  const full = digits.length === 3 ? [...digits].map((c) => c + c).join("") : digits;
  const n = Number.parseInt(full, 16);
  const alpha = Math.round(Math.min(100, Math.max(0, opacity))) / 100;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * The loading screen to draw for ONE store, or null. Re-validates everything
 * (defensive: bad or old data shows nothing) and drops a media path that is
 * not in this seller's folder for this store (or its shared folder).
 */
export function loadingScreenView(
  settings: unknown,
  scope: { sellerId: string; storeId: string; supabaseUrl: string },
): LoadingScreenView | null {
  const raw = (settings as { loadingScreen?: unknown } | null | undefined)?.loadingScreen;
  const parsed = loadingScreenSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.enabled) return null;
  return loadingScreenViewOf(parsed.data, scope);
}

/** Same as `loadingScreenView` for an already parsed value (the dashboard preview of unsaved changes). */
export function loadingScreenViewOf(
  value: StoreLoadingScreen,
  scope: { sellerId: string; storeId: string; supabaseUrl: string },
): LoadingScreenView | null {
  const ownMedia = value.mediaPath && checkMediaPath(value.mediaPath, scope.sellerId, scope.storeId) === null ? value.mediaPath : null;
  if (!ownMedia && value.background.opacity === 0) return null;
  return {
    mediaUrl: ownMedia && scope.supabaseUrl ? mediaPublicUrl(scope.supabaseUrl, ownMedia) : null,
    size: value.size,
    background: loadingScreenBackground(value.background.color, value.background.opacity),
    blur: value.background.blur,
  };
}
