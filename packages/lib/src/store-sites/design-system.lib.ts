import type { DesignSystem } from "@workspace/store-sections";

/**
 * `store_design_systems` row ↔ design system (0162, ROADMAP.md F-88).
 *
 * `motion` is a nullable column: null means "defaults", and the read side then
 * leaves the key out, so a store that never saved motion settings gets exactly
 * the config it got before 0162. The write side always replaces the column
 * (the design system is saved whole, like colors/typography/spacing): no
 * settings, or only unset ones, store null.
 */

/** A selected row with `motion` null → the same row without the key. */
export function withStoredMotion<T extends { motion: unknown }>(row: T): Omit<T, "motion"> & { motion?: unknown } {
  const { motion, ...rest } = row;
  return motion == null ? rest : { ...rest, motion };
}

/** The motion column value for a validated design system (null when empty). */
export function motionColumn(motion: DesignSystem["motion"]): DesignSystem["motion"] | null {
  if (!motion) return null;
  const set = Object.fromEntries(Object.entries(motion).filter(([, value]) => value !== undefined));
  return Object.keys(set).length ? (set as NonNullable<DesignSystem["motion"]>) : null;
}

/** The design-system columns to write for a validated design system. */
export function designSystemColumns(ds: DesignSystem) {
  return { colors: ds.colors, typography: ds.typography, spacing: ds.spacing, motion: motionColumn(ds.motion) };
}
