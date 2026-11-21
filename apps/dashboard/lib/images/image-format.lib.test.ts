import { describe, expect, it } from "vitest";
import {
  classifyImageFile,
  fileExtension,
  isAcceptedImageFile,
  keptFileName,
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_ACCEPT_ATTR,
  replaceExtension,
} from "./image-format.lib";

describe("classifyImageFile", () => {
  it.each([
    ["a.jpg", "image/jpeg"],
    ["a.png", "image/png"],
    ["a.webp", "image/webp"],
    ["a.gif", "image/gif"],
    ["a.avif", "image/avif"],
    ["A.JPG", "IMAGE/JPEG"],
  ])("keeps %s (%s) as it is", (name, type) => {
    expect(classifyImageFile({ name, type })).toEqual({ kind: "keep", type: type.toLowerCase() });
  });

  it.each([
    ["IMG_1.HEIC", "image/heic"],
    ["IMG_1.heif", "image/heif"],
    ["scan.bmp", "image/bmp"],
    ["scan.bmp", "image/x-ms-bmp"],
    ["scan.tif", "image/tiff"],
    ["photo.jxl", "image/jxl"],
  ])("converts %s (%s) to JPEG", (name, type) => {
    expect(classifyImageFile({ name, type })).toEqual({ kind: "convert" });
  });

  it("uses the extension when the browser gives no type", () => {
    expect(classifyImageFile({ name: "IMG_2041.HEIC", type: "" })).toEqual({ kind: "convert" });
    expect(classifyImageFile({ name: "scan.tiff", type: "application/octet-stream" })).toEqual({ kind: "convert" });
    expect(classifyImageFile({ name: "photo.jpeg", type: "" })).toEqual({ kind: "keep", type: "image/jpeg" });
    expect(classifyImageFile({ name: "photo.webp", type: "" })).toEqual({ kind: "keep", type: "image/webp" });
  });

  it("rejects SVG by type or extension", () => {
    expect(classifyImageFile({ name: "logo.svg", type: "image/svg+xml" })).toEqual({ kind: "reject" });
    expect(classifyImageFile({ name: "logo.svg", type: "" })).toEqual({ kind: "reject" });
    expect(classifyImageFile({ name: "logo.svgz", type: "image/png" })).toEqual({ kind: "reject" });
    expect(classifyImageFile({ name: "logo.png", type: "image/svg+xml" })).toEqual({ kind: "reject" });
  });

  it("rejects files that are not images", () => {
    expect(classifyImageFile({ name: "doc.pdf", type: "application/pdf" })).toEqual({ kind: "reject" });
    expect(classifyImageFile({ name: "clip.mp4", type: "video/mp4" })).toEqual({ kind: "reject" });
    expect(classifyImageFile({ name: "notes", type: "" })).toEqual({ kind: "reject" });
    expect(classifyImageFile({ name: "data.bin", type: "application/octet-stream" })).toEqual({ kind: "reject" });
    expect(isAcceptedImageFile({ name: "doc.pdf", type: "application/pdf" })).toBe(false);
    expect(isAcceptedImageFile({ name: "IMG.HEIC", type: "" })).toBe(true);
  });
});

describe("file names", () => {
  it("reads the extension", () => {
    expect(fileExtension("a.b.JPG")).toBe("jpg");
    expect(fileExtension("noext")).toBe("");
    expect(fileExtension(".hidden")).toBe("");
    expect(fileExtension("trailing.")).toBe("");
  });

  it("renames a converted photo to .jpg", () => {
    expect(replaceExtension("IMG_2041.HEIC", "jpg")).toBe("IMG_2041.jpg");
    expect(replaceExtension("scan.final.tiff", "jpg")).toBe("scan.final.jpg");
    expect(replaceExtension("noext", "jpg")).toBe("noext.jpg");
    expect(replaceExtension(".heic", "jpg")).toBe(".heic.jpg");
    expect(replaceExtension("", "jpg")).toBe("photo.jpg");
  });

  it("keeps a matching name and fixes one that doesn't fit the type", () => {
    expect(keptFileName("a.jpeg", "image/jpeg")).toBe("a.jpeg");
    expect(keptFileName("a.png", "image/png")).toBe("a.png");
    expect(keptFileName("photo", "image/webp")).toBe("photo.webp");
    expect(keptFileName("photo.dat", "image/avif")).toBe("photo.avif");
  });
});

describe("accept lists", () => {
  it("lists every format, including HEIC by extension, and no SVG", () => {
    const extensions = Object.values(PRODUCT_IMAGE_ACCEPT).flat();
    for (const ext of [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".heic", ".heif", ".bmp", ".tif", ".tiff"]) {
      expect(extensions).toContain(ext);
    }
    expect(extensions).not.toContain(".svg");
    expect(PRODUCT_IMAGE_ACCEPT_ATTR.split(",")).toContain("image/*");
    expect(PRODUCT_IMAGE_ACCEPT_ATTR).toContain(".heic");
  });
});
