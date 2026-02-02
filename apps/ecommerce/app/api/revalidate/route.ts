import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  // ✅ Security: keep this secret ONLY on server-side callers (backend / cron / etc.)
  const secret =
    new URL(req.url).searchParams.get("secret") ||
    req.headers.get("x-revalidate-secret");

  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const tagsParam = url.searchParams.get("tags"); // "tickets,trending-matches"

  if (!tagsParam) {
    return NextResponse.json(
      { ok: false, error: "Missing tags query param" },
      { status: 400 }
    );
  }

  const tags = tagsParam
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!tags.length) {
    return NextResponse.json(
      { ok: false, error: "No valid tags provided" },
      { status: 400 }
    );
  }

  // Revalidate all tags
  for (const tag of tags) revalidateTag(tag);

  return NextResponse.json({
    ok: true,
    revalidated: tags,
  });
}

// Optional: allow GET too (handy for quick testing), but POST is safer.
export async function GET(req: Request) {
  return POST(req);
}
