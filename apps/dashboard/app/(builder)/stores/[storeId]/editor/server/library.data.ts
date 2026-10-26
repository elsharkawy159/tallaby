/**
 * Add › Sections presets: the built-in code library (`SECTION_PRESETS`,
 * @workspace/store-sections). Sections come from the codebase only (owner,
 * 2026-10-27); the `library_sections` table was dropped (0109). The dashboard
 * and admin store editors load it the same way, so both palettes match.
 */
import { SECTION_PRESETS, type SectionPreset } from "@workspace/store-sections/render";

export async function loadLibraryPresets(): Promise<SectionPreset[] | undefined> {
  return [...SECTION_PRESETS];
}
