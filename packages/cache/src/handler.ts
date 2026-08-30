import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Constant-time secret comparison. Hashing both sides to a fixed-length
 * digest first avoids timingSafeEqual's "different length" throw (which
 * would itself leak length information) when the provided header is empty
 * or a different length than the configured secret.
 */
function secretsMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

interface RevalidatePathEntry {
  path: string;
  type?: "layout" | "page";
}

function isPathEntry(v: unknown): v is RevalidatePathEntry {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as RevalidatePathEntry).path === "string"
  );
}

/**
 * Builds the POST handler for each app's app/api/revalidate/route.ts.
 *
 * Receives a broadcast from a peer deployment (see packages/cache/src/broadcast.ts)
 * and applies it LOCALLY ONLY — it must not re-broadcast, or two apps
 * invalidating each other would loop forever.
 *
 * Hardening vs. the original ecommerce-only route this replaces:
 *   - POST only (no GET alias — the old route let you purge caches with a
 *     secret sitting in a browser-history-visible URL)
 *   - secret via header only (no ?secret= query param)
 *   - constant-time comparison
 *   - JSON body instead of a comma-joined query string
 */
export function createRevalidateRouteHandler() {
  async function POST(req: Request): Promise<Response> {
    const secret = process.env.REVALIDATE_SECRET;
    if (!secret) {
      return Response.json(
        { ok: false, error: "REVALIDATE_SECRET not configured" },
        { status: 500 }
      );
    }

    const provided = req.headers.get("x-revalidate-secret") ?? "";
    if (!provided || !secretsMatch(provided, secret)) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: { tags?: unknown; paths?: unknown; from?: unknown };
    try {
      body = await req.json();
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const tags = Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === "string")
      : [];
    const paths = Array.isArray(body.paths) ? body.paths.filter(isPathEntry) : [];

    if (tags.length === 0 && paths.length === 0) {
      return Response.json(
        { ok: false, error: "No tags or paths provided" },
        { status: 400 }
      );
    }

    for (const tag of tags) revalidateTag(tag, "max");
    for (const { path, type } of paths) revalidatePath(path, type);

    return Response.json({ ok: true, revalidated: { tags, paths }, from: body.from });
  }

  return { POST };
}
