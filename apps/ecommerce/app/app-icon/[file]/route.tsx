import { ImageResponse } from "next/og";
import { appInitials, STORE_APP_ICON_SIZES, type StoreAppIconSize } from "@workspace/lib/stores/app";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { getRequestStoreApp } from "@/lib/store-app.server";

/** Formats ImageResponse (satori) can draw; .ico and .webp fall through to the next image. */
const DRAWABLE = new Set(["image/png", "image/jpeg", "image/gif", "image/svg+xml"]);
const MAX_BYTES = 2 * 1024 * 1024;

/** The image as a data URI when it can be drawn, else null. */
async function drawableImage(path: string): Promise<string | null> {
  try {
    const url = /^https?:\/\//.test(path) ? path : getPublicUrl(path, "sellers");
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const type = res.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!res.ok || !DRAWABLE.has(type)) return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) return null;
    return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Icons of a store's app (ROADMAP.md F-36): `/app-icon/{180|192|512}.png` on
 * the store host, square PNGs drawn from the store's favicon (else its logo)
 * on white; `?maskable=1` pads it for Android's round masks. A store with no
 * drawable image gets its initials (a bag for non-Latin names: the built-in
 * font has no Arabic). Not a store host → 404. The manifest adds `?v=` from
 * the image and name, so a new favicon gets a new URL.
 */
export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const size = Number(/^(\d+)\.png$/.exec(file)?.[1]) as StoreAppIconSize;
  if (!STORE_APP_ICON_SIZES.includes(size)) return new Response("Not found", { status: 404 });

  const app = await getRequestStoreApp();
  if (!app) return new Response("Not found", { status: 404 });
  const { store } = app;
  const maskable = new URL(request.url).searchParams.get("maskable") === "1";

  let image: string | null = null;
  for (const path of [store.faviconUrl, store.logoUrl]) {
    if (path && (image = await drawableImage(path))) break;
  }

  // Maskable icons keep the art inside the 80 % safe zone.
  const pad = Math.round(size * (maskable ? 0.18 : image ? 0.08 : 0));
  const initials = appInitials(store.displayName);
  const latin = /^[A-Z0-9]+$/.test(initials);

  return new ImageResponse(
    image ? (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", padding: pad }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- satori draws plain img */}
        <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    ) : (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111827", color: "#ffffff" }}>
        {latin ? (
          <span style={{ fontSize: Math.round(size * (maskable ? 0.32 : 0.42)), fontWeight: 700 }}>{initials}</span>
        ) : (
          <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        )}
      </div>
    ),
    {
      width: size,
      height: size,
      headers: {
        // Versioned by the manifest (?v=), so a changed favicon is a new URL.
        "Cache-Control": new URL(request.url).searchParams.has("v")
          ? "public, max-age=31536000, immutable"
          : "public, max-age=3600",
      },
    },
  );
}
