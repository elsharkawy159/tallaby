import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isShareImageBucket,
  isValidShareImagePath,
  ownShareImageSource,
  ownStorageOrigin,
  SHARE_IMAGE_PATH_MAX,
  shareImageRoutePath,
  storageObjectUrl,
} from "./share-image.lib";
import { socialShareImage } from "@/lib/metadata";

const ORIGIN = "https://abc123.supabase.co";

describe("isValidShareImagePath", () => {
  it("takes the storage paths uploads use", () => {
    expect(isValidShareImagePath("2026-09-10/foo.png")).toBe(true);
    expect(isValidShareImagePath("6f1c0e9a-1b2c-4d5e-8f90-123456789abc/2026-11-01/1730000000-photo_1.JPG")).toBe(true);
    expect(isValidShareImagePath("a.jpg")).toBe(true);
  });

  it("refuses traversal, absolute paths, empty segments and odd characters", () => {
    for (const bad of [
      "",
      "../secret.png",
      "a/../b.png",
      "a/./b.png",
      "/a.png",
      "a//b.png",
      "a/",
      ".hidden.png",
      "a\\b.png",
      "a b.png",
      "a%2e%2e/b.png",
      "a?.png",
      "a#.png",
      "https://evil.com/a.png",
      "صورة.png",
      "a/b\n.png",
    ]) {
      expect(isValidShareImagePath(bad), bad).toBe(false);
    }
  });

  it("caps the length and the depth", () => {
    expect(isValidShareImagePath(`${"a/".repeat(11)}b.png`)).toBe(true);
    expect(isValidShareImagePath(`${"a/".repeat(12)}b.png`)).toBe(false);
    expect(isValidShareImagePath("a".repeat(SHARE_IMAGE_PATH_MAX + 1))).toBe(false);
  });
});

describe("buckets and URLs", () => {
  it("allows only the products bucket", () => {
    expect(isShareImageBucket("products")).toBe(true);
    for (const bucket of ["sellers", "avatars", "order-payment-proofs", "", "products/.."]) expect(isShareImageBucket(bucket)).toBe(false);
  });

  it("builds the original and route URLs from a bucket and path only", () => {
    expect(storageObjectUrl(ORIGIN, "products", "2026-09-10/foo.png")).toBe(`${ORIGIN}/storage/v1/object/public/products/2026-09-10/foo.png`);
    expect(shareImageRoutePath("products", "2026-09-10/foo.png")).toBe("/api/share-image/products/2026-09-10/foo.png");
  });

  it("reads our own public product URLs and nothing else", () => {
    expect(ownShareImageSource(`${ORIGIN}/storage/v1/object/public/products/2026-09-10/foo.png`, ORIGIN)).toEqual({
      bucket: "products",
      path: "2026-09-10/foo.png",
    });
    for (const url of [
      "https://other.supabase.co/storage/v1/object/public/products/a.png",
      `${ORIGIN}/storage/v1/object/public/sellers/logos/a.png`,
      `${ORIGIN}/storage/v1/object/public/products/a.png?v=2`,
      `${ORIGIN}/storage/v1/object/public/products/../sellers/a.png`,
      `${ORIGIN}/storage/v1/object/sign/products/a.png`,
      `${ORIGIN}/storage/v1/object/public/products`,
      `${ORIGIN}.evil.com/storage/v1/object/public/products/a.png`,
      "https://images.pexels.com/a.jpg",
    ]) {
      expect(ownShareImageSource(url, ORIGIN), url).toBeNull();
    }
    expect(ownShareImageSource(`${ORIGIN}/storage/v1/object/public/products/a.png`, null)).toBeNull();
  });

  it("takes our project from the env, project id first", () => {
    expect(ownStorageOrigin({ NEXT_PUBLIC_SUPABASE_PROJECT_ID: "abc123" })).toBe(ORIGIN);
    expect(ownStorageOrigin({ NEXT_PUBLIC_SUPABASE_URL: "https://abc123.supabase.co/" })).toBe(ORIGIN);
    expect(ownStorageOrigin({ NEXT_PUBLIC_SUPABASE_PROJECT_ID: "bad.host/x", NEXT_PUBLIC_SUPABASE_URL: "http://x.co" })).toBeNull();
    expect(ownStorageOrigin({})).toBeNull();
  });
});

describe("socialShareImage", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("points a product photo at the share image route on the page's own host, as a 1200×630 JPEG", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PROJECT_ID", "abc123");
    const expected = { url: "https://sandy.tallaby.com/api/share-image/products/2026-09-10/foo.png", width: 1200, height: 630, type: "image/jpeg" };
    expect(socialShareImage("2026-09-10/foo.png", "https://sandy.tallaby.com")).toEqual(expected);
    expect(socialShareImage(`${ORIGIN}/storage/v1/object/public/products/2026-09-10/foo.png`, "https://sandy.tallaby.com/")).toEqual(expected);
    // The route refuses a query string, so the URL must never carry one.
    expect(new URL(socialShareImage("2026-09-10/foo.png", "https://sandy.tallaby.com").url).search).toBe("");
    expect(shareImageRoutePath("products", "2026-09-10/foo.png")).not.toMatch(/[?#]/);
  });

  it("passes any other URL through unchanged, with no size", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PROJECT_ID", "abc123");
    expect(socialShareImage("https://images.pexels.com/a.jpg", "https://shop.com")).toEqual({ url: "https://images.pexels.com/a.jpg" });
    const other = "https://zzz.supabase.co/storage/v1/object/public/products/a.jpg";
    expect(socialShareImage(other, "https://shop.com")).toEqual({ url: other });
  });
});
