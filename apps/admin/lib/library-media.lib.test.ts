import { describe, expect, it } from "vitest";
import { LIBRARY_MEDIA_BUCKET, isLibraryMediaPath, libraryMediaPath, libraryMediaUrl, mimeMatchesLibraryPath } from "./library-media.lib";

const UUID = "0f8fad5b-d9cb-469f-a165-70867728950e";

describe("library media paths", () => {
  it("builds library/<uuid>.<ext> for the raster types only", () => {
    expect(LIBRARY_MEDIA_BUCKET).toBe("library-media");
    expect(libraryMediaPath("image/webp", UUID)).toBe(`library/${UUID}.webp`);
    expect(libraryMediaPath("image/jpeg", UUID)).toBe(`library/${UUID}.jpg`);
    expect(libraryMediaPath("image/svg+xml", UUID)).toBeNull();
    expect(libraryMediaPath("text/html", UUID)).toBeNull();
    expect(libraryMediaPath("image/png")).toMatch(/^library\/[0-9a-f-]{36}\.png$/);
  });

  it("accepts only paths it could have built", () => {
    expect(isLibraryMediaPath(`library/${UUID}.png`)).toBe(true);
    for (const bad of [`library/${UUID}.svg`, `library/../${UUID}.png`, `other/${UUID}.png`, `library/${UUID}.png/x`, "library/abc.png", 42, null]) {
      expect(isLibraryMediaPath(bad), String(bad)).toBe(false);
    }
  });

  it("matches the MIME type to the extension", () => {
    expect(mimeMatchesLibraryPath("image/jpeg", `library/${UUID}.jpg`)).toBe(true);
    expect(mimeMatchesLibraryPath("image/png", `library/${UUID}.jpg`)).toBe(false);
    expect(mimeMatchesLibraryPath("image/svg+xml", `library/${UUID}.jpg`)).toBe(false);
  });

  it("gives the public URL of the bucket", () => {
    expect(libraryMediaUrl("https://x.supabase.co/", `library/${UUID}.png`)).toBe(
      `https://x.supabase.co/storage/v1/object/public/library-media/library/${UUID}.png`,
    );
  });
});
