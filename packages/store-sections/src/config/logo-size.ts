/**
 * The store logo's size in the header and footer (seller feedback,
 * 2026-11-14: "the navbar logo can't be made bigger"). The logo is a drawn
 * `storeLogo` node (`drawChrome`), never saved into the tree, so its size is
 * stored on the header/footer instance like the other chrome options:
 * `props.logoHeight` (desktop and tablet) and `props.logoHeightMobile`
 * (phones, under 768px), in pixels. A prop is stored only when it differs from
 * the default, and an instance without them draws the logo exactly as before
 * (36px on phones / 40px from 768px up in the header, 48px in the footer).
 * Never trusts the stored value: anything else is ignored, numbers are
 * clamped and rounded.
 */
import type { SectionInstance } from "./schema";

export const LOGO_HEIGHT_PROP = "logoHeight";
export const LOGO_HEIGHT_MOBILE_PROP = "logoHeightMobile";

export type LogoPart = "header" | "footer";
export type LogoDevice = "desktop" | "mobile";

/** Allowed heights in pixels: phones get a lower cap, so the one-row phone header stays one row. */
export const LOGO_HEIGHT_RANGE: Record<LogoDevice, { min: number; max: number }> = {
  desktop: { min: 20, max: 120 },
  mobile: { min: 20, max: 72 },
};

/** The heights the renderer draws without a seller value (`h-9 md:h-10` header, `h-12` footer). */
const DEFAULT_HEIGHT: Record<LogoPart, Record<LogoDevice, number>> = {
  header: { desktop: 40, mobile: 36 },
  footer: { desktop: 48, mobile: 48 },
};

const PROP: Record<LogoDevice, string> = { desktop: LOGO_HEIGHT_PROP, mobile: LOGO_HEIGHT_MOBILE_PROP };

export function defaultLogoHeight(part: LogoPart, device: LogoDevice): number {
  return DEFAULT_HEIGHT[part][device];
}

/** A height clamped to the device's range and rounded to a whole pixel; null for anything that is not a finite number. */
export function clampLogoHeight(value: unknown, device: LogoDevice): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const { min, max } = LOGO_HEIGHT_RANGE[device];
  return Math.round(Math.min(max, Math.max(min, value)));
}

/** The seller's heights (only the ones they set). */
export function readLogoHeights(instance: SectionInstance | null | undefined): Partial<Record<LogoDevice, number>> {
  const out: Partial<Record<LogoDevice, number>> = {};
  for (const device of ["desktop", "mobile"] as const) {
    const value = clampLogoHeight(instance?.props[PROP[device]], device);
    if (value !== null) out[device] = value;
  }
  return out;
}

/** The height drawn on a device: the seller's, else the default. */
export function logoHeightOf(instance: SectionInstance | null | undefined, part: LogoPart, device: LogoDevice): number {
  return readLogoHeights(instance)[device] ?? defaultLogoHeight(part, device);
}

/** The instance with the device's height set; `null` (or the default) drops the prop. */
export function setLogoHeight(instance: SectionInstance, part: LogoPart, device: LogoDevice, value: number | null): SectionInstance {
  const { [PROP[device]]: _, ...props } = instance.props;
  const height = value === null ? null : clampLogoHeight(value, device);
  return { ...instance, props: height === null || height === defaultLogoHeight(part, device) ? props : { ...props, [PROP[device]]: height } };
}

/** The widest the logo may be drawn at a height (the old 160px cap at 40px, growing with the height). */
export function logoMaxWidth(height: number): number {
  return Math.max(160, Math.round(height * 4));
}
