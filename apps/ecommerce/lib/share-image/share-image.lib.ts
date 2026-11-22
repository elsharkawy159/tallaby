/**
 * The social share (Open Graph) image route, `/api/share-image/<bucket>/<path>`
 * (app/api/share-image/[bucket]/[...path]/route.ts): it crops one of our own
 * public storage objects to the 1200×630 share card with sharp, so link
 * previews no longer go through Supabase image transformations (billed per
 * origin image). Pure, so the route and the metadata share one rule set.
 *
 * `/api/` is outside the proxy matcher (proxy.ts), so the route answers the
 * same on tallaby.com, store subdomains, seller domains and account./preview.
 */

/** Where the route lives on every host. */
export const SHARE_IMAGE_ROUTE = "/api/share-image";

/** The 1200×630 share card size every link preview (Facebook, WhatsApp, X, LinkedIn) lays out best. */
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** The route always answers JPEG. */
export const SHARE_IMAGE_TYPE = "image/jpeg";

/** The public buckets the route may read: only product photos use it. */
export const SHARE_IMAGE_BUCKETS = ["products"] as const;
export type ShareImageBucket = (typeof SHARE_IMAGE_BUCKETS)[number];

export const SHARE_IMAGE_PATH_MAX = 512;
const MAX_SEGMENTS = 12;
/** Letters, digits, `_` and `-` first (so never `.` or `..`), then also dots. */
const SEGMENT_RE = /^[A-Za-z0-9_-][A-Za-z0-9._-]{0,199}$/;

export function isShareImageBucket(bucket: string): bucket is ShareImageBucket {
  return (SHARE_IMAGE_BUCKETS as readonly string[]).includes(bucket);
}

/**
 * A storage path the route may fetch: relative ("2026-09-10/foo.png" or
 * "<sellerId>/<date>/<name>"), URL-safe characters only, no empty, `.` or `..`
 * segment, at most SHARE_IMAGE_PATH_MAX characters. Anything else is refused,
 * so a request can never point the fetch anywhere but this bucket.
 */
export function isValidShareImagePath(path: string): boolean {
  if (!path || path.length > SHARE_IMAGE_PATH_MAX) return false;
  const segments = path.split("/");
  return segments.length <= MAX_SEGMENTS && segments.every((segment) => SEGMENT_RE.test(segment));
}

/**
 * Our own Supabase project's origin, the same one `getPublicUrl` builds public
 * URLs on (`NEXT_PUBLIC_SUPABASE_PROJECT_ID`), else `NEXT_PUBLIC_SUPABASE_URL`.
 */
export function ownStorageOrigin(env: Record<string, string | undefined> = process.env): string | null {
  const projectId = env.NEXT_PUBLIC_SUPABASE_PROJECT_ID?.trim();
  if (projectId && /^[a-z0-9]+$/i.test(projectId)) return `https://${projectId}.supabase.co`;
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.origin : null;
  } catch {
    return null;
  }
}

const PUBLIC_PREFIX = "/storage/v1/object/public/";

/** The public URL of an object in our storage, from a validated bucket and path only. */
export function storageObjectUrl(origin: string, bucket: ShareImageBucket, path: string): string {
  return `${origin}${PUBLIC_PREFIX}${bucket}/${path}`;
}

/**
 * The bucket and path of a public URL on our own storage that the route may
 * serve, else null (another host or project, another bucket, a query string,
 * or a path the route would refuse).
 */
export function ownShareImageSource(url: string, origin: string | null): { bucket: ShareImageBucket; path: string } | null {
  if (!origin) return null;
  const prefix = `${origin}${PUBLIC_PREFIX}`;
  if (!url.startsWith(prefix) || /[?#]/.test(url)) return null;
  const rest = url.slice(prefix.length);
  const slash = rest.indexOf("/");
  if (slash <= 0) return null;
  const bucket = rest.slice(0, slash);
  const path = rest.slice(slash + 1);
  if (!isShareImageBucket(bucket) || !isValidShareImagePath(path)) return null;
  return { bucket, path };
}

/** The route's path for one object (its characters are all URL-safe already). */
export function shareImageRoutePath(bucket: ShareImageBucket, path: string): string {
  return `${SHARE_IMAGE_ROUTE}/${bucket}/${path}`;
}
