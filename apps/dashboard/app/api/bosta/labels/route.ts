import { type NextRequest, NextResponse } from "next/server";
import { getBostaLabels } from "@workspace/lib/shipping/bosta-orders";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Bosta labels (AWB) as one PDF for up to 50 orders of one store (BS-12):
 * `/api/bosta/labels?storeId=…&orders=id,id&type=A6|A4&lang=ar|en`. The
 * store must be the session seller's; the lib keeps only that store's Bosta
 * shipments. Opened in a new tab, so errors come back as short text.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const storeId = params.get("storeId") ?? "";
  const orderIds = (params.get("orders") ?? "").split(",").filter((id) => UUID.test(id));
  const type = params.get("type") === "A4" ? "A4" : "A6";
  const lang = params.get("lang") === "en" ? "en" : "ar";
  if (!UUID.test(storeId) || orderIds.length === 0) return new NextResponse("Bad request", { status: 400 });

  try {
    const { seller, store } = await requireStore(storeId);
    const result = await getBostaLabels(seller.sellerId, store.id, orderIds, { type, lang });
    if (!result.ok) {
      const status = result.error === "not_found" || result.error === "not_connected" ? 404 : result.error === "too_many" ? 400 : 502;
      return new NextResponse(`Bosta labels: ${result.error}`, { status });
    }
    return new NextResponse(Buffer.from(result.pdfBase64, "base64"), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bosta-labels-${type}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (isAccessError(error)) return new NextResponse("Not found", { status: 404 });
    console.error("[bosta] labels failed", (error as Error)?.name);
    return new NextResponse("Something went wrong", { status: 500 });
  }
}
