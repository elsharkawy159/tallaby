import { describe, expect, it } from "vitest";
import {
  MEDIA_ACCEPT,
  buildMediaPath,
  checkMediaPath,
  mediaAlt,
  mediaExtension,
  mediaPublicUrl,
  mimeMatchesPath,
  parseMediaPath,
  recordMediaInputSchema,
  updateMediaAssetSchema,
} from "./media.lib";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const A1 = "aaaaaaaa-0000-4000-8000-000000000001";
const A2 = "aaaaaaaa-0000-4000-8000-000000000002";
const OBJ = "0f0f0f0f-1234-4abc-8def-0123456789ab";

describe("media paths (P4-09)", () => {
  it("builds '{seller}/{store|shared}/{uuid}.{ext}' paths", () => {
    expect(buildMediaPath(A, A1, "image/png", OBJ)).toBe(`${A}/${A1}/${OBJ}.png`);
    expect(buildMediaPath(A, null, "image/jpeg", OBJ)).toBe(`${A}/shared/${OBJ}.jpg`);
    expect(parseMediaPath(buildMediaPath(A, null, "image/webp"))).toMatchObject({ sellerId: A, storeId: null, ext: "webp" });
  });

  it("refuses SVG and other types when building", () => {
    expect(() => buildMediaPath(A, A1, "image/svg+xml", OBJ)).toThrow();
    expect(() => buildMediaPath(A, A1, "text/html", OBJ)).toThrow();
    expect(() => buildMediaPath("not-a-uuid", A1, "image/png", OBJ)).toThrow();
    expect(mediaExtension("image/svg+xml")).toBeNull();
    expect(Object.keys(MEDIA_ACCEPT)).not.toContain("image/svg+xml");
  });

  it("accepts the session seller's shared folder and the current store", () => {
    expect(checkMediaPath(`${A}/shared/${OBJ}.png`, A, A1)).toBeNull();
    expect(checkMediaPath(`${A}/${A1}/${OBJ}.avif`, A, A1)).toBeNull();
  });

  it("rejects another seller's folder", () => {
    expect(checkMediaPath(`${B}/shared/${OBJ}.png`, A, A1)).toBe("foreign_path");
    expect(checkMediaPath(`${B}/${A1}/${OBJ}.png`, A, A1)).toBe("foreign_path");
  });

  it("rejects the seller's other store when working in A1", () => {
    expect(checkMediaPath(`${A}/${A2}/${OBJ}.png`, A, A1)).toBe("wrong_store");
  });

  it("rejects malformed paths (traversal, extra segments, svg, wrong ext, uppercase, encodings)", () => {
    for (const bad of [
      `${A}/shared/../${B}/${OBJ}.png`,
      `${A}/shared/x/${OBJ}.png`,
      `${A}/shared/${OBJ}.svg`,
      `${A}/shared/${OBJ}.png.html`,
      `${A}/shared/${OBJ}`,
      `/${A}/shared/${OBJ}.png`,
      `${A}/shared/${OBJ}.PNG`,
      `${A}/Shared/${OBJ}.png`,
      `${A}%2Fshared/${OBJ}.png`,
      `${A}/shared/${OBJ}.png\n`,
      `${A}/anything/${OBJ}.png`,
      "",
      42,
      null,
    ]) {
      expect(checkMediaPath(bad, A, A1)).toBe("invalid_path");
    }
  });

  it("matches the stored type to the extension", () => {
    expect(mimeMatchesPath("image/jpeg", `${A}/shared/${OBJ}.jpeg`)).toBe(true);
    expect(mimeMatchesPath("image/jpeg", `${A}/shared/${OBJ}.jpg`)).toBe(true);
    expect(mimeMatchesPath("image/png", `${A}/shared/${OBJ}.jpg`)).toBe(false);
    expect(mimeMatchesPath("image/svg+xml", `${A}/shared/${OBJ}.png`)).toBe(false);
    expect(mimeMatchesPath("text/html", `${A}/shared/${OBJ}.png`)).toBe(false);
  });

  it("builds the public URL", () => {
    expect(mediaPublicUrl("https://x.supabase.co/", `${A}/shared/${OBJ}.png`)).toBe(
      `https://x.supabase.co/storage/v1/object/public/store-media/${A}/shared/${OBJ}.png`,
    );
  });
});

describe("media inputs", () => {
  it("record input is strict and never takes size, type, seller or store from the client", () => {
    const base = { storagePath: `${A}/shared/${OBJ}.png`, filename: "a.png" };
    expect(recordMediaInputSchema.safeParse(base).success).toBe(true);
    expect(recordMediaInputSchema.safeParse({ ...base, bytes: 1 }).success).toBe(false);
    expect(recordMediaInputSchema.safeParse({ ...base, mimeType: "image/png" }).success).toBe(false);
    expect(recordMediaInputSchema.safeParse({ ...base, sellerId: B }).success).toBe(false);
    expect(recordMediaInputSchema.safeParse({ ...base, storeId: A2 }).success).toBe(false);
    expect(recordMediaInputSchema.safeParse({ ...base, width: 0 }).success).toBe(false);
    expect(recordMediaInputSchema.safeParse({ ...base, folderId: "x" }).success).toBe(false);
  });

  it("alt text is AR/EN only and bounded", () => {
    expect(updateMediaAssetSchema.safeParse({ altText: { ar: "صورة", en: "Photo" } }).success).toBe(true);
    expect(updateMediaAssetSchema.safeParse({ altText: { fr: "x" } }).success).toBe(false);
    expect(updateMediaAssetSchema.safeParse({ altText: { ar: "x".repeat(251) } }).success).toBe(false);
    expect(updateMediaAssetSchema.safeParse({ folderId: null }).success).toBe(true);
  });

  it("mediaAlt falls back to the other language", () => {
    expect(mediaAlt({ ar: "صورة" }, "en")).toBe("صورة");
    expect(mediaAlt({ en: "Photo" }, "ar")).toBe("Photo");
    expect(mediaAlt(null, "ar")).toBe("");
  });
});
