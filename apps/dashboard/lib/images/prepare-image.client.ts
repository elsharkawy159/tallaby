"use client";

import { validateImage } from "@/lib/utils";
import { classifyImageFile, keptFileName, replaceExtension } from "./image-format.lib";

/** Longest side and quality of a converted product photo. */
const CONVERT_MAX_SIDE = 2400;
const CONVERT_QUALITY = 0.9;

function loadImage (file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    image.src = url;
  });
}

/** A JPEG copy whose longest side is at most `maxSide` (white behind transparency). Throws when the browser can't decode it. */
export async function toJpeg (file: Blob, maxSide: number, quality = 0.85): Promise<Blob> {
  const image = await loadImage(file);
  if (!image.naturalWidth || !image.naturalHeight) throw new Error("image");
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("blob"))), "image/jpeg", quality)
  );
}

/** The photo as a JPEG `File` named `<base>.jpg`. Throws `imageUnreadable` when the browser can't decode it. */
export async function convertToJpegFile (file: File): Promise<File> {
  try {
    const jpeg = await toJpeg(file, CONVERT_MAX_SIDE, CONVERT_QUALITY);
    return new File([jpeg], replaceExtension(file.name, "jpg"), { type: "image/jpeg" });
  } catch {
    throw new Error("imageUnreadable");
  }
}

/**
 * Checks a product photo and returns the file to upload: JPEG, PNG, WebP, GIF and
 * AVIF as they are (with a type and extension that match), anything else the
 * browser can decode (HEIC on Safari, BMP, TIFF…) as a JPEG. Rejects with an
 * Error whose message is a "toast" key: `imageFormatInvalid`, `imageTooLarge`
 * or `imageUnreadable`.
 */
export async function prepareImageForUpload (file: File): Promise<File> {
  await validateImage(file);
  const decision = classifyImageFile(file);
  if (decision.kind === "convert") return convertToJpegFile(file);
  if (decision.kind === "keep") {
    const name = keptFileName(file.name, decision.type);
    return name === file.name && file.type === decision.type ? file : new File([file], name, { type: decision.type });
  }
  throw new Error("imageFormatInvalid");
}
