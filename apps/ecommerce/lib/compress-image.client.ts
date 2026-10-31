/**
 * Shrinks a photo in the browser so it fits a server action request (1 MB by
 * default in Next.js): at most `maxSide` px on the long side, re-encoded as
 * JPEG, lowering the quality until it is under `maxBytes`. Returns the file
 * unchanged when it already fits or the browser cannot decode it (the server
 * still checks size and type).
 */
export async function compressImage(file: File, { maxSide = 1600, maxBytes = 900 * 1024 } = {}): Promise<File> {
  if (file.size <= maxBytes && /^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= maxBytes) {
      return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    }
  }
  return file;
}
