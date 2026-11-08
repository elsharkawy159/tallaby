export * from "./config";
export * from "./templates";
export * from "./core/fonts";
// Colour utilities (hex/OKLCH/contrast) live on the `./palette` subpath; the root exports only the builder API.
export {
  derivePaletteFromPrimary,
  isValidHex,
  normalizeHex,
  type DerivedPalette,
  type DesignSystemColors,
  type PaletteNote,
} from "./core/palette";
export { dominantColorsFromPixels, type DominantColorsOptions } from "./core/logo-colors";
export * from "./social/platforms";
