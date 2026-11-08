/**
 * Browser-only: the strongest colours of an uploaded logo (AI Store Builder
 * v2, spec §6.2). Draws the image at ≤ 128 px and hands the pixels to the
 * pure `dominantColorsFromPixels`. No model call, nothing leaves the browser.
 * SVG is refused (it can carry scripts and has no fixed pixels).
 */
import { dominantColorsFromPixels } from "@workspace/store-sections/logo-colors";

const MAX_SIDE = 128;
const ACCEPTED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);

/** Up to 3 hex colours, strongest first; [] when the logo has no usable colour. Throws `unsupported_image` for SVG or a non-image. */
export async function readLogoColors(file: File | Blob): Promise<string[]> {
  if (!ACCEPTED.has(file.type)) throw new Error("unsupported_image");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height, 1));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = drawingContext(width, height);
    if (!ctx) return [];
    ctx.drawImage(bitmap, 0, 0, width, height);
    return dominantColorsFromPixels(ctx.getImageData(0, 0, width, height).data);
  } finally {
    bitmap.close();
  }
}

function drawingContext(
  width: number,
  height: number,
): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height).getContext("2d", { willReadFrequently: true });
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext("2d", { willReadFrequently: true });
}
