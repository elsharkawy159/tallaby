import { NextResponse, type NextRequest } from "next/server";
import { consumeDigitalDownload, getDigitalDownloadView } from "@workspace/lib/digital";
import { DIGITAL_SIGNED_URL_TTL_SECONDS } from "@workspace/lib/digital/access";
import { getClientIp } from "@workspace/lib/http/client-ip";
import { isAccountHost } from "@workspace/lib/storefront/platform-hosts";
import {
  downloadHeaders,
  pickDownloadLocale,
  renderErrorPage,
  renderLandingPage,
  renderReadyPage,
  renderUnavailablePage,
  shouldRedirectToFile,
} from "./download-page.lib";

/**
 * The buyer's one-time download link, `account.<root>/d/<token>` (F-108c).
 *
 * GET only reads: WhatsApp, Gmail and other link previewers fetch links, and
 * must never use one up. POST (the page's one button) uses it up atomically
 * and hands over the files. The token is the only secret; no sign-in, since
 * a store customer may open it signed in to another account or none. Every
 * link that can't be used answers the same 404 page. Every response is
 * noindex, no-store and no-referrer.
 */

type Params = { params: Promise<{ token: string }> };

function html(status: number, body: string) {
  return new NextResponse(body, { status, headers: downloadHeaders() });
}

function localeOf(request: NextRequest, buyerLanguage?: string | null) {
  return pickDownloadLocale({
    lang: request.nextUrl.searchParams.get("lang"),
    buyerLanguage,
    acceptLanguage: request.headers.get("accept-language"),
  });
}

export async function GET(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!isAccountHost(request.headers.get("host"))) return html(404, renderUnavailablePage(localeOf(request)));

  const view = await getDigitalDownloadView(token);
  if (!view) return html(404, renderUnavailablePage(localeOf(request)));

  return html(
    200,
    renderLandingPage({
      locale: localeOf(request, view.buyerLanguage),
      token,
      productName: view.productName,
      storeName: view.storeName,
      files: view.files.map((file) => ({ name: file.name, size: file.size })),
    }),
  );
}

export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!isAccountHost(request.headers.get("host"))) return html(404, renderUnavailablePage(localeOf(request)));

  const result = await consumeDigitalDownload(token, {
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });
  if (!result.ok) {
    const locale = localeOf(request);
    return result.reason === "storage_error" ? html(503, renderErrorPage(locale)) : html(404, renderUnavailablePage(locale));
  }

  if (shouldRedirectToFile(result)) {
    return new NextResponse(null, { status: 303, headers: { ...downloadHeaders(null), Location: result.files[0]!.url } });
  }

  return html(
    200,
    renderReadyPage({
      locale: localeOf(request, result.view.buyerLanguage),
      productName: result.view.productName,
      files: result.files,
      licenseKey: result.licenseKey,
      externalUrl: result.externalUrl,
      accessInstructions: result.accessInstructions,
      linkMinutes: Math.round(DIGITAL_SIGNED_URL_TTL_SECONDS / 60),
    }),
  );
}
