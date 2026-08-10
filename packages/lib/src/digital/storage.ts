import { getServiceClient, DIGITAL_PRODUCTS_BUCKET } from "@workspace/db/supabase/service";

/** Max lifetime for a minted download URL, per security requirement (STG-03). */
export const SIGNED_URL_EXPIRY_SECONDS = 60;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

/**
 * Uploads a digital asset to the private `digital-products` bucket via the
 * service-role client. Returns the storage path only — never a public URL.
 * Callers must persist the returned `path`, not attempt to construct a URL.
 */
export async function uploadDigitalFile(params: {
  sellerId: string;
  file: File;
}): Promise<{ path: string; fileName: string; fileSize: number; fileType: string }> {
  const { sellerId, file } = params;
  const supabase = getServiceClient();

  const fileName = file.name;
  const path = `${sellerId}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(DIGITAL_PRODUCTS_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload digital file: ${error.message}`);
  }

  return {
    path,
    fileName,
    fileSize: file.size,
    fileType: file.type || "application/octet-stream",
  };
}

export async function deleteDigitalFile(path: string) {
  const supabase = getServiceClient();
  const { error } = await supabase.storage.from(DIGITAL_PRODUCTS_BUCKET).remove([path]);
  if (error) {
    console.error("deleteDigitalFile: failed to remove", path, error.message);
  }
}

/**
 * Mints a short-lived signed URL for a stored object. Never cache or persist
 * the result — generate fresh on every access (STG-02, STG-03).
 */
export async function getSignedUrlForPath(
  path: string,
  expiresInSeconds: number = SIGNED_URL_EXPIRY_SECONDS
): Promise<string> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.storage
    .from(DIGITAL_PRODUCTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? "unknown error"}`);
  }

  return data.signedUrl;
}
