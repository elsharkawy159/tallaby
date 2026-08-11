import { NextRequest, NextResponse } from "next/server";
import { validateAndConsumeDownload } from "@workspace/lib/digital";
import { getCurrentUserId } from "@/lib/get-current-user-id";

/**
 * Secure digital delivery endpoint. Never exposes a raw storage URL directly:
 * every hit re-validates ownership/expiry/download-limit against the DB and
 * mints a fresh, short-lived signed URL (or set of them) on the spot.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return errorPage(404, "Download link not found");
  }

  const requesterUserId = await getCurrentUserId();
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent");

  const result = await validateAndConsumeDownload(token, {
    ipAddress: ipAddress ?? undefined,
    userAgent: userAgent ?? undefined,
    requesterUserId: requesterUserId ?? undefined,
  });

  if (!result.success) {
    return errorPage(result.status, result.error);
  }

  const { payload } = result;

  // Simple, single-file products: redirect straight to the signed file URL.
  if (
    payload.files.length === 1 &&
    !payload.licenseKey &&
    !payload.externalUrl &&
    !payload.courseContent
  ) {
    return NextResponse.redirect(payload.files[0]!.url, { status: 302 });
  }

  // Bundles, license keys, external access, and courses need more than one
  // link/value shown at once — render a minimal access page instead.
  return new NextResponse(renderAccessPage(payload), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function errorPage(status: number, message: string) {
  return new NextResponse(
    `<!doctype html><html><body style="font-family:system-ui;padding:48px;text-align:center;color:#3d3d3d">
      <h2>${status === 404 ? "Not found" : "Access unavailable"}</h2>
      <p>${escapeHtml(message)}</p>
    </body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function renderAccessPage(payload: {
  files: { name: string; url: string }[];
  licenseKey?: string | null;
  externalUrl?: string | null;
  accessInstructions?: string | null;
  courseContent?: unknown;
}) {
  const rows: string[] = [];

  if (payload.licenseKey) {
    rows.push(
      `<div style="margin:16px 0;padding:16px;background:#fff5f0;border-radius:8px"><strong>License key:</strong> <code>${escapeHtml(
        payload.licenseKey
      )}</code></div>`
    );
  }

  if (payload.externalUrl) {
    rows.push(
      `<div style="margin:16px 0"><a href="${escapeHtml(
        payload.externalUrl
      )}" style="display:inline-block;padding:12px 20px;background:#2a2a2a;color:#fff;border-radius:6px;text-decoration:none">Open external access</a></div>`
    );
  }

  for (const file of payload.files) {
    rows.push(
      `<div style="margin:8px 0"><a href="${escapeHtml(
        file.url
      )}" style="display:inline-block;padding:10px 16px;background:#2a2a2a;color:#fff;border-radius:6px;text-decoration:none">Download ${escapeHtml(
        file.name
      )}</a></div>`
    );
  }

  if (payload.accessInstructions) {
    rows.push(`<p style="color:#555">${escapeHtml(payload.accessInstructions)}</p>`);
  }

  return `<!doctype html><html><body style="font-family:system-ui;max-width:520px;margin:48px auto;padding:0 24px;color:#3d3d3d">
    <h2>Your access is ready</h2>
    ${rows.join("\n")}
    <p style="font-size:12px;color:#999;margin-top:32px">Links on this page are single-use and expire quickly — reopen from "My Digital Products" if you need them again.</p>
  </body></html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
