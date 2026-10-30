import { z } from "zod";

/**
 * Web Push core shared by the seller dashboard (F-06, 0124) and the admin app
 * (F-06e, 0131): VAPID config, the push-service allowlist, payload shape and
 * the browser subscription schema. Pure; the sender is in push.server.ts.
 */

export type VapidConfig = { publicKey: string; privateKey: string; subject: string };

const VAPID_KEY_RE = /^[A-Za-z0-9_-]+={0,2}$/;

/**
 * The VAPID keys from server env. Null (feature hidden, sender a no-op)
 * unless all three are set and look valid. The subject must be a mailto: or
 * https: URL (web-push requires it).
 */
export function parseVapidConfig(env: Record<string, string | undefined>): VapidConfig | null {
  const publicKey = env.VAPID_PUBLIC_KEY?.trim() || env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
  const privateKey = env.VAPID_PRIVATE_KEY?.trim() ?? "";
  const subject = env.VAPID_SUBJECT?.trim() ?? "";
  if (!VAPID_KEY_RE.test(publicKey) || publicKey.length < 80 || publicKey.length > 100) return null;
  if (!VAPID_KEY_RE.test(privateKey) || privateKey.length < 40 || privateKey.length > 50) return null;
  if (!/^(mailto:\S+@\S+|https:\/\/\S+)$/.test(subject)) return null;
  return { publicKey, privateKey, subject };
}

/**
 * Push services the browsers use (Chrome/Edge/Android: FCM; Firefox:
 * Mozilla autopush; Edge legacy: WNS; Safari/iOS: Apple). The sender POSTs to
 * the endpoint, so anything else is refused: a forged endpoint can't turn
 * the dispatcher into a request proxy.
 */
const PUSH_HOST_SUFFIXES = [
  "fcm.googleapis.com",
  "android.googleapis.com",
  "push.services.mozilla.com",
  "notify.windows.com",
  "push.apple.com",
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  return PUSH_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

/** A path inside the app, never another origin (`//x`, `/\x`, `https:`). */
export function safePushPath(path: string | null | undefined): string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return "/";
  return path.length > 500 ? "/" : path;
}

/** The push service says the subscription is gone: delete it. */
export function isGonePushStatus(statusCode: unknown): boolean {
  return statusCode === 404 || statusCode === 410;
}

/** Web Push TTL: a device that is off for longer than this never shows a stale alert. */
export const PUSH_TTL_SECONDS = 60 * 60;

export type PushLocale = "ar" | "en";

/** What each app's service worker (`public/sw.js`) reads from a push. */
export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  lang: PushLocale;
  dir: "rtl" | "ltr";
};

export function clipPushText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const base64Url = (max: number) => z.string().min(1).max(max).regex(/^[A-Za-z0-9_-]+={0,2}$/);

/** `PushSubscription.toJSON()` from the browser. Only known push services are accepted. */
export const pushSubscriptionInputSchema = z.object({
  endpoint: z
    .string()
    .max(1000)
    .refine((value) => isAllowedPushEndpoint(value), "endpoint"),
  keys: z.object({
    p256dh: base64Url(200),
    auth: base64Url(100),
  }),
});
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionInputSchema>;

export const pushEndpointInputSchema = z.string().max(1000).refine((value) => isAllowedPushEndpoint(value));
