import { NextResponse, type NextRequest } from "next/server";
import { digitalDownloadUrl } from "@workspace/lib/digital/access";
import { downloadHeaders } from "@/app/d/[token]/download-page.lib";

/**
 * Links sent before F-108c point here. They now open the download page
 * (`/d/<token>`), which shows the files and uses the link only on its
 * button, never on this GET. Same path segment, so the token never changes.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lang = request.nextUrl.searchParams.get("lang");
  const target = digitalDownloadUrl(token, { lang: lang === "ar" || lang === "en" ? lang : null });
  return new NextResponse(null, { status: 308, headers: { ...downloadHeaders(null), Location: target } });
}
