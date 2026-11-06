// Read-only, for the Server Component pages; deliberately not "use server".
import { getServiceClient } from "@workspace/db/supabase/service";
import { getThemeRequestForAdmin, type AdminThemeRequestDetail } from "@workspace/lib/admin/server";
import { THEME_REQUEST_BUCKET } from "@workspace/lib/theme-requests";

export type ThemeRequestWithImages = AdminThemeRequestDetail & { imageUrls: string[] };

/** One request, with short-lived signed links to its images (private bucket, service role). */
export async function getThemeRequestWithImages(requestId: string): Promise<ThemeRequestWithImages | null> {
  const request = await getThemeRequestForAdmin(requestId);
  if (!request) return null;
  let imageUrls: string[] = [];
  if (request.imagePaths.length) {
    const { data } = await getServiceClient().storage.from(THEME_REQUEST_BUCKET).createSignedUrls(request.imagePaths, 60 * 30);
    imageUrls = (data ?? []).map((item) => item.signedUrl).filter((url): url is string => Boolean(url));
  }
  return { ...request, imageUrls };
}
