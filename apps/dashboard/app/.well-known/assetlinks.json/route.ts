export const dynamic = "force-dynamic";

/**
 * Digital Asset Links for the Android app (Trusted Web Activity,
 * docs/android-app.md). Android checks this file to prove the Play app and
 * dashboard.tallaby.com belong together; without it the app shows a browser
 * address bar.
 *
 * ANDROID_APP_PACKAGE: the app's package id, e.g. com.tallaby.seller.
 * ANDROID_APP_SHA256_FINGERPRINTS: comma-separated SHA-256 signing-key
 * fingerprints (the upload key AND the Play App Signing key from Play
 * Console › Setup › App integrity). Public values, not secrets.
 */
export function GET() {
  const packageName = process.env.ANDROID_APP_PACKAGE?.trim();
  const fingerprints = (process.env.ANDROID_APP_SHA256_FINGERPRINTS ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(value));

  const body =
    packageName && fingerprints.length > 0
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: packageName,
              sha256_cert_fingerprints: fingerprints,
            },
          },
        ]
      : [];

  return Response.json(body, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
