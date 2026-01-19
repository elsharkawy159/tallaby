import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/supabase/server";

const bodySchema = z.object({
  urls: z.array(z.string().url()).min(1),
});

const MAX_BYTES = 2 * 1024 * 1024; // 2MB (match UI expectation)

const uniq = (items: string[]) => Array.from(new Set(items));

const contentTypeToExtension = (contentType: string) => {
  const ct = contentType.toLowerCase().split(";")[0]?.trim() || "";
  if (ct === "image/jpeg") return "jpg";
  if (ct === "image/png") return "png";
  if (ct === "image/webp") return "webp";
  return undefined;
};

const isAllowedImageType = (contentType: string) => {
  const ct = contentType.toLowerCase().split(";")[0]?.trim() || "";
  return ct === "image/jpeg" || ct === "image/png" || ct === "image/webp";
};

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Image URLs are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const urls = uniq(parsed.data.urls).slice(0, 5);
    const uploadedPaths: string[] = [];
    const skipped: Array<{ url: string; reason: string }> = [];

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          redirect: "follow",
          headers: {
            accept: "image/*,*/*;q=0.8",
            "user-agent":
              "Mozilla/5.0 (compatible; TallabyDashboardBot/1.0; +https://tallaby.local)",
          },
        });

        if (!res.ok) {
          skipped.push({ url, reason: `Failed to download (status ${res.status})` });
          continue;
        }

        const contentType = res.headers.get("content-type") || "";
        if (!isAllowedImageType(contentType)) {
          skipped.push({ url, reason: `Unsupported image type (${contentType || "unknown"})` });
          continue;
        }

        const contentLength = res.headers.get("content-length");
        const reportedBytes = contentLength ? Number(contentLength) : undefined;
        if (reportedBytes && Number.isFinite(reportedBytes) && reportedBytes > MAX_BYTES) {
          skipped.push({ url, reason: "Image is larger than 2MB" });
          continue;
        }

        const arrayBuffer = await res.arrayBuffer();
        if (arrayBuffer.byteLength > MAX_BYTES) {
          skipped.push({ url, reason: "Image is larger than 2MB" });
          continue;
        }

        const ext = contentTypeToExtension(contentType) || "jpg";
        const folderName = getTodayDate();
        const fileName = `${folderName}/${crypto.randomUUID()}.${ext}`;

        const blob = new Blob([arrayBuffer], { type: contentType || "image/jpeg" });
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("products")
          .upload(fileName, blob, {
            contentType: contentType || "image/jpeg",
            upsert: false,
          });

        if (uploadError || !uploadData?.path) {
          skipped.push({ url, reason: uploadError?.message || "Upload failed" });
          continue;
        }

        uploadedPaths.push(uploadData.path);
      } catch (error) {
        console.error("import-product-images item error:", error);
        skipped.push({ url, reason: "Unexpected error downloading/uploading" });
      }
    }

    return NextResponse.json(
      { paths: uploadedPaths, skipped },
      { status: 200 }
    );
  } catch (error) {
    console.error("import-product-images route error:", error);
    return NextResponse.json(
      { error: "Failed to import product images" },
      { status: 500 }
    );
  }
}

