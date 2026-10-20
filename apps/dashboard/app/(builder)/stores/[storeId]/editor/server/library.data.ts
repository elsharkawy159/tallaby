/**
 * Add › Sections presets from the published section library (`library_sections`,
 * Task 10). Platform data with no seller data, so it is cached under
 * `librarySectionTags.catalog()` (admin library writes invalidate it; 5-minute
 * backstop). The admin store editor loads it the same way, so both palettes match.
 */
import { createCachedQuery, librarySectionTags } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { listLibraryPresets } from "@workspace/lib/library-sections/server";
import type { SectionPreset } from "@workspace/store-sections/render";

const getCachedLibraryPresets = createCachedQuery({
  name: "library:sections",
  ttl: 300,
  tags: () => [librarySectionTags.catalog()],
  query: () => listLibraryPresets(),
});

/** The presets, or undefined when the database fails (the editor then uses its built-in library, SECTION_PRESETS). */
export async function loadLibraryPresets(): Promise<SectionPreset[] | undefined> {
  try {
    return await getCachedLibraryPresets();
  } catch (error) {
    logServerError("publish", "library sections failed to load; using the built-in library", {}, error);
    return undefined;
  }
}
